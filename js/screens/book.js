// Book a shoot, in four steps: 1 Setting, 2 People, 3 Session, 4 Date.
// A request is saved on the device and sent to the studio on WhatsApp. Prices and names: js/data/booking.js
const pkgById = (id) => packages.find((p) => p.id === id);

const blankDraft = () => ({ type: "", group: "", people: 0, photos: 0, delivery: "standard",
  date: "", slot: TIME_SLOTS[0], place: "", notes: "" });
let draft = blankDraft();
let lastBooking = null;

const photoUrl = (key, w) => (PHOTOS[key] ? unsplash(PHOTOS[key], w) : "");

const BX_STEPS = [
  { n: 1, hash: "#/book", name: "Setting", note: "Studio or location" },
  { n: 2, hash: "#/book/people", name: "People", note: "Who is coming" },
  { n: 3, hash: "#/book/plan", name: "Session", note: "Photos & delivery" },
  { n: 4, hash: "#/book/details", name: "Date", note: "Time & details" },
];
const SLOT_TIMES = { Morning: "8:00 \u2013 11:00", Afternoon: "12:00 \u2013 16:00", Evening: "16:00 \u2013 19:00" };
const people = (n) => `${n} ${n === 1 ? "person" : "people"}`;
const sessionSummary = (q) => `${q.session.name} session`;

// ---------- Ticket (rail, desktop) ----------
function ticketHTML() {
  const t = SHOOT_TYPES[draft.type], g = groupById(draft.group), q = quote(draft);
  const rows = [];
  if (t) rows.push(["Shoot", t.name]);
  if (g) rows.push(["Group", `${g.name} \u00b7 ${people(draft.people || g.min)}`]);
  if (t && g) {
    rows.push(["Session", q.session.name]);
    rows.push(["Photos", draft.photos ? `+${draft.photos} extra` : "0 extra"]);
    rows.push(["Delivery", q.dl.name]);
  }
  if (draft.date) rows.push(["Date", `${fmtDate(draft.date)}, ${draft.slot}`]);
  const lowest = Math.min(...GROUPS.map((x) => x.base));
  return `<div class="bx-ticket">
    <div class="bx-ticket__head"><span>Your session</span><span class="bx-ticket__badge">Draft</span></div>
    ${rows.length
      ? `<dl class="bx-ticket__lines">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`
      : `<p class="bx-ticket__empty">Nothing chosen yet. Your choices and price appear here as you go.</p>`}
    <div class="bx-ticket__total"><span>Total</span><strong>${t && g ? fmtK(q.total) : `From ${fmtK(lowest)}`}</strong></div>
    <p class="bx-ticket__note">No payment now \u00b7 Confirmed on WhatsApp</p>
  </div>`;
}

// ---------- Desktop footer row and mobile dock ----------
function bxFoot(o) {
  const btn = o.submit
    ? `<button class="bx-foot__go" type="submit">${o.text} <span aria-hidden="true">&rarr;</span></button>`
    : `<button class="bx-foot__go" type="button" data-next ${o.disabled ? "disabled" : ""}>${o.text} <span aria-hidden="true">&rarr;</span></button>`;
  return `<div class="bx-foot">${o.back ? `<a class="bx-foot__back" href="${o.back}">&larr; Back</a>` : "<span></span>"}${btn}</div>`;
}

function bxDock(o) {
  const btn = o.submit
    ? `<button class="bx-dock__go" type="button" data-submit>${o.text}</button>`
    : `<button class="bx-dock__go" type="button" data-next ${o.disabled ? "disabled" : ""}>${o.text}</button>`;
  return `<div class="bx-dock">
    ${o.back ? `<a class="bx-dock__back" href="${o.back}" aria-label="Back">&lsaquo;</a>` : ""}
    <div class="bx-dock__sum"><small data-dock-label>${o.label}</small><strong data-dock-total>${o.total}</strong></div>
    ${btn}</div>`;
}

