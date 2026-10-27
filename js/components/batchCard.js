
const LABEL = { unpaid: "Unpaid", pending_verification: "Verifying payment", paid: "In progress", ready: "Ready" };
const CLASS = { unpaid: "unpaid", pending_verification: "pending", paid: "paid", ready: "ready" };

function body(b) {
  switch (b.status) {
    case "unpaid":
      return `<p class="folder__note">We'll start once your payment is confirmed.</p>
              <button class="btn btn--solid btn--full" data-release="${b.id}">Release these photos</button>`;
    case "pending_verification":
      return `<p class="folder__note">We're checking your payment and will update this shortly.</p>`;
    case "paid":
      return `${countdownHTML(b.timerStartedAt + b.deliveryHours * 3600e3)}
              <p class="folder__note">Your photos are being prepared.</p>`;
    case "ready":
      return `<button class="btn btn--solid btn--full" data-download="${esc(safeUrl(b.galleryUrl))}">Download my photos</button>`;
  }
}

function batchCard(b) {
  return `<article class="folder">
    <div class="folder__row">
      <div><div class="folder__title">${esc(b.title)}</div>
      <div class="folder__meta">${b.photos} photos, ${fmtDate(b.date)}</div></div>
      <span class="status status--${CLASS[b.status]}">${LABEL[b.status]}</span>
    </div>${body(b)}</article>`;
}
