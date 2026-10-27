// Saves the app's data on this device (localStorage) so changes survive a refresh.
// Mutates the sample-data objects in place, so screens keep reading `client` and `batches`.
// When Supabase arrives, swap load()/save() for server calls; nothing else needs to change.
const STORE_KEY = "eran.studio.v1";
const bookings = [];
const auth = { loggedIn: true, pin: "1234" }; // prototype only: PIN is stored unhashed on-device
const seed = JSON.parse(JSON.stringify({ client, batches }));

function saveStore() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ client, batches, bookings, auth })); } catch {}
}

(function loadStore() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (!s) return;
    Object.assign(client, s.client);
    batches.splice(0, batches.length, ...s.batches);
    bookings.splice(0, bookings.length, ...(s.bookings || []));
    Object.assign(auth, s.auth);
  } catch {}
})();

function resetStore() {
  Object.assign(client, seed.client);
  batches.splice(0, batches.length, ...JSON.parse(JSON.stringify(seed.batches)));
  bookings.length = 0;
  Object.assign(auth, { loggedIn: true, pin: "1234" });
  saveStore();
}