// ---------- Shell: dark rail on desktop, slim top bar on phones ----------
function bxShell(n, inner, opts = {}) {
  const steps = BX_STEPS.map((s) => {
    const done = s.n < n, active = s.n === n;
    const label = `<i>0${s.n}</i><span>${s.name}<small>${s.note}</small></span>`;
    return `<li class="bx-step${done ? " is-done" : ""}${active ? " is-active" : ""}">${
      done ? `<a href="${s.hash}">${label}</a>` : `<div>${label}</div>`}</li>`;
  }).join("");
  const back = opts.back || "#/home";
  const railImg = photoUrl("tealTop", 900);
  return `<div class="bx">
    <aside class="bx-rail"${railImg ? ` style="--rail-img:url('${esc(railImg)}')"` : ""}>
      <div class="bx-rail__top">
        <a class="bx-rail__brand" href="#/home">Eran <span>Studio</span></a>
        <p class="bx-rail__tag">Booking desk</p>
      </div>
      <ol class="bx-steps" aria-label="Booking steps">${steps}</ol>
      <p class="bx-rail__note">About two minutes. No payment now \u2014 the studio confirms your date on WhatsApp.</p>
      <div class="bx-rail__ticket" data-ticket-host>${ticketHTML()}</div>
      <a class="bx-rail__out" href="#/home">&larr; Back to the studio</a>
    </aside>
    <div class="bx-main">
      <header class="bx-top">
        <a class="bx-top__back" href="${back}" aria-label="Go back">&lsaquo;</a>
        <div class="bx-top__mid">
          <span>Step 0${n} of 04</span>
          <div class="bx-top__bar">${[1, 2, 3, 4].map((i) => `<i class="${i <= n ? "is-on" : ""}"></i>`).join("")}</div>
        </div>
        <span class="bx-top__brand">Eran <b>Studio</b></span>
      </header>
      ${inner}
    </div>
    ${opts.dock || ""}
  </div>`;
}

// ---------- Requests already sent ----------
function requestCard(r) {
  const status = r.status === "requested"
    ? `<span class="bx-req__status">Requested</span>` : `<span class="bx-req__status bx-req__status--off">Cancelled</span>`;
  const cancel = r.status === "requested" ? `<button class="link" data-cancel-booking="${r.id}">Cancel request</button>` : "";
  if (r.packageId) {            // requests saved by an earlier version of the app
    const p = pkgById(r.packageId);
    if (!p) return "";
    return `<article class="bx-req">
      <div class="bx-req__top">${status}<span class="bx-req__date">${fmtDate(r.date)} \u00b7 ${esc(r.slot)}</span></div>
      <h3 class="bx-req__title">${esc(p.name)}</h3>
      <div class="bx-req__actions">${cancel}</div></article>`;
  }
  const g = groupById(r.group), t = SHOOT_TYPES[r.type], s = SESSIONS.find((x) => x.id === r.session), dl = deliveryById(r.delivery);
  if (!g || !t || !s) return "";
  return `<article class="bx-req">
    <div class="bx-req__top">${status}<span class="bx-req__date">${fmtDate(r.date)} \u00b7 ${esc(r.slot)}</span></div>
    <h3 class="bx-req__title">${t.name} shoot, ${esc(g.name.toLowerCase())}</h3>
    <p class="bx-req__meta">${fmtK(r.total)} \u00b7 ${s.name} \u00b7 ${r.photos} extra photo${r.photos === 1 ? "" : "s"} \u00b7 ${dl.name.toLowerCase()} delivery</p>
    <div class="bx-req__actions">
      <a class="link" href="https://wa.me/${studio.whatsapp}?text=${bookingMessage(r)}" target="_blank" rel="noopener">Send on WhatsApp</a>${cancel}
    </div></article>`;
}

