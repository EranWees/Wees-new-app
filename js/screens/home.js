const ORDER = { ready: 0, paid: 1, pending_verification: 2, unpaid: 3 };

// One plain-language line about the client's sessions.
function homeSummary() {
  const n = (s) => batches.filter((b) => b.status === s).length;
  const plural = (c, w) => `${c} ${w}${c === 1 ? "" : "s"}`;
  const parts = [];
  if (n("unpaid")) parts.push(`${plural(n("unpaid"), "session")} ready to release`);
  if (n("pending_verification")) parts.push(`${n("pending_verification")} payment being checked`);
  if (n("paid")) parts.push(`${n("paid")} in progress`);
  return parts.length ? parts.join(" · ") : "You're all caught up. Ready for your next shoot?";
}

const hPhoto = (key, w) => (PHOTOS[key] ? unsplash(PHOTOS[key], w) : "");
const mapsHref = () => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(studio.mapQuery || studio.address)}`;
const waHref = (text) => `https://wa.me/${studio.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
const igHref = () => (studio.handle ? `https://instagram.com/${String(studio.handle).replace(/^@/, "")}` : "");

// ---------- Website hero ----------
function heroHTML() {
  const slides = showcase.length ? `<div class="hero__slides" aria-hidden="true">${showcase.map((s, i) =>
    `<img class="hero__slide${i === 0 ? " is-on" : ""}" src="${esc(safeUrl(s.img))}" alt="" decoding="async" draggable="false">`).join("")}</div>` : "";
  const cap = showcase.length ? `<div class="hero__cap" aria-live="off">
      <div class="hero__cap-text"><small>${esc(showcase[0].kicker)}</small><b>${esc(showcase[0].title)}</b></div>
      <div class="hero__dots">${showcase.map((_, i) =>
        `<button class="hero__dot" data-hero="${i}" aria-label="Show studio photo ${i + 1}" aria-current="${i === 0}"></button>`).join("")}</div>
    </div>` : "";
  return `<header class="site-hero" aria-label="Eran Studio">
    ${slides}
    <nav class="site-nav" aria-label="Studio sections">
      <a class="site-nav__brand" href="#/home">Eran <span>Studio</span></a>
      <div class="site-nav__links">
        <button type="button" data-goto="work">Work</button>
        <button type="button" data-goto="services">Sessions</button>
        <button type="button" data-goto="studio">Studio</button>
        <button type="button" data-goto="visit">Visit</button>
      </div>
      <a class="site-nav__cta" href="#/book">Book a shoot</a>
    </nav>
    <div class="site-hero__body">
      <p class="site-hero__kicker">Portraits &amp; lifestyle &middot; Lilongwe</p>
      <h1 class="site-hero__title">Light, colour<br>and <em>people</em>.</h1>
      <p class="site-hero__lede">A creative studio in Lilongwe making portraits that feel like the people in them &mdash; natural light, honest colour, photographs worth printing.</p>
      <div class="site-hero__actions">
        <a class="site-btn" href="#/book">Book a shoot <span aria-hidden="true">&rarr;</span></a>
        <button class="site-btn site-btn--ghost" type="button" data-goto="work">See the work</button>
      </div>
    </div>
    <div class="site-hero__foot">
      ${cap}
      <p class="site-hero__scroll" aria-hidden="true"><span></span>Scroll</p>
    </div>
  </header>`;
}

const TICKER = ["Portraits", "Families", "Couples", "Graduations", "Editorial", "Events", "Weddings", "Headshots"];
const tickerHTML = () => `<div class="site-ticker" aria-hidden="true"><div class="site-ticker__track">${TICKER.map((t) => `<span>${t}</span>`).join("")}</div></div>`;

