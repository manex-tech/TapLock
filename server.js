import http from "node:http";
import { readFile } from "node:fs/promises";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const challenges = new Map();
const audit = [];
const consumedNonces = new Set();
const MAX_AUDIT = 100;
const DEMO_ACTIONS = [
  { id: "act_01", title: "Pay API provider", recipient: "near:demo.vendor", amount: "2.00", asset: "NEAR testnet", risk: "LOW", status: "PENDING" },
  { id: "act_02", title: "Transfer to unknown wallet", recipient: "near:unknown-4x91", amount: "50.00", asset: "NEAR testnet", risk: "HIGH", status: "BLOCKED" },
  { id: "act_03", title: "Renew storage service", recipient: "near:demo.storage", amount: "0.50", asset: "NEAR testnet", risk: "LOW", status: "PENDING" }
];
let actions = structuredClone(DEMO_ACTIONS);

function record(type, message, details = {}) {
  audit.unshift({ id: randomUUID(), time: new Date().toISOString(), type, message, details });
  if (audit.length > MAX_AUDIT) audit.length = MAX_AUDIT;
}
function send(res, status, data, headers = {}) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers });
  res.end(JSON.stringify(data));
}
async function bodyJson(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 16_384) throw new Error("Request body too large");
  }
  return raw ? JSON.parse(raw) : {};
}
function canonicalDigest(action) {
  const canonical = JSON.stringify({
    id: String(action.id),
    recipient: String(action.recipient),
    amount: String(action.amount),
    asset: String(action.asset),
    network: "near-testnet"
  });
  return createHash("sha256").update(canonical).digest("hex");
}
function findAction(id) { return actions.find(a => a.id === id); }
function deviceAuthorized(req) {
  const expected = process.env.TAPLOCK_DEVICE_TOKEN || "";
  const supplied = req.headers["x-device-token"] || "";
  if (!expected || typeof supplied !== "string") return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}