function bookingMessage(r) {
  const g = groupById(r.group), t = SHOOT_TYPES[r.type], s = SESSIONS.find((x) => x.id === r.session), dl = deliveryById(r.delivery);
  return encodeURIComponent(`Hi Eran Studio, I'd like to book a shoot.\n` +
    `Shoot: ${t.name}, ${g.name.toLowerCase()} (${r.people} ${r.people === 1 ? "person" : "people"})\n` +
    `Session: ${s.name}, ${r.photos} extra photo${r.photos === 1 ? "" : "s"}\n` +
    `Delivery: ${dl.name}\nTotal: ${fmtK(r.total)}\n` +
    `Date: ${fmtDate(r.date)}, ${r.slot.toLowerCase()}\n` +
    (r.place ? `Location: ${r.place}\n` : "") + (r.notes ? `Notes: ${r.notes}\n` : "") +
    `Name: ${client.firstName}, ${client.phone}`);
}

// ---------- Step 1: the setting ----------
const bookScreen = {
  render() {
    const lowest = Math.min(...GROUPS.map((g) => g.base));
    const types = Object.values(SHOOT_TYPES).map((t, i) => {
      const img = photoUrl(t.photo, 1100);
      return `<button class="bx-type" type="button" data-type="${t.id}">
        <span class="bx-type__media">${img ? `<img src="${esc(img)}" alt="" decoding="async">` : ""}</span>
        <span class="bx-type__no">0${i + 1}</span>
        <span class="bx-type__body">
          <span class="bx-type__name">${t.name === "Indoor" ? "In the studio" : "On location"}</span>
          <span class="bx-type__blurb">${esc(t.blurb)}</span>
          <span class="bx-type__foot"><b>From ${fmtK(lowest + t.extra)}</b><span>Choose ${t.name.toLowerCase()} <i aria-hidden="true">&rarr;</i></span></span>
        </span></button>`;
    }).join("");
    const mine = bookings.slice().reverse().map(requestCard).join("");
    return bxShell(1, `
      <header class="bx-head">
        <p class="bx-kicker">Step 01 &mdash; The setting</p>
        <h1 class="bx-title">Where should we <em>shoot?</em></h1>
        <p class="bx-lede">Start with the setting. Both sit on the same base price \u2014 you add photos, session level and delivery on step three.</p>
      </header>
      <div class="bx-types">${types}</div>
      <p class="bx-help">Not sure yet? <a class="bx-help__link" href="https://wa.me/${studio.whatsapp}" target="_blank" rel="noopener">Message the studio</a> and we&rsquo;ll help you choose.</p>
      ${mine ? `<section class="bx-reqs">
        <div class="bx-reqs__head"><h2>Your requests</h2><span>${bookings.filter((b) => b.status === "requested").length} open</span></div>
        ${mine}</section>` : ""}
    `);
  },
  mount(root, signal) {
    root.addEventListener("click", (e) => {
      const t = e.target.closest("[data-type]");
      if (t) { draft.type = t.dataset.type; location.hash = "#/book/people"; return; }
      const c = e.target.closest("[data-cancel-booking]");
      if (!c) return;
      const r = bookings.find((x) => x.id === Number(c.dataset.cancelBooking));
      if (r) { r.status = "cancelled"; saveStore(); refresh(); }
    }, { signal });
  },
};

