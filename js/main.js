const root = document.getElementById("screen");
startRouter(root);
// Test-load the sample photos in the background; drop any that are dead and redraw once.
pruneBrokenPhotos().then((changed) => { if (changed) refresh(); });
initMenu(root);

// Actions inside screens (event delegation, so it survives re-rendering)
root.addEventListener("click", (e) => {
  const dl = e.target.closest("[data-download]");
  if (dl) { const u = safeUrl(dl.dataset.download); return u ? window.open(u, "_blank", "noopener") : showToast("This download link isn't available yet"); }
  const rel = e.target.closest("[data-release]");
  if (rel) return openRelease(rel.dataset.release);
});
