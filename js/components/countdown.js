const pad = (n) => String(n).padStart(2, "0");

function countdownHTML(endMs) {
  return `<div class="countdown" data-end="${endMs}"></div>`;
}

function tick(el) {
  const s = Math.max(0, Math.floor((Number(el.dataset.end) - Date.now()) / 1000));
  if (s === 0) { el.innerHTML = '<div class="folder__note">Almost there. Your photos should be ready any moment.</div>'; return; }
  const parts = [[Math.floor(s / 86400), "days"], [Math.floor(s / 3600) % 24, "hours"],
                 [Math.floor(s / 60) % 60, "min"], [s % 60, "sec"]];
  el.innerHTML = parts.map(([v, l]) => `<div class="countdown__unit">${pad(v)}<small>${l}</small></div>`).join("");
}

let timer;
const stopCountdowns = () => clearInterval(timer);
function startCountdowns(root) {
  clearInterval(timer);
  const els = root.querySelectorAll(".countdown");
  if (!els.length) return;
  els.forEach(tick);
  timer = setInterval(() => els.forEach(tick), 1000);
}
