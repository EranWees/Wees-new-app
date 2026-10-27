const GALLERY_PAGE = 24;                              // photos drawn at a time (keeps 100s of photos fast)
let profileGallery = { all: [], shown: 0 };
let profileSeries = [];

/* ---------- Data: delivered series, newest first ---------- */
function readySeries() {
  return batches.filter((b) => b.status === "ready")
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((b) => ({ b, imgs: batchImages(b) }));
}

const dayMonth = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return { d, day: d.getDate(), mon: d.toLocaleDateString("en-GB", { month: "short" }),
    monLong: d.toLocaleDateString("en-GB", { month: "long" }), year: d.getFullYear() };
};

/* ---------- Gallery: separate photographs, exactly as before ---------- */
const photoTile = (src, i) => {
  const ar = ratioOf(src);
  return `<button class="photo" data-photo="${i}" aria-label="Open photo ${i + 1}"${ar ? ` style="--ar:${ar}"` : ""}><img src="${esc(safeUrl(src))}" alt="" decoding="async" loading="lazy"></button>`;
};
const moreLabel = () => `Show more (${profileGallery.all.length - profileGallery.shown} left)`;

/* ---------- Series: date-led session folders ---------- */
const SERIES_TONE = (id) => `series--t${(id % 4) + 1}`;

function seriesCard(g, i) {
  const { b, imgs } = g;
  const { day, mon, year } = dayMonth(b.date);
  const cover = safeUrl(b.cover || imgs[0] || "");
  return `<button class="series ${SERIES_TONE(b.id)}" type="button" data-series="${i}"
      aria-label="Open ${esc(b.title)}, ${fmtDate(b.date)}, ${imgs.length} photographs">
    <span class="series__media">
      ${cover ? `<img src="${esc(cover)}" alt="" decoding="async">` : ""}
      <span class="series__tab" aria-hidden="true"></span>
      <span class="series__stamp"><b>${pad2(day)}</b><span>${mon} ${year}</span></span>
    </span>
    <span class="series__body">
      <span class="series__no">Series ${pad2(b.id)}</span>
      <span class="series__title">${esc(b.title)}</span>
      <span class="series__meta">${imgs.length} photographs &middot; ${esc(studio.city.split(",")[0])}</span>
      <span class="series__tags"><span>${fmtDate(b.date)}</span><span>${imgs.length} frames</span></span>
      <span class="series__go">Open series <i aria-hidden="true">&rarr;</i></span>
    </span></button>`;
}

function seriesHTML() {
  const list = readySeries();
  profileSeries = list;
  if (!list.length) return `<p class="empty">Your series will be filed here by date once the first one is delivered.</p>`;
  const total = list.reduce((s, g) => s + g.imgs.length, 0);
  const years = [...new Set(list.map((g) => dayMonth(g.b.date).year))];
  const sections = years.map((year) => {
    const items = list.map((g, i) => ({ g, i })).filter(({ g }) => dayMonth(g.b.date).year === year);
    return `<section class="shelf__year" aria-label="Series from ${year}">
      <header class="shelf__year-head"><h3>${year}</h3><span>${items.length} ${items.length === 1 ? "series" : "series"}</span></header>
      <div class="shelf__grid">${items.map(({ g, i }) => seriesCard(g, i)).join("")}</div>
    </section>`;
  }).join("");
  return `<div class="arch">
    <header class="panel__head">
      <p class="arch__kick">The archive</p>
      <h2 class="panel__title">Series, <em>by date</em></h2>
      <p class="panel__lede">${list.length} series &middot; ${total} photographs. Every folder is one day in the studio, filed newest first. Open a folder to step inside before the full gallery.</p>
    </header>
    <div class="shelf">${sections}</div>
    <p class="arch__note">A series keeps the pictures from a single shoot together, in the order they were taken.</p>
  </div>`;
}

