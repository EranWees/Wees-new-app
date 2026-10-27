// Calm, short notifications. Usage: showToast("Photos released");
let host;

function showToast(message, ms = 3000) {
  if (!host) {
    host = document.createElement("div");
    host.className = "toast-host";
    host.setAttribute("aria-live", "polite");
    document.body.append(host);
  }
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  host.append(el);
  setTimeout(() => el.remove(), ms);
}
