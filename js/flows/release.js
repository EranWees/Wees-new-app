// "Release these photos": client pays by mobile money, enters the reference, studio verifies.
function openRelease(id) {
  const b = batches.find((x) => x.id === Number(id));
  if (!b || b.status !== "unpaid") return;
  const panel = openSheet({
    title: "Release your photos",
    body: `<p class="subtle">${esc(b.title)}, ${b.photos} photos</p>
      <div class="pay">
        <div class="pay__amount">${fmtMoney(b.price)}</div>
        <ol class="pay__steps">
          <li>Send <b>${fmtMoney(b.price)}</b> by ${esc(studio.payMethods)} to <b>${esc(studio.payNumber)}</b> (${esc(studio.payName)}).</li>
          <li>Enter the transaction reference from your confirmation message below.</li>
        </ol>
      </div>
      <form class="form" novalidate>
        <label class="field">Transaction reference
          <input name="ref" autocomplete="off" autocapitalize="characters" placeholder="e.g. MP2610XXXX" required>
        </label>
        <p class="form__error" role="alert" hidden></p>
        <button class="btn btn--solid btn--full" type="submit">I've paid</button>
        <button class="btn btn--full" type="button" data-sheet-close>Cancel</button>
      </form>`,
  });
  const form = panel.querySelector("form"), err = panel.querySelector(".form__error");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const ref = form.ref.value.trim();
    if (ref.length < 4) { err.textContent = "Enter the reference from your payment message."; err.hidden = false; return; }
    b.status = "pending_verification";
    b.paymentRef = ref.toUpperCase();
    b.paidAt = Date.now();
    saveStore();
    closeSheet();
    showToast("Thanks, we're checking your payment");
    refresh();
  });
}