// ---------- Step 2: who is coming ----------
const bookPeopleScreen = {
  render() {
    const t = SHOOT_TYPES[draft.type];
    if (!t) return "";
    const cards = GROUPS.map((g) => {
      const img = photoUrl(g.id === "duo" ? "pinkBlazer" : "bench", 900);
      const nums = Array.from({ length: g.max - g.min + 1 }, (_, i) => g.min + i)
        .map((n) => `<button type="button" class="bx-num" data-people="${n}" data-group-for="${g.id}" aria-label="${people(n)}" aria-pressed="false">${n}</button>`).join("");
      return `<article class="bx-group" data-card="${g.id}">
        <div class="bx-group__media">${img ? `<img src="${esc(img)}" alt="" decoding="async">` : ""}<span class="bx-group__range">${g.note}</span></div>
        <div class="bx-group__body">
          <button type="button" class="bx-group__choose" data-group="${g.id}" aria-pressed="false">
            <span class="bx-group__name">${g.name}</span>
            <span class="bx-group__note">Base price, then ${fmtK(g.perPhoto)} for each extra edited photo.</span>
            <span class="bx-group__price">${fmtK(g.base + t.extra)} <small>to start</small></span>
            <span class="bx-group__pick" aria-hidden="true"><i></i>
              <span class="bx-group__pick-off">Choose this group</span>
              <span class="bx-group__pick-on">Selected</span></span>
          </button>
          <div class="bx-group__people">
            <span>How many exactly?</span>
            <div class="bx-nums" role="group" aria-label="Number of people for ${g.name}">${nums}</div>
          </div>
        </div></article>`;
    }).join("");
    return bxShell(2, `
      <header class="bx-head">
        <p class="bx-kicker">Step 02 &mdash; The people</p>
        <h1 class="bx-title">Who is <em>coming?</em></h1>
        <p class="bx-lede">Group size sets your base price. Pick the group, then the exact number of people so we can plan the light and the time.</p>
      </header>
      <div class="bx-groups">${cards}</div>
      <p class="bx-help">A bigger group? <a class="bx-help__link" href="https://wa.me/${studio.whatsapp}" target="_blank" rel="noopener">Message the studio</a> and we&rsquo;ll quote for up to twelve.</p>
      ${bxFoot({ back: "#/book", text: "Continue", disabled: true })}
    `, {
      back: "#/book",
      dock: bxDock({ back: "#/book", label: "Group size", total: "Pick a group", text: "Continue", disabled: true }),
    });
  },
  mount(root, signal) {
    if (!draft.type) { location.replace("#/book"); return; }
    const t = SHOOT_TYPES[draft.type];
    const paint = () => {
      const g = groupById(draft.group);
      root.querySelectorAll(".bx-group").forEach((card) => {
        const on = card.dataset.card === draft.group;
        card.classList.toggle("is-selected", on);
        card.querySelector(".bx-group__choose").setAttribute("aria-pressed", on);
        card.querySelectorAll(".bx-num").forEach((b) => {
          const is = on && Number(b.dataset.people) === draft.people;
          b.classList.toggle("is-on", is); b.setAttribute("aria-pressed", is);
        });
      });
      root.querySelectorAll("[data-next]").forEach((b) => (b.disabled = !g));
      const label = g ? "Base price" : "Group size";
      const total = g ? fmtK(g.base + t.extra) : "Pick a group";
      root.querySelectorAll("[data-dock-label]").forEach((el) => (el.textContent = label));
      root.querySelectorAll("[data-dock-total]").forEach((el) => (el.textContent = total));
      root.querySelectorAll("[data-ticket-host]").forEach((el) => (el.innerHTML = ticketHTML()));
    };
    root.addEventListener("click", (e) => {
      const gr = e.target.closest("[data-group]");
      if (gr && gr.dataset.group !== draft.group) {
        draft.group = gr.dataset.group;
        draft.people = groupById(draft.group).min;
      }
      const pe = e.target.closest("[data-people]");
      if (pe) { draft.group = pe.dataset.groupFor; draft.people = Number(pe.dataset.people); }
      if (e.target.closest("[data-next]") && draft.group) { location.hash = "#/book/plan"; return; }
      paint();
    }, { signal });
    paint();
  },
};

