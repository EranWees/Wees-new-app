const loginScreen = {
  render() {
    return `<section class="screen screen--login">
      <p class="eyebrow">Client access</p>
      <h1 class="title">Eran <em>Studio</em></h1>
      <p class="subtle">Log in to see your photos</p>
      <form class="form" novalidate>
        <label class="field">Phone number<input name="phone" inputmode="tel" autocomplete="tel" placeholder="+265 ..."></label>
        <label class="field">PIN<input name="pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="current-password"></label>
        <p class="form__error" role="alert" hidden></p>
        <button class="btn btn--solid btn--full" type="submit">Log in</button>
      </form>
      <p class="subtle hint">Log in again with the phone number on your profile and PIN 1234.</p>
    </section>`;
  },
  mount(root) {
    const form = root.querySelector("form"), err = root.querySelector(".form__error");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (digits(form.phone.value) === digits(client.phone) && form.pin.value === auth.pin) {
        auth.loggedIn = true; saveStore(); location.hash = "#/home";
      } else {
        err.textContent = "Phone number or PIN is not correct."; err.hidden = false;
        form.pin.value = ""; form.pin.focus();
      }
    });
  },
};
