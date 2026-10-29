import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const port = 3100 + Math.floor(Math.random() * 1000);
let child;
const base = `http://127.0.0.1:${port}`;
async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(`${base}/api/health`); if (r.ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("Server did not start");
}
test("health and challenge lifecycle", async (t) => {
  child = spawn(process.execPath, ["server.js"], { env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" }, stdio: "ignore" });
  t.after(() => child?.kill("SIGTERM"));
  await waitForServer();
  const health = await (await fetch(`${base}/api/health`)).json();
  assert.equal(health.ok, true);
  assert.equal(health.cryptoAuthorization, false);
  const created = await fetch(`${base}/api/challenges`, { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify({actionId:"act_01"}) });
  assert.equal(created.status, 201);
  const challenge = await created.json();
  assert.equal(challenge.status, "PENDING");
  const input = await fetch(`${base}/api/device/input`, { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify({challengeId:challenge.id}) });
  assert.equal(input.status, 202);
  const replay = await fetch(`${base}/api/device/input`, { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify({challengeId:challenge.id}) });
  assert.equal(replay.status, 409);
});