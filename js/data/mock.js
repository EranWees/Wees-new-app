// Sample data. Replaced by Supabase calls once login is built.
const studio = {
  whatsapp: "265999000000",
  phone: "+265 999 000 000",
  email: "hello@eranstudio.mw",
  address: "Area 47, Sector 4",           // placeholder: shown in the Home page footer
  city: "Lilongwe, Malawi",
  mapQuery: "Area 47, Lilongwe, Malawi",
  payName: "Eran Studio",
  handle: "@eranstudio",              // shown on the poster designs (placeholder)
  payMethods: "Airtel Money or TNM Mpamba",
  payNumber: "0999 000 000",
  hours: "Mon to Sat, 8:00 to 17:00",   // placeholder: shown on the Home page
  // Placeholder numbers for the Home page "proof" row. Replace with the studio's real figures.
  proof: [ { n: "500+", label: "sessions shot" }, { n: "20k+", label: "photos delivered" } ],
};

// Packages offered on the Book screen. Prices are placeholders in Malawi kwacha.
const packages = [
  { id: "portrait", name: "Portrait session", detail: "1 hour, 1 outfit, 20 edited photos", price: 60000 },
  { id: "family", name: "Family session", detail: "90 minutes, up to 6 people, 35 edited photos", price: 95000 },
  { id: "event", name: "Event coverage", detail: "Up to 4 hours, 100 edited photos", price: 250000 },
  { id: "wedding", name: "Wedding", detail: "Full day, 2 photographers, 300 edited photos", price: 750000 },
];

const client = {
  firstName: "Esther",
  phone: "+265 99 000 0000",
  memberSince: 2026,
};

// Free-to-use Unsplash portraits, all in colour. To add more: open a photo on unsplash.com, copy the
// "photo-xxxxxxxx-xxxx" part of its image address, and add it to PHOTOS below.
const unsplash = (id, w = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`;

const PHOTOS = {
  bench: "photo-1595871465907-19020bb76ad1",     // woman on a bench in front of a colourful wall
  redWall: "photo-1664451177753-e80c12066b24",   // woman in a blue shirt against red
  pinkBlazer: "photo-1604261605115-4b34b646a05c",// smiling woman in a pink blazer
  blueJacket: "photo-1637028357803-78764289ffe5",// man in glasses and a blue jacket
  tie: "photo-1707932484405-d8cac82c76c4",       // smiling young man holding a black tie
  knitCap: "photo-1611814798699-ee14591b5d0c",   // woman in a parka and red and white knit cap
  surprised: "photo-1742429072327-c31681787f56", // woman peering through her fingers
  piercings: "photo-1742429064530-8186d3473d00", // portrait, direct gaze
  beard: "photo-1710695570399-7d6e3725ba23",     // man with a beard in a multicoloured shirt
  tealTop: "photo-1603476428986-0ad9377d0d30",   // woman in a teal tank top
  orangeBg: "photo-1733971878319-c607817a911f",  // man in front of orange and yellow
  benchHand: "photo-1708590021324-76c11a1e6a68", // woman sitting on a bench
  redFlower: "photo-1595550422119-eb1785a44daa", // woman holding a red flower
  redHair: "photo-1725288453683-3d3a6ec420ec",   // woman with red hair at a table
};

// Hero photo comes from the studio's own work, never the client's photos.
// Replace this with a photo of the studio's best work when available.
const coverImage = unsplash(PHOTOS.redWall, 1600);
const photoPool = Object.values(PHOTOS).map((id) => unsplash(id));

// The gallery is built from the delivered sessions, so it always has exactly as many photos as the
// profile counts (a session of 30 photos gives 30 gallery photos). With real data, give each batch an
// `images: [url, ...]` list and it is used instead of these samples.
function batchImages(b) {
  if (b.images) return b.images;
  if (!photoPool.length) return [];
  return Array.from({ length: b.photos }, (_, i) => photoPool[(b.id * 7 + i) % photoPool.length]);
}
function galleryFor(list) {
  return list.filter((b) => b.status === "ready")
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .flatMap(batchImages);
}

// Home banner: the studio's own work, fading from one photo to the next. Each slide: image, small label, title.
// Later the studio manages these from its own side.
const showcase = [
  { img: unsplash(PHOTOS.redWall, 1200),    kicker: "Portraits",   title: "Colour that stays with you" },
  { img: unsplash(PHOTOS.pinkBlazer, 1200), kicker: "Celebrations", title: "Birthdays and big days" },
  { img: unsplash(PHOTOS.bench, 1200),      kicker: "Lifestyle",   title: "Relaxed, natural sessions" },
  { img: unsplash(PHOTOS.blueJacket, 1200), kicker: "Professional", title: "Headshots with presence" },
  { img: unsplash(PHOTOS.redFlower, 1200),  kicker: "Editorial",   title: "Bold, magazine-style work" },
];

const batches = [
  { id: 1, title: "Graduation portraits", price: 45000, photos: 24, date: "2026-10-12", status: "unpaid" },
  { id: 2, title: "Family session", price: 95000, photos: 40, date: "2026-10-03", status: "pending_verification" },
  { id: 3, title: "Wedding", price: 750000, photos: 120, date: "2026-09-27", status: "paid",
    timerStartedAt: Date.now() - 6 * 3600e3, deliveryHours: 48 },
  { id: 4, title: "Studio portraits", photos: 30, date: "2026-09-14", status: "ready",
    galleryUrl: "https://example.com", cover: unsplash(PHOTOS.redWall) },
  { id: 5, title: "Birthday session", photos: 48, date: "2026-08-22", status: "ready",
    galleryUrl: "https://example.com", cover: unsplash(PHOTOS.pinkBlazer) },
  { id: 6, title: "Corporate headshots", photos: 36, date: "2026-07-09", status: "ready",
    galleryUrl: "https://example.com", cover: unsplash(PHOTOS.blueJacket) },
  { id: 7, title: "Editorial portraits", photos: 64, date: "2026-05-30", status: "ready",
    galleryUrl: "https://example.com", cover: unsplash(PHOTOS.redHair) },
];