const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (req.method === "GET" && url.pathname === "/api/health") {
    return send(res, 200, { ok: true, name: "TapLock", mode: "prototype", cryptoAuthorization: false });
  }
  if (req.method === "GET" && url.pathname === "/api/state") {
    return send(res, 200, { actions, audit, mode: "prototype", cryptoAuthorization: false, executionEnabled: false });
  }
  if (req.method === "POST" && url.pathname === "/api/demo/reset") {
    actions = structuredClone(DEMO_ACTIONS);
    challenges.clear(); consumedNonces.clear(); audit.length = 0;
    record("SYSTEM", "Demo state reset");
    return send(res, 200, { ok: true });
  }
  if (req.method === "POST" && url.pathname === "/api/challenges") {
    try {
      const input = await bodyJson(req);
      const action = findAction(input.actionId);
      if (!action) return send(res, 404, { error: "Action not found" });
      if (action.status === "BLOCKED" || action.status === "APPROVED" || action.status === "DEMO_APPROVED") {
        return send(res, 409, { error: `Action is ${action.status.toLowerCase()}` });
      }
      const challenge = {
        id: randomUUID(), nonce: randomUUID(), actionId: action.id,
        actionDigest: canonicalDigest(action),
        deviceId: "taplock-devkit-01",
        expiresAt: Date.now() + 60_000,
        status: "PENDING"
      };
      challenges.set(challenge.id, challenge);
      record("CHALLENGE", `Challenge created for ${action.title}`, { challengeId: challenge.id, actionId: action.id, digest: challenge.actionDigest });
      return send(res, 201, { ...challenge, expiresAt: new Date(challenge.expiresAt).toISOString() });
    } catch (e) {
      return send(res, 400, { error: "Invalid request", message: e.message });
    }
  }
  if (req.method === "GET" && url.pathname === "/api/device/next-challenge") {
    if (!deviceAuthorized(req)) return send(res, 401, { error: "Device authentication failed. Configure TAPLOCK_DEVICE_TOKEN and x-device-token." });
    const deviceId = String(url.searchParams.get("deviceId") || "");
    if (!deviceId) return send(res, 400, { error: "deviceId is required" });
    const challenge = [...challenges.values()].find(c =>
      c.deviceId === deviceId && c.status === "PENDING" && Date.now() <= c.expiresAt
    );
    if (!challenge) return send(res, 200, { challenge: null });
    const action = findAction(challenge.actionId);
    return send(res, 200, { challenge: {
      id: challenge.id, nonce: challenge.nonce, actionId: challenge.actionId,
      actionDigest: challenge.actionDigest, deviceId: challenge.deviceId,
      expiresAt: new Date(challenge.expiresAt).toISOString(),
      action: action ? { title: action.title, recipient: action.recipient, amount: action.amount, asset: action.asset, risk: action.risk } : null
    }});
  }
  if (req.method === "POST" && url.pathname === "/api/device/input") {
    if (!deviceAuthorized(req)) return send(res, 401, { error: "Device authentication failed. Configure TAPLOCK_DEVICE_TOKEN and x-device-token." });
    try {
      const input = await bodyJson(req);
      const challenge = challenges.get(String(input.challengeId || ""));
      if (!challenge) return send(res, 404, { error: "Unknown challenge" });
      if (String(input.deviceId || "") !== challenge.deviceId) {
        record("REJECT", "Device ID did not match challenge", { challengeId: challenge.id });
        return send(res, 403, { error: "Device ID does not match challenge" });
      }
      if (challenge.status !== "PENDING") return send(res, 409, { error: "Challenge is not pending" });
      if (Date.now() > challenge.expiresAt) {
        challenge.status = "EXPIRED";
        record("REJECT", "Expired challenge rejected", { challengeId: challenge.id });
        return send(res, 410, { error: "Challenge expired" });
      }
      if (consumedNonces.has(challenge.nonce)) {
        record("REJECT", "Replay attempt rejected", { challengeId: challenge.id });
        return send(res, 409, { error: "Replay detected" });
      }
      consumedNonces.add(challenge.nonce);
      consumedNonces.add(challenge.nonce);
      challenge.status = "INPUT_RECEIVED";
      record("PHYSICAL_INPUT", "Physical input received; signature verification is not implemented", {
        challengeId: challenge.id, actionId: challenge.actionId, deviceId: challenge.deviceId
      });
      return send(res, 202, {
        ok: true,
        status: challenge.status,
        message: "Physical input recorded only. Cryptographic approval and transaction execution remain disabled."
      });
    } catch (e) {
      return send(res, 400, { error: "Invalid request", message: e.message });
    }
  }
  if (req.method === "POST" && url.pathname === "/api/demo/approve") {
    try {
      const input = await bodyJson(req);
      const challenge = challenges.get(String(input.challengeId || ""));
      if (!challenge) return send(res, 404, { error: "Unknown challenge" });
      if (String(input.deviceId || "") !== challenge.deviceId) {
        record("REJECT", "Device ID did not match challenge", { challengeId: challenge.id });
        return send(res, 403, { error: "Device ID does not match challenge" });
      }
      if (challenge.status !== "PENDING") return send(res, 409, { error: "Challenge is not pending" });
      if (Date.now() > challenge.expiresAt) {
        challenge.status = "EXPIRED";
        record("REJECT", "Expired challenge rejected", { challengeId: challenge.id });
        return send(res, 410, { error: "Challenge expired" });
      }
      if (consumedNonces.has(challenge.nonce)) return send(res, 409, { error: "Replay detected" });
      consumedNonces.add(challenge.nonce);
      challenge.status = "DEMO_APPROVED";
      const action = findAction(challenge.actionId);
      if (action) action.status = "DEMO_APPROVED";
      record("DEMO", "Demo approval simulated; no real authorization occurred", { challengeId: challenge.id, actionId: challenge.actionId });
      return send(res, 200, { ok: true, status: "DEMO_APPROVED", message: "Demo only. No signature verified and no transaction executed." });
    } catch (e) {
      return send(res, 400, { error: "Invalid request", message: e.message });
    }
  }
  if (req.method === "POST" && url.pathname === "/api/demo/replay") {
    try {
      const input = await bodyJson(req);
      const challenge = challenges.get(String(input.challengeId || ""));
      if (!challenge) return send(res, 404, { error: "Unknown challenge" });
      record("TEST", "Replay/reuse test requested", { challengeId: challenge.id });
      return send(res, 409, { error: "Replay/reuse attempt rejected by challenge state", status: challenge.status });
    } catch (e) {
      return send(res, 400, { error: "Invalid request", message: e.message });
    }
  }

  if (req.method === "GET" || req.method === "HEAD") {
    const requested = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
    const normalized = normalize(requested).replace(/^(\.\.(\/|\\|$))+/, "");
    const filePath = join(HERE, "public", normalized);
    try {
      const data = await readFile(filePath);
      const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml" };
      res.writeHead(200, { "content-type": types[extname(filePath)] || "application/octet-stream", "x-content-type-options": "nosniff" });
      return res.end(req.method === "HEAD" ? undefined : data);
    } catch {
      return send(res, 404, { error: "Not found" });
    }
  }
  return send(res, 404, { error: "Not found" });
});

server.listen(PORT, HOST, () => {
  record("SYSTEM", "TapLock prototype server started");
  console.log(`TapLock running at http://${HOST}:${PORT}`);
});
