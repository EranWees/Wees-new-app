// Prototype helper (not linked in the app): open #/dev to play the studio's side of each session.
const devScreen = {
  render() {
    const rows = batches.map((b) => `<article class="folder">
      <div class="folder__row"><div class="folder__title">${esc(b.title)}</div><span class="status status--${CLASS[b.status]}">${LABEL[b.status]}</span></div>
      <div class="row-actions">
        <button class="link" data-dev="${b.id}:unpaid">Unpaid</button>
        <button class="link" data-dev="${b.id}:paid">Confirm payment</button>
        <button class="link" data-dev="${b.id}:ready">Mark ready</button>
      </div></article>`).join("");
    return `<section class="screen"><p class="eyebrow">Prototype</p><h1 class="title">Studio <em>view</em></h1>
      <p class="subtle">Prototype controls for testing the client flow.</p>
      <div class="stack" style="margin-top:20px">${rows}</div>
      <button class="btn btn--full" style="margin-top:18px" data-dev-reset>Reset all demo data</button></section>`;
  },
  mount(root, signal) {
    root.addEventListener("click", (e) => {
      if (e.target.closest("[data-dev-reset]")) { resetStore(); location.hash = "#/home"; refresh(); return; }
      const d = e.target.closest("[data-dev]");
      if (!d) return;
      const [id, st] = d.dataset.dev.split(":");
      const b = batches.find((x) => x.id === Number(id));
      b.status = st;
      if (st === "paid") { b.timerStartedAt = Date.now(); b.deliveryHours = b.deliveryHours || 48; }
      if (st === "ready") { b.galleryUrl = b.galleryUrl || "https://example.com"; b.cover = b.cover || photoPool[b.id % photoPool.length]; }
      saveStore(); refresh();
    }, { signal });
  },
};