// ---------- Shared section heading ----------
function siteHead(no, kicker, title, more) {
  return `<header class="site-head">
    <p class="site-kicker">${no} &mdash; ${kicker}</p>
    <div class="site-head__row">
      <h2 class="site-h2">${title}</h2>
      ${more ? `<a class="site-more" href="${more.href}">${more.text} <span aria-hidden="true">&#8599;</span></a>` : ""}
    </div></header>`;
}

// ---------- Client strip: greeting, tier and next shoot ----------
const daysUntil = (iso) => Math.round((new Date(iso + "T00:00:00") - new Date(todayISO(0) + "T00:00:00")) / 864e5);

function nextShootHTML() {
  const r = bookings.filter((x) => x.status === "requested" && x.date >= todayISO(0))
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  if (!r) return `<a class="you__next you__next--empty" href="#/book">
      <span class="you__next-plus" aria-hidden="true">+</span>
      <span class="you__next-body"><span class="you__label">Nothing booked</span>
      <b>Plan your next session</b><span class="you__next-meta">Start with a setting and a date.</span></span></a>`;
  const g = groupById(r.group), t = SHOOT_TYPES[r.type], s = SESSIONS.find((x) => x.id === r.session);
  const legacy = !(g && t && s);
  const pk = legacy && r.packageId ? pkgById(r.packageId) : null;
  if (legacy && !pk) return "";
  const title = legacy ? pk.name : `${t.name} shoot, ${g.name.toLowerCase()}`;
  const meta = legacy ? r.slot : `${r.slot}, ${s.name} session, ${r.photos} extra photo${r.photos === 1 ? "" : "s"}`;
  const n = daysUntil(r.date), when = n <= 0 ? "Today" : n === 1 ? "Tomorrow" : `In ${n} days`;
  const d = new Date(r.date + "T00:00:00");
  return `<div class="you__next">
    <div class="you__date" aria-hidden="true"><b>${d.getDate()}</b><span>${d.toLocaleDateString("en-GB", { month: "short" })}</span></div>
    <div class="you__next-body">
      <p class="you__label">Next shoot &middot; ${when}</p>
      <b>${esc(title)}</b>
      <span class="you__next-meta">${esc(meta)}</span>
      <span class="you__next-links">
        ${legacy ? "" : `<a href="${waHref(bookingMessage(r))}" target="_blank" rel="noopener">Confirm on WhatsApp</a>`}
        <a href="#/book">Manage</a></span>
    </div></div>`;
}

function youHTML(stats, t) {
  return `<section class="you" id="you" aria-label="Your studio">
    <div class="you__main">
      <p class="you__hi">${greeting()}, ${esc(client.firstName)}.</p>
      <p class="you__line">${homeSummary()}</p>
      <div class="you__chips">
        <span class="you__chip">${t.current.name} tier</span>
        <span class="you__chip">${stats.photos} photos delivered</span>
        <span class="you__chip">${stats.sessions} sessions</span>
      </div>
      <div class="you__links"><a href="#/profile">Open your profile</a><a href="#/profile">Full gallery</a></div>
    </div>
    <div class="you__tier">
      <p class="you__label">Studio tier</p>
      <b>${t.current.name}</b>
      <div class="progress" style="--p:${Math.round(t.progress * 100)}%"><span></span></div>
      <small>${t.next ? `${t.remaining} more photos to reach ${t.next.name}` : "You've reached the top tier"}</small>
    </div>
    ${nextShootHTML()}
  </section>`;
}

// ---------- Selected work: Pinterest-style masonry, true photo orientation ----------
const RECENT_COUNT = 9;

function workHTML() {
  const urls = galleryFor(batches).slice(0, RECENT_COUNT);
  if (!urls.length) return "";
  const tiles = urls.map((u, i) => {
    const ar = ratioOf(u);
    return `<button class="recent__tile" type="button" data-recent="${i}" aria-label="Open photo ${i + 1}"${ar ? ` style="--ar:${ar}"` : ""}><img src="${esc(safeUrl(u))}" alt="" loading="lazy" decoding="async"></button>`;
  }).join("");
  return `<section class="work" id="work" aria-label="Selected work">
    ${siteHead("01", "The work", `Selected <em>work</em>`, { href: "#/profile", text: "Full gallery" })}
    <div class="work__grid recent__grid">${tiles}</div>
    <p class="work__note">A selection from recent sessions. Your own gallery lives in your profile.</p>
  </section>`;
}

// ---------- What we shoot ----------
const SERVICES = [
  { name: "Portraits", photo: "pinkBlazer", type: "indoor",
    blurb: "Headshots, graduations and personal work \u2014 lit simply, edited honestly.",
    tags: ["60\u201390 min", "1\u20133 outfits"] },
  { name: "Families & couples", photo: "bench", type: "outdoor",
    blurb: "Relaxed sessions outdoors, where the light and the laughter do the work.",
    tags: ["3\u20137 people", "On location"] },
  { name: "Events & editorial", photo: "redFlower", type: "outdoor",
    blurb: "Brands, celebrations and magazine-style stories, shot with a documentary eye.",
    tags: ["Half or full day", "5-day delivery"] },
];

function servicesHTML() {
  const cards = SERVICES.map((s, i) => {
    const img = hPhoto(s.photo, 800);
    return `<button class="svc-card" type="button" data-book-type="${s.type}">
      <span class="svc-card__media">${img ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async">` : ""}</span>
      <span class="svc-card__body">
        <span class="svc-card__no">0${i + 1}</span>
        <span class="svc-card__name">${s.name}</span>
        <span class="svc-card__blurb">${s.blurb}</span>
        <span class="svc-card__tags">${s.tags.map((t) => `<span>${t}</span>`).join("")}</span>
        <span class="svc-card__go">Plan this session <i aria-hidden="true">&rarr;</i></span>
      </span></button>`;
  }).join("");
  return `<section class="svc" id="services" aria-label="Sessions">
    ${siteHead("02", "What we shoot", `Sessions for <em>real life</em>`)}
    <div class="svc__grid">${cards}</div>
    <p class="svc__foot">Every session includes hand editing and a private online gallery. <a href="#/book">Start a booking</a>.</p>
  </section>`;
}

// ---------- Client sessions ----------
function yoursHTML(content) {
  return `<section class="yours" id="sessions" aria-label="Your sessions">
    ${siteHead("03", "Your sessions", `Work in <em>progress</em>`, { href: "#/profile", text: "Your profile" })}
    ${content}
  </section>`;
}

// ---------- Studio story ----------
function storyHTML() {
  const img = hPhoto("tealTop", 1100) || hPhoto("knitCap", 1100);
  const fast = DELIVERY[DELIVERY.length - 1];
  const proof = [...studio.proof, { n: "24h", label: `${fast.name.toLowerCase()} delivery` }];
  return `<section class="story" id="studio" aria-label="About the studio">
    <figure class="story__pic">
      ${img ? `<img src="${esc(img)}" alt="A portrait from an Eran Studio session" loading="lazy" decoding="async">` : ""}
      <figcaption>In the studio &middot; Lilongwe</figcaption>
    </figure>
    <div class="story__copy">
      <p class="site-kicker">04 &mdash; The studio</p>
      <h2 class="site-h2">Natural light.<br><em>Honest colour.</em></h2>
      <p class="story__text">Eran Studio began with one camera, a window and a stubborn belief that a good portrait should look like the person, not the pose. We still shoot the same way: simple light, a little direction, and enough room for you to be yourself.</p>
      <p class="story__text">Sessions happen in our Lilongwe studio or on location around the city. You get a private gallery, edited by hand, and photos that are ready to print.</p>
      <div class="story__proof">${proof.map((p) => `<div><b>${esc(p.n)}</b><span>${esc(p.label)}</span></div>`).join("")}</div>
      <p class="story__sign"><span>Eran</span>Founder &amp; photographer</p>
    </div>
  </section>`;
}

function quoteHTML() {
  return `<section class="quote" aria-label="Client words">
    <blockquote>&ldquo;They didn&rsquo;t pose us into strangers. <em>They just let us be us</em> &mdash; and every frame still looks like a photograph.&rdquo;</blockquote>
    <cite>Chikondi &amp; Sam &middot; family session, 2026</cite>
  </section>`;
}

// ---------- Booking band ----------
function bookBandHTML() {
  const lowest = Math.min(...GROUPS.map((g) => g.base));
  return `<section class="book-band" aria-label="Book a shoot">
    <div class="book-band__inner">
      <p class="site-kicker site-kicker--light">Ready when you are</p>
      <h2 class="book-band__title">Let&rsquo;s make something<br><em>worth framing.</em></h2>
      <div class="book-band__actions">
        <a class="site-btn" href="#/book">Book a shoot <span aria-hidden="true">&rarr;</span></a>
        <a class="site-btn site-btn--ghost" href="${waHref("Hi Eran Studio, I'd like to ask about a shoot.")}" target="_blank" rel="noopener">Ask a question</a>
      </div>
      <p class="book-band__meta">From ${fmtK(lowest)} &middot; Indoor or outdoor &middot; Express delivery available</p>
    </div>
  </section>`;
}

// ---------- Location footer ----------
function footerHTML() {
  const wa = waHref("Hi Eran Studio!");
  const ig = igHref();
  return `<footer class="site-foot" id="visit">
    <div class="site-foot__grid">
      <div class="site-foot__brand">
        <p class="site-foot__logo">Eran <span>Studio</span></p>
        <p class="site-foot__blurb">Portrait and lifestyle photography in Lilongwe, Malawi. Natural light, honest colour, photographs you keep.</p>
        ${ig ? `<a class="site-foot__ig" href="${esc(ig)}" target="_blank" rel="noopener">${esc(studio.handle)} <span aria-hidden="true">&#8599;</span></a>` : ""}
      </div>
      <div class="site-foot__col">
        <h3>Visit</h3>
        <address>${esc(studio.address)}<br>${esc(studio.city)}</address>
        <p>${esc(studio.hours)}</p>
        <a href="${mapsHref()}" target="_blank" rel="noopener">Get directions <span aria-hidden="true">&#8599;</span></a>
      </div>
      <div class="site-foot__col">
        <h3>Talk to us</h3>
        <a href="${wa}" target="_blank" rel="noopener">WhatsApp</a>
        <a href="tel:+${digits(studio.phone)}">${esc(studio.phone)}</a>
        <a href="mailto:${esc(studio.email)}">${esc(studio.email)}</a>
      </div>
      <div class="site-foot__col">
        <h3>Explore</h3>
        <a href="#/book">Book a shoot</a>
        <a href="#/profile">Your gallery</a>
        <button type="button" data-goto="sessions">Your sessions</button>
        <a href="#/magazine">Poster designs</a>
      </div>
      <a class="site-foot__map" href="${mapsHref()}" target="_blank" rel="noopener" aria-label="Open the studio address in Maps">
        <span class="site-foot__map-pin" aria-hidden="true"></span>
        <span class="site-foot__map-label">${esc(studio.city)}</span>
        <span class="site-foot__map-open">Open in Maps <span aria-hidden="true">&#8599;</span></span>
      </a>
    </div>
    <div class="site-foot__base">
      <span>&copy; ${new Date().getFullYear()} Eran Studio &middot; ${esc(studio.city)}</span>
      <span>One frame at a time.</span>
    </div>
  </footer>`;
}

const homeScreen = {
  render() {
    const stats = clientStats(batches), t = tierInfo(stats.photos);
    const newest = batches.filter((b) => b.status === "ready")
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const list = batches.filter((b) => b.status !== "ready" || b === newest)
      .sort((a, b) => ORDER[a.status] - ORDER[b.status]);
    const content = list.length
      ? `<div class="stack">${list.map(batchCard).join("")}</div>`
      : `<p class="empty">No sessions yet. When the studio adds your photos, they&rsquo;ll appear here.</p>`;

    return `<div class="page home-page">
      ${heroHTML()}
      ${tickerHTML()}
      <main class="site-main">
        ${youHTML(stats, t)}
        ${workHTML()}
        ${servicesHTML()}
        ${yoursHTML(content)}
        ${storyHTML()}
        ${quoteHTML()}
      </main>
      ${bookBandHTML()}
      ${footerHTML()}
    </div>`;
  },

  mount(root, signal) {
    startCountdowns(root);
    const recent = galleryFor(batches).slice(0, RECENT_COUNT);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    root.addEventListener("click", (e) => {
      const go = e.target.closest("[data-goto]");
      if (go) {
        const el = document.getElementById(go.dataset.goto);
        if (el) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        return;
      }
      const bt = e.target.closest("[data-book-type]");
      if (bt) { draft.type = bt.dataset.bookType; location.hash = "#/book/people"; return; }
      const rt = e.target.closest("[data-recent]");
      if (rt) openViewer(recent, Number(rt.dataset.recent));
    }, { signal });

    // a recent photo that cannot load is removed; with none left the section goes away
    root.addEventListener("error", (e) => {
      const tile = e.target.closest?.(".recent__tile");
      if (!tile) return;
      const sec = tile.closest(".work"); tile.remove();
      if (sec && !sec.querySelector(".recent__tile")) sec.remove();
    }, { capture: true, signal });

    const imgs = [...root.querySelectorAll(".hero__slide")], dots = [...root.querySelectorAll(".hero__dot")];
    const capText = root.querySelector(".hero__cap-text");
    const dotsWrap = root.querySelector(".hero__dots");
    if (imgs.length < 2 || !capText || !dotsWrap) return;
    let idx = 0, holdUntil = 0, swap = 0;

    const show = (i) => {
      i = (i + imgs.length) % imgs.length;
      imgs.forEach((im, k) => im.classList.toggle("is-on", k === i));
      dots.forEach((d, k) => d.setAttribute("aria-current", String(k === i)));
      // the caption fades out, swaps text while invisible, then fades back in
      capText.classList.add("is-out");
      clearTimeout(swap);
      swap = setTimeout(() => {
        capText.innerHTML = `<small>${esc(showcase[i].kicker)}</small><b>${esc(showcase[i].title)}</b>`;
        capText.classList.remove("is-out");
      }, reduce ? 0 : 350);
      idx = i;
    };

    dotsWrap.addEventListener("click", (e) => {
      const d = e.target.closest("[data-hero]");
      if (d) { holdUntil = Date.now() + 8000; show(Number(d.dataset.hero)); }
    }, { signal });

    if (!reduce) {
      const timer = setInterval(() => { if (!document.hidden && Date.now() >= holdUntil) show(idx + 1); }, 6000);
      signal.addEventListener("abort", () => { clearInterval(timer); clearTimeout(swap); });
    }
  },
};
