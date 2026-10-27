// Profile menu flows: edit profile, change PIN, log out.
const formError = (panel, msg) => {
  const err = panel.querySelector(".form__error");
  err.textContent = msg; err.hidden = false;
};

function openEditProfile() {
  const panel = openSheet({
    title: "Edit profile",
    body: `<form class="form" novalidate>
      <label class="field">First name<input name="name" value="${esc(client.firstName)}" maxlength="30" autocomplete="given-name"></label>
      <label class="field">Phone<input name="phone" value="${esc(client.phone)}" inputmode="tel" autocomplete="tel"></label>
      <p class="form__error" role="alert" hidden></p>
      <button class="btn btn--solid btn--full" type="submit">Save</button>
      <button class="btn btn--full" type="button" data-sheet-close>Cancel</button>
    </form>`,
  });
  const form = panel.querySelector("form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim(), phone = form.phone.value.trim();
    if (!name) return formError(panel, "Please enter your name.");
    if (digits(phone).length < 9) return formError(panel, "Enter a valid phone number.");
    client.firstName = name; client.phone = phone;
    saveStore(); closeSheet(); showToast("Profile updated"); refresh();
  });
}

function openChangePin() {
  const field = (n, l) => `<label class="field">${l}
    <input name="${n}" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off"></label>`;
  const panel = openSheet({
    title: "Change PIN",
    body: `<form class="form" novalidate>
      ${field("cur", "Current PIN")}${field("next", "New PIN (4 digits)")}${field("again", "Repeat new PIN")}
      <p class="form__error" role="alert" hidden></p>
      <button class="btn btn--solid btn--full" type="submit">Update PIN</button>
      <button class="btn btn--full" type="button" data-sheet-close>Cancel</button>
    </form>`,
  });
  const form = panel.querySelector("form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (form.cur.value !== auth.pin) return formError(panel, "Your current PIN is not correct.");
    if (!/^\d{4}$/.test(form.next.value)) return formError(panel, "The new PIN must be 4 digits.");
    if (form.next.value !== form.again.value) return formError(panel, "The new PINs don't match.");
    auth.pin = form.next.value;
    saveStore(); closeSheet(); showToast("PIN changed");
  });
}

function logout() {
  auth.loggedIn = false;
  saveStore();
  location.hash = "#/login";
}
