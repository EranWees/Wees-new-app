const fmtDate = (iso) =>
  new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso + "T00:00:00" : iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

// Escape anything a person typed before putting it into HTML.
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const fmtMoney = (n) => "MWK " + Number(n).toLocaleString("en-GB");
// Only allow web links (blocks javascript: and similar) before putting a URL in HTML or opening it.
const safeUrl = (u) => { try { const x = new URL(u, location.href); return /^https?:$/.test(x.protocol) ? x.href : ""; } catch { return ""; } };
const digits = (v) => String(v ?? "").replace(/\D/g, "");

// Today as YYYY-MM-DD in local time (for date inputs).
function todayISO(offsetDays = 0) {
  const d = new Date(); d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
const pad2 = (n) => String(n).padStart(2, "0");
