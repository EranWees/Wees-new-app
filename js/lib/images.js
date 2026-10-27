// Photo safety net: any photo that does not load is removed from the app instead of showing an empty box.
// 1) At start-up every sample photo is test-loaded once; dead ones are dropped from the gallery pool,
//    the home banner and the session covers (then the screen is redrawn).
// 2) If a photo still fails later (network drop, host blocks it), its tile is hidden on the spot.
// 3) Each photo's real width/height is remembered so gallery tiles match portrait vs landscape.

// url -> width / height, filled at start-up and as each photo loads.
const photoRatios = new Map();
const rememberRatio = (url, w, h) => {
  const key = safeUrl(url);
  if (key && w > 0 && h > 0) photoRatios.set(key, w / h);
};
const ratioOf = (url) => photoRatios.get(safeUrl(url)) || null;

// Give any tiles already on screen the exact shape as soon as the start-up probe knows it.
function applyKnownRatios() {
  document.querySelectorAll(".recent__tile, .photo").forEach((tile) => {
    const img = tile.querySelector("img");
    const r = img && ratioOf(img.src);
    if (r) tile.style.setProperty("--ar", String(r));
  });
}

function probeImage(url, ms = 8000) {
  return new Promise((resolve) => {
    const im = new Image();
    const done = (ok) => {
      clearTimeout(t); im.onload = im.onerror = null;
      resolve(ok ? { ok: true, w: im.naturalWidth, h: im.naturalHeight } : { ok: false });
    };
    const t = setTimeout(() => done(false), ms);
    im.onload = () => done(im.naturalWidth > 0);
    im.onerror = () => done(false);
    im.src = url;
  });
}

// Returns true when something was removed (so the caller can redraw).
async function pruneBrokenPhotos() {
  const entries = Object.entries(PHOTOS);
  const checked = await Promise.all(entries.map(async ([key, id]) => {
    const probe = await probeImage(unsplash(id, 240));
    if (probe.ok) rememberRatio(unsplash(id), probe.w, probe.h);
    return [key, id, probe.ok];
  }));
  const bad = checked.filter((c) => !c[2]);
  applyKnownRatios();
  if (!bad.length) return false;
  if (bad.length === checked.length) return false; // every photo failed: the device is offline, so keep them all

  const dead = bad.map((c) => c[1]);
  const isDead = (url) => dead.some((id) => String(url || "").includes(id));
  bad.forEach(([key]) => delete PHOTOS[key]);

  const keep = (arr, pick = (x) => x) => { for (let i = arr.length - 1; i >= 0; i--) if (isDead(pick(arr[i]))) arr.splice(i, 1); };
  keep(photoPool);
  keep(showcase, (s) => s.img);

  const fallback = photoPool[0] || "";
  batches.forEach((b) => {
    if (isDead(b.cover)) b.cover = fallback;
    if (b.images) b.images = b.images.filter((u) => !isDead(u));
  });
  saveStore();
  return true;
}

// Late failures: hide the tile that cannot show its picture.
document.addEventListener("error", (e) => {
  const img = e.target;
  if (!(img instanceof HTMLImageElement) || img.closest(".viewer")) return;
  const tile = img.closest(".photo, .recent__tile");
  if (tile) { tile.hidden = true; return; }
  if (img.closest(".folder__cover")) { img.hidden = true; img.closest(".folder").classList.add("folder--noimg"); return; }
  if (img.closest(".tierlive__media")) { img.remove(); return; }
  if (img.classList.contains("hero__slide")) { img.remove(); return; }
  if (img.closest(".series-sheet__cover")) { img.hidden = true; img.closest(".series-sheet__cover").classList.add("is-empty"); return; }
  const strip = img.closest(".series-sheet__strip button");
  if (strip) { img.hidden = true; strip.classList.add("is-empty"); return; }
  if (img.closest(".series")) img.closest(".series").classList.add("series--noimg");
}, true);

// Every photo teaches the app its real shape as it loads, so tiles keep portrait / landscape.
function applyPhotoRatio(img) {
  const w = img.naturalWidth, h = img.naturalHeight;
  if (!w || !h) return;
  rememberRatio(img.currentSrc || img.src, w, h);
  const tile = img.closest(".photo, .recent__tile");
  if (tile) tile.style.setProperty("--ar", String(w / h));
}
document.addEventListener("load", (e) => {
  if (e.target instanceof HTMLImageElement) applyPhotoRatio(e.target);
}, true);
