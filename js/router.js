const routes = { "/home": homeScreen, "/book": bookScreen, "/book/people": bookPeopleScreen, "/book/plan": bookPlanScreen,
                 "/book/details": bookDetailsScreen, "/book/sent": bookSentScreen, "/profile": profileScreen,
                 "/login": loginScreen, "/dev": devScreen, "/magazine": magazineScreen };
const TITLES = { "/home": "Home", "/book": "Book a shoot", "/book/people": "Group size", "/book/plan": "Build your session",
  "/book/details": "Pick a day", "/book/sent": "Request saved", "/profile": "Profile", "/login": "Log in", "/magazine": "Poster designs" };
let routerRoot, routeAbort;

function refresh() { render(); }

function render() {
  let path = location.hash.slice(1) || "/home";
  if (path !== "/login" && path !== "/dev" && !auth.loggedIn) path = "/login";
  if (path === "/login" && auth.loggedIn) path = "/home";
  const screen = routes[path] || homeScreen;
  document.title = (TITLES[path] || "Eran Studio") + (TITLES[path] ? " | Eran Studio" : "");
  stopCountdowns();
  routeAbort?.abort(); routeAbort = new AbortController();
  const y = window.scrollY;
  routerRoot.innerHTML = screen.render();
  screen.mount?.(routerRoot, routeAbort.signal);
  document.body.classList.toggle("is-auth", path === "/login");
  document.body.classList.toggle("is-mag", path === "/magazine");
  document.body.classList.toggle("is-booking", path.startsWith("/book"));
  document.body.classList.toggle("is-home", path === "/home");
  document.querySelectorAll(".dock__item").forEach((a) => {
    const h = a.getAttribute("href");
    if (h === `#${path}` || (h === "#/book" && path.startsWith("/book"))) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  window.scrollTo(0, window.__navigated ? 0 : y);
}

function startRouter(root) {
  routerRoot = root;
  addEventListener("hashchange", () => { window.__navigated = true; render(); window.__navigated = false; });
  render();
}