/* ---------- Series sheet: the doorway into one folder ---------- */
function openSeriesSheet(index) {
  const g = profileSeries[index];
  if (!g) return;
  const { b, imgs } = g;
  const preview = imgs.slice(0, 6);
  const body = `<div class="series-sheet">
    <div class="series-sheet__cover">${imgs[0] ? `<img src="${esc(safeUrl(imgs[0]))}" alt="" decoding="async">` : ""}
      <span class="series-sheet__date">${fmtDate(b.date)}</span></div>
    <div class="series-sheet__copy">
      <p class="arch__kick">Series ${pad2(b.id)} &middot; ${esc(studio.city.split(",")[0])}</p>
      <h3 class="series-sheet__title">${esc(b.title)}</h3>
      <p class="series-sheet__meta">${imgs.length} photographs, edited by hand and kept in the order they were taken.</p>
      <div class="series-sheet__strip">${preview.map((src, k) =>
        `<button type="button" data-strip="${k}" aria-label="Open photograph ${k + 1}"><img src="${esc(safeUrl(src))}" alt="" loading="lazy" decoding="async"></button>`).join("")}</div>
      <button class="btn btn--solid btn--full" type="button" data-open-series>Open all ${imgs.length} photographs</button>
    </div></div>`;
  const panel = openSheet({ title: `Series ${pad2(b.id)}`, body });
  panel.classList.add("modal__panel--series");
  panel.querySelector("[data-open-series]")?.addEventListener("click", () => { closeSheet(); openViewer(imgs, 0); });
  panel.querySelectorAll("[data-strip]").forEach((t) => t.addEventListener("click", () => {
    closeSheet(); openViewer(imgs, Number(t.dataset.strip));
  }));
}

/* ---------- Milestones: the tier ladder ---------- */
function milestonesHTML(t, stats) {
  const shots = galleryFor(batches).slice(0, 3);
  const strip = shots.length
    ? `<div class="tierlive__media" aria-hidden="true">${shots.map((s) => `<img src="${esc(safeUrl(s))}" alt="" decoding="async">`).join("")}</div>` : "";
  const nextLine = t.next
    ? `<b>${t.remaining}</b> more ${t.remaining === 1 ? "photograph" : "photographs"} to reach <b>${esc(t.next.name)}</b>`
    : "You have reached the top tier.";
  const rows = TIERS.map((x, i) => {
    const done = i < t.index, here = i === t.index;
    const flag = done ? "Passed" : here ? "You are here" : "";
    return `<li class="${done ? "is-done" : here ? "is-current" : ""}">
      <span class="ladder__dot" aria-hidden="true"></span>
      <span class="ladder__body"><b>${esc(x.name)}</b><small>${x.min} photographs${here ? " and above" : ""}</small></span>
      ${flag ? `<span class="ladder__flag">${flag}</span>` : `<span class="ladder__flag ladder__flag--quiet">${x.min > stats.photos ? `${x.min - stats.photos} to go` : ""}</span>`}
    </li>`;
  }).join("");
  return `<header class="panel__head">
      <p class="arch__kick">Milestones</p>
      <h2 class="panel__title">Your <em>standing</em></h2>
      <p class="panel__lede">A record of the work the studio has delivered. Each tier is a little more room to make something.</p>
    </header>
    <div class="tierlive">
    ${strip}
    <div class="tierlive__body">
      <p class="arch__kick">Your standing</p>
      <p class="tierlive__name">${esc(t.current.name)}</p>
      <div class="tierlive__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(t.progress * 100)}"><span style="--p:${Math.round(t.progress * 100)}%"></span></div>
      <p class="tierlive__note"><span>${nextLine}</span>${t.next ? `<span class="tierlive__next">${esc(t.next.name)} from ${t.next.min}</span>` : ""}</p>
    </div>
  </div>
  <ol class="ladder" aria-label="Studio tiers">${rows}</ol>
  <p class="arch__note">Your tier rises with every delivered photograph: the studio counts what you have been given, never what you have booked.</p>`;
}

