// Booking setup. Every price, name and limit for the booking flow lives here, so changing a number
// or a session name never means touching the screens. Prices are in Malawi kwacha.
const fmtK = (n) => "K" + Number(n).toLocaleString("en-GB");

// Step 1: where the shoot happens. `extra` is an optional surcharge added to the base price (0 for now).
const SHOOT_TYPES = {
  indoor:  { id: "indoor",  name: "Indoor",  photo: "surprised", extra: 0,
             blurb: "In the studio. Controlled light, clean backdrops and no weather to plan around." },
  outdoor: { id: "outdoor", name: "Outdoor", photo: "bench",   extra: 0,
             blurb: "On location. Natural light, open space and a setting that feels like you." },
};

// Step 2: group size. `base` is the starting price, `perPhoto` is added for every extra edited photo.
const GROUPS = [
  { id: "duo",    name: "Solo or couple", min: 1, max: 2, base: 8000,  perPhoto: 10000, note: "1 to 2 people" },
  { id: "family", name: "Family or group", min: 3, max: 7, base: 10000, perPhoto: 10000, note: "3 to 7 people" },
];

// Step 3: the sessions. A client reaches a session by adding photos; `from` is the photo count where it begins.
const MAX_PHOTOS = 20;
const SESSIONS = [
  { id: "standard",  name: "Standard",  from: 0,  perks: "30-minute shoot, 1 outfit, standard edit" },
  { id: "signature", name: "Signature", from: 5,  perks: "60-minute shoot, 2 outfits, full colour edit" },
  { id: "showcase",  name: "Showcase",  from: 10, perks: "90-minute shoot, 3 outfits, full retouch" },
];

// Delivery speed. Standard is the base price; Express and Express Plus add a flat amount.
const DELIVERY = [
  { id: "standard", name: "Standard",     note: "Ready in 5 days",                      price: 0 },
  { id: "express",  name: "Express",      note: "Ready in 48 hours",                    price: 5000 },
  { id: "plus",     name: "Express Plus", note: "Ready in 24 hours, first in the queue", price: 10000 },
];

const TIME_SLOTS = ["Morning", "Afternoon", "Evening"];

const groupById = (id) => GROUPS.find((g) => g.id === id);
const deliveryById = (id) => DELIVERY.find((d) => d.id === id) || DELIVERY[0];
const sessionIndexFor = (photos) => SESSIONS.reduce((at, s, i) => (photos >= s.from ? i : at), 0);
const sessionRange = (i) => {
  const s = SESSIONS[i], next = SESSIONS[i + 1];
  if (!i) return `Up to ${next.from - 1} photos`;
  return `${s.from} to ${next ? next.from - 1 : MAX_PHOTOS} photos`;
};

// One place that turns a draft into prices, so every screen shows the same numbers.
function quote(d) {
  const g = groupById(d.group), t = SHOOT_TYPES[d.type], dl = deliveryById(d.delivery);
  const base = (g ? g.base : 0) + (t ? t.extra : 0);
  const photos = d.photos * (g ? g.perPhoto : 0);
  const delivery = dl.price;
  return { base, photos, delivery, total: base + photos + delivery, group: g, type: t, dl,
           session: SESSIONS[sessionIndexFor(d.photos)] };
}