// ---------- Step 3: photos, session and delivery ----------
const bookPlanScreen = {
  render() {
    const g = groupById(draft.group), t = SHOOT_TYPES[draft.type];
    if (!g || !t) return "";
    const ticks = SESSIONS.slice(1).map((s) => `<i class="bx-meter__tick" data-at="${s.from}" style="left:${s.from / MAX_PHOTOS * 100}%"></i>`).join("");
    const labels = SESSIONS.map((s, i) => `<span data-label-for="${i}" style="left:${s.from / MAX_PHOTOS * 100}%">${s.name}</span>`).join("");
    const levels = SESSIONS.map((s, i) => `<button type="button" class="bx-level" data-session="${i}">
        <span class="bx-level__no">0${i + 1}</span>
        <span class="bx-level__name">${s.name}</span>
        <span class="bx-level__perks">${s.perks}</span>
        <span class="bx-level__range">${sessionRange(i)}</span>
        <span class="bx-level__tag">Selected</span></button>`).join("");
    const delivery = DELIVERY.map((d) => `<label class="bx-radio">
        <input type="radio" name="delivery" value="${d.id}" ${d.id === draft.delivery ? "checked" : ""}>
        <span class="bx-radio__dot" aria-hidden="true"></span>
        <span class="bx-radio__body"><b>${d.name}</b><small>${d.note}</small></span>
        <span class="bx-radio__price">${d.price ? "+" + fmtK(d.price) : "Included"}</span></label>`).join("");
    const q = quote(draft);
    return bxShell(3, `
      <header class="bx-head">
        <p class="bx-kicker">Step 03 &mdash; The session</p>
        <h1 class="bx-title">Build your <em>session.</em></h1>
        <p class="bx-lede">Your base price is ${fmtK(g.base + t.extra)}. Add edited photos at ${fmtK(g.perPhoto)} each and the session level rises with you.</p>
      </header>
      <div class="bx-builder">
        <section class="bx-panel bx-count" aria-label="Extra photos">
          <div class="bx-panel__top"><h2>Extra edited photos</h2><span>Max ${MAX_PHOTOS}</span></div>
          <div class="bx-count__row">
            <button class="bx-round" type="button" data-dec aria-label="Remove one photo">&minus;</button>
            <div class="bx-count__n"><output data-n aria-live="polite">${draft.photos}</output><small>photos</small></div>
            <button class="bx-round" type="button" data-inc aria-label="Add one photo">+</button>
          </div>
          <p class="bx-count__calc" data-calc></p>
          <div class="bx-meter" style="--p:${draft.photos / MAX_PHOTOS * 100}">
            <div class="bx-meter__track" role="progressbar" aria-valuemin="0" aria-valuemax="${MAX_PHOTOS}" aria-valuenow="${draft.photos}"><span class="bx-meter__fill"></span>${ticks}</div>
            <div class="bx-meter__labels">${labels}</div>
          </div>
          <p class="bx-meter__msg" data-msg></p>
        </section>
        <section class="bx-panel bx-levels" aria-label="Session level">
          <div class="bx-panel__top"><h2>Session level</h2><span>Rises with photos</span></div>
          <div class="bx-levels__list">${levels}</div>
        </section>
        <section class="bx-panel bx-delivery" aria-label="Delivery speed">
          <div class="bx-panel__top"><h2>Delivery</h2><span>When you see them</span></div>
          <div class="bx-radios" role="radiogroup" aria-label="Delivery speed">${delivery}</div>
        </section>
      </div>
      ${bxFoot({ back: "#/book/people", text: "Continue to date" })}
    `, {
      back: "#/book/people",
      dock: bxDock({ back: "#/book/people", label: sessionSummary(q), total: fmtK(q.total), text: "Continue" }),
    });
  },
  mount(root, signal) {
    if (!groupById(draft.group) || !SHOOT_TYPES[draft.type]) { location.replace("#/book"); return; }
    const meter = root.querySelector(".bx-meter");
    const paint = () => {
      const q = quote(draft), n = draft.photos, at = sessionIndexFor(n), next = SESSIONS[at + 1];
      root.querySelectorAll("[data-n]").forEach((el) => (el.textContent = n));
      root.querySelector("[data-dec]").disabled = n <= 0;
      root.querySelector("[data-inc]").disabled = n >= MAX_PHOTOS;
      root.querySelector("[data-calc]").textContent = n
        ? `${n} extra ${n === 1 ? "photo" : "photos"} \u00b7 ${fmtK(q.photos)}`
        : `Each photo adds ${fmtK(q.group.perPhoto)}`;
      meter.style.setProperty("--p", n / MAX_PHOTOS * 100);
      meter.querySelector(".bx-meter__track").setAttribute("aria-valuenow", n);
      meter.querySelectorAll(".bx-meter__tick").forEach((tk) => tk.classList.toggle("is-hit", n >= Number(tk.dataset.at)));
      meter.querySelectorAll("[data-label-for]").forEach((l) => l.classList.toggle("is-on", Number(l.dataset.labelFor) === at));
      const left = next ? next.from - n : 0;
      root.querySelector("[data-msg]").innerHTML = next
        ? `<b>${left} more photo${left === 1 ? "" : "s"}</b> to reach ${next.name}`
        : `<b>${SESSIONS[at].name}</b> reached, our fullest session`;
      root.querySelectorAll(".bx-level").forEach((el, i) => {
        el.classList.toggle("is-active", i === at);
        el.classList.toggle("is-passed", i < at);
        el.setAttribute("aria-pressed", i === at);
      });
      root.querySelectorAll("[name=delivery]").forEach((r) => (r.checked = r.value === draft.delivery));
      root.querySelectorAll("[data-dock-label]").forEach((el) => (el.textContent = sessionSummary(q)));
      root.querySelectorAll("[data-dock-total]").forEach((el) => (el.textContent = fmtK(q.total)));
      root.querySelectorAll("[data-ticket-host]").forEach((el) => (el.innerHTML = ticketHTML()));
    };
    root.addEventListener("click", (e) => {
      if (!e.target.closest("[data-inc], [data-dec], [data-session], [data-next]")) return; // radios repaint on "change"
      if (e.target.closest("[data-inc]")) draft.photos = Math.min(MAX_PHOTOS, draft.photos + 1);
      else if (e.target.closest("[data-dec]")) draft.photos = Math.max(0, draft.photos - 1);
      const s = e.target.closest("[data-session]");
      if (s) draft.photos = SESSIONS[Number(s.dataset.session)].from;
      if (e.target.closest("[data-next]")) { location.hash = "#/book/details"; return; }
      paint();
    }, { signal });
    root.addEventListener("change", (e) => {
      if (e.target.name === "delivery") { draft.delivery = e.target.value; paint(); }
    }, { signal });
    paint();
  },
};

