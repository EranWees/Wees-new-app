// Photo viewer: ambient blurred backdrop, thumbnail strip, floating bar with Download.
// Usage: openViewer(urls, startIndex)
const sizeOf = (url, w) => url.replace(/([?&]w=)\d+/, `$1${w}`);
const ICON = {
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  prev: '<path d="M15 5l-7 7 7 7"/>', next: '<path d="M9 5l7 7-7 7"/>',
  down: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
};
const svg = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;

let viewer, viewerOpener; // viewer = { el, urls, i, saving }

function closeViewer() {
  if (!viewer) return;
  const { el } = viewer; viewer = null;
  viewerOpener?.focus?.(); viewerOpener = null;
  document.removeEventListener("keydown", viewerKeys);
  document.body.style.overflow = "";
  el.classList.add("is-closing");
  setTimeout(() => el.remove(), 180);
}

function viewerKeys(e) {
  if (e.key === "Escape") closeViewer();
  else if (e.key === "ArrowLeft") viewerGo(viewer.i - 1);
  else if (e.key === "ArrowRight") viewerGo(viewer.i + 1);
}

async function savePhoto() {
  const v = viewer; if (!v || v.saving) return;
  const btn = v.el.querySelector(".viewer__save"), label = btn.querySelector("span"), url = v.urls[v.i];
  v.saving = true; btn.classList.add("is-busy"); label.textContent = "Saving";
  let ok = true;
  try {
    const blob = await (await fetch(sizeOf(url, 1800))).blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `eran-studio-photo-${v.i + 1}.jpg`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  } catch {
    ok = false;
    window.open(sizeOf(url, 1800), "_blank", "noopener");   // fallback: open so it can be saved by hand
    showToast("Photo opened. Press and hold it to save");
  }
  btn.classList.remove("is-busy"); v.saving = false;
  if (ok) {
    btn.classList.add("is-done"); label.textContent = "Saved";
    btn.querySelector("svg").innerHTML = ICON.check;
    setTimeout(() => { if (!btn.isConnected) return; btn.classList.remove("is-done"); label.textContent = "Download";
      btn.querySelector("svg").innerHTML = ICON.down; }, 1800);
  } else label.textContent = "Download";
}

function viewerGo(to) {
  const v = viewer; if (!v) return;
  const n = v.urls.length, prev = v.i;
  v.i = (to + n) % n;
  const url = v.urls[v.i];
  const img = v.el.querySelector(".viewer__img"), bg = v.el.querySelector(".viewer__bg");
  img.src = sizeOf(url, 800); bg.src = sizeOf(url, 200);              // instant preview
  const big = new Image(); big.onload = () => { if (viewer === v && v.urls[v.i] === url) img.src = big.src; };
  big.src = sizeOf(url, 1800);                                         // then full size, same box
  // Crossfade only: the photo box itself never moves.
  if (v.i !== prev) img.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: "ease-out" });
  v.el.querySelector(".viewer__count").textContent = `${v.i + 1} of ${n}`;
  const strip = v.el.querySelector(".viewer__strip");
  v.el.querySelectorAll(".viewer__thumb").forEach((t, k) => {
    t.classList.toggle("is-active", k === v.i); t.setAttribute("aria-current", String(k === v.i));
    // Centre the active thumbnail by scrolling the strip only (scrollIntoView can shift the whole viewer).
    if (k === v.i) strip.scrollTo({ left: t.offsetLeft - (strip.clientWidth - t.offsetWidth) / 2, behavior: prev === v.i ? "auto" : "smooth" });
  });
}

function openViewer(urls, start = 0) {
  closeViewer();
  viewerOpener = document.activeElement;
  const el = document.createElement("div");
  el.className = "viewer"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Photo viewer");
  el.innerHTML = `<img class="viewer__bg" alt="">
    <header class="viewer__top">
      <button class="viewer__icon" data-v="close" aria-label="Close">${svg("close")}</button>
      <div class="viewer__title">Gallery<span class="viewer__count"></span></div>
      <i class="viewer__spacer"></i>
    </header>
    <div class="viewer__stage"><img class="viewer__img" alt="" draggable="false"></div>
    <div class="viewer__strip" role="list">${urls.map((u, k) =>
      `<button class="viewer__thumb" role="listitem" data-i="${k}" aria-label="Photo ${k + 1}"><img src="${sizeOf(u, 200)}" alt="" loading="lazy"></button>`).join("")}</div>
    <footer class="viewer__bar">
      <button class="viewer__icon" data-v="prev" aria-label="Previous photo">${svg("prev")}</button>
      <button class="viewer__save" data-v="save">${svg("down")}<span>Download</span></button>
      <button class="viewer__icon" data-v="next" aria-label="Next photo">${svg("next")}</button>
    </footer>`;
  document.body.append(el);
  document.body.style.overflow = "hidden";
  viewer = { el, urls, i: start, saving: false };
  viewerGo(start);
  el.addEventListener("click", (e) => {
    const t = e.target.closest("[data-i]"); if (t) return viewerGo(Number(t.dataset.i));
    const b = e.target.closest("[data-v]"); const act = b?.dataset.v;
    if (act === "close" || e.target.classList.contains("viewer__stage")) closeViewer();
    else if (act === "prev") viewerGo(viewer.i - 1);
    else if (act === "next") viewerGo(viewer.i + 1);
    else if (act === "save") savePhoto();
  });
  // Swipe: sideways changes photo, a long downward drag closes.
  let sx = 0, sy = 0, on = false;
  el.addEventListener("touchstart", (e) => { if (e.target.closest(".viewer__strip")) return; on = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  el.addEventListener("touchend", (e) => {
    if (!on) return; on = false;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) viewerGo(viewer.i + (dx < 0 ? 1 : -1));
    else if (dy > 110 && Math.abs(dy) > Math.abs(dx)) closeViewer();
  });
  document.addEventListener("keydown", viewerKeys);
  el.querySelector(".viewer__save").focus();
}
