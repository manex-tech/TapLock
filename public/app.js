const $ = (s) => document.querySelector(s);
const actionList = $("#action-list");
const auditList = $("#audit-list");
const toast = $("#toast");
let currentChallenge = null;
let toastTimer;
function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3600);
}
async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function renderActions(actions) {
  $("#stat-actions").textContent = actions.filter(a => a.status === "PENDING").length;
  actionList.innerHTML = actions.map(a => {
    const blocked = a.status !== "PENDING";
    return `<article class="action"><div><h3>${escapeHtml(a.title)} <span class="risk ${a.risk === "HIGH" ? "high" : ""}">${escapeHtml(a.risk)} RISK</span></h3><div class="meta"><span>Recipient <b>${escapeHtml(a.recipient)}</b></span><span>Value <b>${escapeHtml(a.amount)} ${escapeHtml(a.asset)}</b></span><span>Status <b>${escapeHtml(a.status)}</b></span></div></div><div class="actions"><button class="btn primary" data-challenge="${escapeHtml(a.id)}" ${blocked ? "disabled" : ""}>Create challenge</button></div></article>`;
  }).join("") || '<div class="empty">No actions in the queue.</div>';
}
function renderAudit(audit) {
  $("#stat-challenges").textContent = audit.filter(e => e.type === "CHALLENGE").length;
  auditList.innerHTML = audit.slice(0, 8).map(e => `<div class="event"><span class="event-type">${escapeHtml(e.type)}</span><p>${escapeHtml(e.message)}</p><time>${new Date(e.time).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"})}</time></div>`).join("") || '<div class="empty">Events will appear here as you use the demo.</div>';
}
async function refresh() {
  try {
    const state = await api("/api/state");
    renderActions(state.actions);
    renderAudit(state.audit);
  } catch (e) { notify(e.message); }
}
actionList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-challenge]");
  if (!button) return;
  button.disabled = true;
  try {
    const challenge = await api("/api/challenges", {method:"POST", body:JSON.stringify({actionId:button.dataset.challenge})});
    currentChallenge = challenge;
    const physical = confirm("Challenge created for 60 seconds.\n\nChoose OK to wait for the connected ESP32. Once it polls the API, briefly press the onboard BOOT button to record a physical-input event.\n\nChoose Cancel to run the browser demo simulation instead.");
    if (physical) {
      notify("Challenge created. Waiting for ESP32 input. Check the device Serial Monitor.");
    } else {
      const result = await api("/api/demo/approve", {method:"POST", body:JSON.stringify({challengeId:challenge.id})});
      notify(result.message);
    }
  } catch (e) { notify(e.message); }
  finally { await refresh(); }
});
$("#reset").addEventListener("click", async () => {
  try { await api("/api/demo/reset", {method:"POST", body:"{}"}); currentChallenge = null; await refresh(); notify("Demo state reset."); }
  catch (e) { notify(e.message); }
});
refresh();
setInterval(refresh, 5000);