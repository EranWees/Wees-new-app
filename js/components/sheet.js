// Bottom sheet dialog. Usage: const panel = openSheet({ title, body }); closeSheet();
function closeSheet() {
  document.querySelector(".modal")?.remove();
  document.body.style.overflow = "";
}

function openSheet({ title, body }) {
  closeSheet();
  const host = document.createElement("div");
  host.className = "modal";
  host.innerHTML = `<div class="modal__scrim" data-sheet-close></div>
    <div class="modal__panel" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="handle"></div>
      <h2 class="modal__title">${esc(title)}</h2>${body}
    </div>`;
  document.body.append(host);
  document.body.style.overflow = "hidden";
  host.addEventListener("click", (e) => { if (e.target.closest("[data-sheet-close]")) closeSheet(); });
  const panel = host.querySelector(".modal__panel");
  panel.querySelector("input, select, textarea, button")?.focus();
  return panel;
}

document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });
