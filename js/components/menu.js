// Settings menu (three dots) on the Profile screen. Set up once; works after every re-render.
function initMenu(root) {
  const close = () => {
    const menu = root.querySelector(".menu");
    if (!menu) return;
    menu.hidden = true;
    root.querySelector("[data-menu-toggle]")?.setAttribute("aria-expanded", "false");
  };

  const actions = {
    magazine: () => { location.hash = "#/magazine"; },
    edit: openEditProfile,
    pin: openChangePin,
    contact: () => window.open(`https://wa.me/${studio.whatsapp}`, "_blank", "noopener"),
    logout,
  };

  document.addEventListener("click", (e) => {
    const toggle = e.target.closest("[data-menu-toggle]");
    const menu = root.querySelector(".menu");
    if (toggle && menu) {
      menu.hidden = !menu.hidden;
      toggle.setAttribute("aria-expanded", String(!menu.hidden));
      return;
    }
    const item = e.target.closest("[data-menu-action]");
    if (item) actions[item.dataset.menuAction]?.();
    close();
  });

  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
}