const profileScreen = {
  render() {
    const stats = clientStats(batches);
    const t = tierInfo(stats.photos);
    const all = galleryFor(batches);                 // one gallery tile per delivered photo
    profileGallery = { all, shown: Math.min(GALLERY_PAGE, all.length) };
    const photos = all.slice(0, profileGallery.shown).map(photoTile).join("");

    return `<div class="page profile-page"><button class="menu-btn" data-menu-toggle aria-label="Settings" aria-haspopup="menu" aria-expanded="false">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>
    </button>
    <div class="menu" role="menu" hidden>
      <button role="menuitem" data-menu-action="magazine">View poster designs</button>
      <button role="menuitem" data-menu-action="edit">Edit profile</button>
      <button role="menuitem" data-menu-action="pin">Change PIN</button>
      <button role="menuitem" data-menu-action="contact">Contact the studio</button>
      <hr>
      <button role="menuitem" class="danger" data-menu-action="logout">Log out</button>
    </div>
    <div class="hero hero--brand" aria-hidden="true"></div>
    <section class="sheet">
      <div class="profile__bio">
        <div class="avatar" aria-hidden="true">${esc(client.firstName.trim().charAt(0).toUpperCase() || "E")}</div>
        <div class="profile__id">
          <h1 class="title">${esc(client.firstName)}</h1>
          <span class="badge">&#10022; ${t.current.name} tier</span>
          <p class="subtle profile__meta">Member since ${client.memberSince}</p>
        </div>
        <div class="stats">
          <div><div class="stat__value">${stats.photos}</div><div class="stat__label">Photos</div></div>
          <div><div class="stat__value">${stats.sessions}</div><div class="stat__label">Series</div></div>
          <div><div class="stat__value">${t.remaining}</div><div class="stat__label">To ${t.next ? t.next.name : "top"}</div></div>
        </div>
      </div>

      <div class="profile__main">
      <div class="tabs" role="tablist">
        <button role="tab" aria-selected="true" data-tab="gallery">Gallery</button>
        <button role="tab" aria-selected="false" data-tab="milestones">Milestones</button>
        <button role="tab" aria-selected="false" data-tab="series">Series</button>
      </div>

      <div class="panels">
      <div data-panel="gallery">
        ${profileGallery.all.length ? `<div class="masonry">${photos}</div>` : `<p class="empty">No photos yet. They appear here once a session is delivered.</p>`}
        ${profileGallery.shown < profileGallery.all.length ? `<button class="btn btn--full gallery__more" data-more>${moreLabel()}</button>` : ""}
      </div>

      <div data-panel="milestones" hidden>${milestonesHTML(t, stats)}</div>

      <div data-panel="series" hidden>${seriesHTML()}</div>
      </div>

      </div>
    </section></div>`;
  },

  mount(root) {
    const panel = root.querySelector('[data-panel="gallery"]');
    panel.addEventListener("click", (e) => {
      const b = e.target.closest("[data-photo]");
      if (b) return openViewer(profileGallery.all, Number(b.dataset.photo));
      const more = e.target.closest("[data-more]");
      if (!more) return;
      const g = profileGallery, next = Math.min(g.shown + GALLERY_PAGE, g.all.length);
      panel.querySelector(".masonry").insertAdjacentHTML("beforeend",
        g.all.slice(g.shown, next).map((src, k) => photoTile(src, g.shown + k)).join(""));
      g.shown = next;
      if (g.shown < g.all.length) more.textContent = moreLabel();
      else more.remove();
    });
    // A folder opens the series sheet first, then its photographs.
    root.addEventListener("click", (e) => {
      const f = e.target.closest("[data-series]");
      if (!f) return;
      openSeriesSheet(Number(f.dataset.series));
    });
    const tabs = root.querySelectorAll("[data-tab]");
    tabs.forEach((tab) => tab.addEventListener("click", () => {
      tabs.forEach((x) => x.setAttribute("aria-selected", String(x === tab)));
      root.querySelectorAll("[data-panel]").forEach((p) => { p.hidden = p.dataset.panel !== tab.dataset.tab; });
      const top = root.querySelector(".tabs").getBoundingClientRect().top + window.scrollY - 16;
      if (window.scrollY > top) window.scrollTo(0, top);
    }));
    // Deep link: /?tab=series or /?tab=milestones opens that panel directly.
    const want = new URLSearchParams(location.search).get("tab");
    if (want) root.querySelector(`[data-tab="${want === "sessions" ? "series" : want}"]`)?.click();
  },
};