// ---------- Step 4: date, time and details ----------
const bookDetailsScreen = {
  render() {
    if (!groupById(draft.group) || !SHOOT_TYPES[draft.type]) return "";
    const q = quote(draft);
    const slots = TIME_SLOTS.map((s) => `<label class="bx-slot">
        <input type="radio" name="slot" value="${s}" ${s === draft.slot ? "checked" : ""}>
        <span class="bx-slot__body"><b>${s}</b><small>${SLOT_TIMES[s]}</small></span></label>`).join("");
    const place = draft.type === "outdoor"
      ? `<label class="bx-field"><span>Location</span><input name="place" type="text" maxlength="120" value="${esc(draft.place)}" placeholder="Park, lake, garden or an address"></label>` : "";
    return bxShell(4, `
      <header class="bx-head">
        <p class="bx-kicker">Step 04 &mdash; The date</p>
        <h1 class="bx-title">Pick a <em>day.</em></h1>
        <p class="bx-lede">Choose a date and a time of day. The studio confirms the exact slot on WhatsApp &mdash; usually within a day.</p>
      </header>
      <form class="bx-form" novalidate>
        <div class="bx-form__row">
          <label class="bx-field bx-field--date"><span>Date</span><input name="date" type="date" min="${todayISO(1)}" value="${esc(draft.date)}" required></label>
          <fieldset class="bx-slots"><legend>Time of day</legend><div class="bx-slots__grid">${slots}</div></fieldset>
        </div>
        ${place}
        <label class="bx-field"><span>Anything we should know?</span><textarea name="notes" rows="3" maxlength="300" placeholder="Outfits, ideas, mood &mdash; optional">${esc(draft.notes)}</textarea></label>
        <p class="bx-form__note">No payment now. The studio replies on WhatsApp to confirm your date.</p>
        <p class="form__error" role="alert" hidden></p>
        ${bxFoot({ back: "#/book/plan", text: "Request this date", submit: true })}
      </form>
    `, {
      back: "#/book/plan",
      dock: bxDock({ back: "#/book/plan", label: sessionSummary(q), total: fmtK(q.total), text: "Request", submit: true }),
    });
  },
  mount(root, signal) {
    if (!groupById(draft.group) || !SHOOT_TYPES[draft.type]) { location.replace("#/book"); return; }
    const form = root.querySelector("form"), err = root.querySelector(".form__error");
    const sync = () => {
      draft.date = form.date.value; draft.notes = form.notes.value;
      if (form.place) draft.place = form.place.value;
      draft.slot = form.slot.value;
      root.querySelectorAll("[data-ticket-host]").forEach((el) => (el.innerHTML = ticketHTML()));
    };
    form.addEventListener("input", sync, { signal });
    form.addEventListener("change", sync, { signal });
    root.addEventListener("click", (e) => {
      if (e.target.closest("[data-submit]")) { e.preventDefault(); form.requestSubmit(); }
    }, { signal });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.date.value || form.date.value < todayISO(1)) {
        err.textContent = "Choose a date from tomorrow onwards."; err.hidden = false;
        form.date.focus();
        return;
      }
      err.hidden = true;
      const q = quote(draft);
      const r = { id: Date.now(), type: draft.type, group: draft.group, people: draft.people || q.group.min,
        photos: draft.photos, session: q.session.id, delivery: draft.delivery, total: q.total,
        date: form.date.value, slot: form.slot.value, place: form.place ? form.place.value.trim() : "",
        notes: form.notes.value.trim(), status: "requested" };
      bookings.push(r); saveStore();
      lastBooking = r; draft = blankDraft();
      location.hash = "#/book/sent";
    }, { signal });
  },
};

// ---------- Confirmation: a paper ticket ----------
const bookSentScreen = {
  render() {
    const r = lastBooking;
    if (!r) return "";
    const g = groupById(r.group), t = SHOOT_TYPES[r.type], s = SESSIONS.find((x) => x.id === r.session), dl = deliveryById(r.delivery);
    const d = new Date(r.date + "T00:00:00");
    const ref = `ES-${String(r.id).slice(-6)}`;
    return `<section class="bx-sent">
      <div class="bx-sent__brand"><a href="#/home">Eran <span>Studio</span></a><span>Booking desk</span></div>
      <header class="bx-sent__head">
        <p class="bx-kicker">Request saved</p>
        <h1 class="bx-sent__title">Your date is <em>held.</em></h1>
        <p class="bx-lede">Send this to the studio on WhatsApp and we&rsquo;ll confirm the slot &mdash; usually within a day.</p>
      </header>
      <article class="bx-pass">
        <div class="bx-pass__top"><span>Eran Studio</span><span>Session request</span></div>
        <div class="bx-pass__hero">
          <div class="bx-pass__date"><b>${d.getDate()}</b><span>${d.toLocaleDateString("en-GB", { month: "short" })} ${d.getFullYear()}</span></div>
          <div class="bx-pass__meta"><small>${esc(r.slot)} &middot; ${t.name}</small><b>${esc(g.name)}</b><span>${people(r.people)}</span></div>
        </div>
        <dl class="bx-pass__lines">
          <div><dt>Session</dt><dd>${s.name}</dd></div>
          <div><dt>Extra photos</dt><dd>${r.photos}</dd></div>
          <div><dt>Delivery</dt><dd>${dl.name}</dd></div>
          <div><dt>${r.type === "outdoor" ? "Location" : "Where"}</dt><dd>${r.place ? esc(r.place) : "Eran Studio, Lilongwe"}</dd></div>
        </dl>
        <div class="bx-pass__total"><span>Total</span><strong>${fmtK(r.total)}</strong></div>
        <div class="bx-pass__stub"><span>Ref ${ref}</span><span>No payment taken</span></div>
      </article>
      <div class="bx-sent__actions">
        <a class="bx-sent__wa" href="https://wa.me/${studio.whatsapp}?text=${bookingMessage(r)}" target="_blank" rel="noopener">Send on WhatsApp <span aria-hidden="true">&rarr;</span></a>
        <a class="bx-sent__back" href="#/book">See my requests</a>
      </div>
    </section>`;
  },
  mount() { if (!lastBooking) location.replace("#/book"); },
};
