// "Poster designs": the client's archive set as a wall of studio posters — the kind of work a
// photography studio posts between shoots. Full-bleed plates, type-led sheets, photo strips,
// contact collages and colour blocks. Paper, ink, teal and the folder earths; no book, no spreads.
// Every poster is drawn on a canvas (1080 x 1350, 4:5) so what you see is what gets saved.

const PST = {
  paper: "#f4efe6", deep: "#e9e2d4", ink: "#14181a", muted: "#6d6c63",
  teal: "#0b6f84", tealLight: "#8ecad6", terra: "#b4552f", olive: "#6f7a45", gold: "#a8801f",
  line: "rgba(20,24,26,.16)", paperLine: "rgba(244,239,230,.28)",
};
const MAG_VIEW_W = 900;
const MAG_EXPORT_W = 1080;

let posterItems = [];
let posterInfo = null;

/* ---------- The wall: eight compositions from the archive ---------- */
function posterPlan() {
  const ready = batches.filter((b) => b.status === "ready")
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const imgs = ready.flatMap((b) => batchImages(b));
  if (!imgs.length) return { items: [], info: null };
  const pick = (i) => imgs[i % imgs.length];
  const stats = clientStats(batches), t = tierInfo(stats.photos);
  const info = { name: client.firstName, year: new Date().getFullYear(), since: client.memberSince,
    stats, t, total: imgs.length, handle: studio.handle, city: studio.city.split(",")[0] };
  const at = (i) => fmtDate(ready[i % ready.length].date);

  const items = [
    { key: "plate", name: "Full bleed", note: "One photograph, one line", date: at(0),
      img: pick(3), title1: "Light, colour", title2: "and real people", series: ready[0].title },
    { key: "stack", name: "Type & plate", note: "The title does the talking", date: at(1),
      img: pick(9), title1: "Sessions for", title2: "real life." },
    { key: "strips", name: "Three strips", note: "A portrait in passing", date: at(2),
      imgs: [pick(2), pick(7), pick(12)], title1: "Portraits,", title2: "in passing." },
    { key: "collage", name: "Contact collage", note: "A week on one sheet", date: at(0),
      imgs: Array.from({ length: 7 }, (_, i) => pick(i * 3 + 1)), title1: "A week in", title2: "frames." },
    { key: "word", name: "One word", note: "Four columns of light", date: at(3),
      imgs: [pick(1), pick(5), pick(8), pick(11)], word: "LIGHT" },
    { key: "quote", name: "Work in progress", note: "A quiet page", date: at(1),
      img: pick(6), title1: "Work in", title2: "progress.",
      quote: "We don't pose moments. We wait for them." },
    { key: "split", name: "Colour block", note: "Words beside a portrait", date: at(2),
      img: pick(10), title1: "The quiet", title2: "kind." },
    { key: "duo", name: "Portrait duo", note: "Two frames, one story", date: at(3),
      imgs: [pick(0), pick(4)], title1: client.firstName },
  ];
  return { items, info };
}

/* ---------- Canvas helpers ---------- */
const pstCache = new Map();
function pstImage(url) {
  if (!url) return Promise.resolve(null);
  if (pstCache.has(url)) return pstCache.get(url);
  const attempt = (cors) => new Promise((resolve) => {
    const im = new Image();
    if (cors) im.crossOrigin = "anonymous";
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.decoding = "async";
    im.src = url;
  });
  const p = attempt(true).then((im) => im || attempt(false));
  pstCache.set(url, p);
  return p;
}

function pstFill(c, im, x, y, w, h, focusY = 0.3) {
  if (!im) {
    const g = c.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, "#e3dbcc"); g.addColorStop(1, "#d2c9ba");
    c.fillStyle = g; c.fillRect(x, y, w, h); return;
  }
  const k = Math.max(w / im.naturalWidth, h / im.naturalHeight), sw = w / k, sh = h / k;
  c.drawImage(im, (im.naturalWidth - sw) / 2, (im.naturalHeight - sh) * focusY, sw, sh, x, y, w, h);
}

function pstShade(c, W, y0, y1, a0, a1, rgb = "10,14,16") {
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, `rgba(${rgb},${a0})`); g.addColorStop(1, `rgba(${rgb},${a1})`);
  c.fillStyle = g; c.fillRect(0, Math.min(y0, y1), W, Math.abs(y1 - y0));
}

function pstText(c, u, s, x, y, o = {}) {
  c.save();
  c.font = `${o.style || ""} ${o.weight || 400} ${(o.size || 3) * u}px ${o.family}`;
  c.fillStyle = o.color || "#fff"; c.globalAlpha = o.alpha ?? 1; c.textBaseline = "alphabetic";
  const sp = (o.spacing || 0) * u, align = o.align || "left";
  const paint = (t, px, py) => c.fillText(t, px, py);
  if (!sp) { c.textAlign = align; paint(s, x * u, y * u); c.restore(); return; }
  c.textAlign = "left";
  const chars = [...s], widths = chars.map((ch) => c.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + sp * (chars.length - 1);
  let px = x * u - (align === "center" ? total / 2 : align === "right" ? total : 0);
  chars.forEach((ch, i) => { paint(ch, px, y * u); px += widths[i] + sp; });
  c.restore();
}

function pstLines(c, u, s, maxW, o) {
  c.save(); c.font = `${o.style || ""} ${o.weight || 400} ${(o.size || 3) * u}px ${o.family}`;
  const out = []; let line = "";
  s.split(" ").forEach((w) => {
    const test = line ? `${line} ${w}` : w;
    if (line && c.measureText(test).width > maxW * u) { out.push(line); line = w; } else line = test;
  });
  if (line) out.push(line);
  c.restore(); return out;
}

function pstFit(c, u, s, size, maxW, o) {
  c.save();
  while (size > 1.2) {
    c.font = `${o.style || ""} ${o.weight || 400} ${size * u}px ${o.family}`;
    if (c.measureText(s).width <= maxW * u) break;
    size -= 0.5;
  }
  c.restore(); return size;
}

let pstGrain = null;
function pstPaper(c, W, H, color, grain = 0.05) {
  c.fillStyle = color; c.fillRect(0, 0, W, H);
  if (!pstGrain) {
    pstGrain = document.createElement("canvas"); pstGrain.width = pstGrain.height = 160;
    const g = pstGrain.getContext("2d"), d = g.createImageData(160, 160);
    for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0);
  }
  c.save(); c.globalAlpha = grain; c.globalCompositeOperation = "multiply";
  c.fillStyle = c.createPattern(pstGrain, "repeat"); c.fillRect(0, 0, W, H); c.restore();
}

const pstRule = (c, u, y, x1 = 7, x2 = 93, color = PST.line, w = 0.14) => {
  c.fillStyle = color; c.fillRect(x1 * u, y * u, (x2 - x1) * u, w * u);
};

const posterFonts = { serif: '"Instrument Serif", Georgia, serif', sans: "Inter, system-ui, sans-serif" };

// One small caption voice, used on every poster.
function pstLabel(c, u, s, x, y, o = {}) {
  pstText(c, u, s, x, y, { family: posterFonts.sans, weight: 600, size: o.size || 1.35,
    spacing: o.spacing ?? 0.55, color: o.color || PST.muted, align: o.align, alpha: o.alpha });
}

function pstFrame(c, u, im, x, y, w, h, border = 2.2) {
  c.fillStyle = PST.paper;
  c.fillRect((x - border) * u, (y - border) * u, (w + border * 2) * u, (h + border * 2) * u);
  pstFill(c, im, x * u, y * u, w * u, h * u, 0.24);
  c.strokeStyle = "rgba(20,24,26,.14)"; c.lineWidth = 0.12 * u;
  c.strokeRect(x * u, y * u, w * u, h * u);
}

/* ---------- The compositions ---------- */
async function posterDraw(c, W, p, info) {
  const u = W / 100, H = W * 1.25;
  const T = (str, x, y, o) => pstText(c, u, str, x, y, { family: posterFonts.sans, ...o });
  const S = (str, x, y, o) => pstText(c, u, str, x, y, { family: posterFonts.serif, ...o });
  const SF = (o) => ({ family: posterFonts.serif, ...o });
  c.clearRect(0, 0, W, H);

  /* 01 — full bleed plate */
  if (p.key === "plate") {
    pstFill(c, await pstImage(p.img), 0, 0, W, H, 0.22);
    pstShade(c, W, 0, 26 * u, 0.58, 0);
    pstShade(c, W, 58 * u, H, 0, 0.93);
    pstLabel(c, u, "ERAN STUDIO  \u00b7  PORTRAIT ARCHIVE", 7, 7.2, { color: PST.paper, size: 1.4, spacing: 0.7 });
    pstLabel(c, u, p.date.toUpperCase(), 93, 7.2, { align: "right", color: PST.paper, size: 1.3, alpha: 0.8 });
    pstLabel(c, u, `SERIES  \u00b7  ${p.series.toUpperCase()}`, 7, 88, { color: PST.tealLight, size: 1.3 });
    const s1 = pstFit(c, u, p.title1, 12.8, 85, SF());
    S(p.title1, 7, 99, { size: s1, color: PST.paper });
    S(p.title2, 7, 110, { size: pstFit(c, u, p.title2, 12.8, 85, SF()), style: "italic", color: PST.paper });
    pstRule(c, u, 114.6, 7, 93, PST.paperLine, 0.12);
    pstLabel(c, u, `${info.total} PHOTOGRAPHS`, 7, 120, { color: PST.paper, size: 1.25, alpha: 0.75 });
    S("01 / 08", 93, 120.6, { size: 2.6, style: "italic", align: "right", color: PST.paper, alpha: 0.8 });
  }

  /* 02 — type stack over a plate */
  if (p.key === "stack") {
    pstPaper(c, W, H, PST.paper);
    pstLabel(c, u, "ERAN STUDIO", 7, 7.2, { color: PST.ink, size: 1.45, spacing: 0.7 });
    pstLabel(c, u, "SESSIONS FOR REAL LIFE", 93, 7.2, { align: "right", color: PST.muted, size: 1.25 });
    pstRule(c, u, 9);
    S(p.title1, 7, 27, { size: pstFit(c, u, p.title1, 12.4, 85, SF()), color: PST.ink });
    S(p.title2, 7, 40, { size: pstFit(c, u, p.title2, 12.4, 85, SF()), style: "italic", color: PST.teal });
    pstLines(c, u, "A portrait should feel like a conversation: simple light, a little direction, and room to be yourself.", 52, SF({ size: 3.6, style: "italic" }))
      .slice(0, 3).forEach((l, i) => S(l, 7, 48.5 + i * 4.6, { size: 3.6, style: "italic", color: PST.ink, alpha: 0.78 }));
    pstRule(c, u, 62.5, 7, 26, PST.teal, 0.45);
    pstLabel(c, u, "PORTRAITS  \u00b7  FAMILIES  \u00b7  EDITORIAL", 7, 57, { size: 1.15 });
    pstFill(c, await pstImage(p.img), 0, 65 * u, W, 60 * u, 0.25);
    pstLabel(c, u, `${p.date.toUpperCase()}  \u00b7  ${info.city.toUpperCase()}`, 7, 120, { color: PST.paper, size: 1.2, alpha: 0.8 });
    S("02 / 08", 93, 120.6, { size: 2.6, style: "italic", align: "right", color: PST.paper, alpha: 0.85 });
  }

  /* 03 — three photo strips on ink */
  if (p.key === "strips") {
    pstPaper(c, W, H, PST.ink, 0.035);
    pstLabel(c, u, "ERAN STUDIO", 7, 7.2, { color: PST.paper, size: 1.4, spacing: 0.7 });
    pstLabel(c, u, "A STUDY IN THREE FRAMES", 93, 7.2, { align: "right", color: PST.paper, size: 1.2, alpha: 0.7 });
    const ims = await Promise.all(p.imgs.map(pstImage));
    const boxes = [[6, 22, 25, 52], [37.5, 12, 25, 66], [69, 26, 25, 50]];
    boxes.forEach((b, i) => pstFill(c, ims[i], b[0] * u, b[1] * u, b[2] * u, b[3] * u, 0.24));
    pstLabel(c, u, "I", 6, 79.5, { color: PST.tealLight, size: 1.15 });
    pstLabel(c, u, "II", 37.5, 83.5, { color: PST.tealLight, size: 1.15 });
    pstLabel(c, u, "III", 69, 81, { color: PST.tealLight, size: 1.15 });
    pstRule(c, u, 97, 7, 17, PST.tealLight, 0.45);
    S(p.title1, 7, 106, { size: pstFit(c, u, p.title1, 10.6, 84, SF()), color: PST.paper });
    S(p.title2, 7, 117, { size: pstFit(c, u, p.title2, 10.6, 84, SF()), style: "italic", color: PST.tealLight });
    pstLabel(c, u, p.date.toUpperCase(), 93, 120, { align: "right", color: PST.paper, size: 1.2, alpha: 0.65 });
  }

  /* 04 — contact-sheet collage */
  if (p.key === "collage") {
    pstPaper(c, W, H, PST.paper);
    pstLabel(c, u, "CONTACT SHEET  \u00b7  2026", 7, 7.2, { color: PST.ink, size: 1.35, spacing: 0.65 });
    pstLabel(c, u, `${info.total} FRAMES`, 93, 7.2, { align: "right", size: 1.2 });
    pstRule(c, u, 9);
    const ims = await Promise.all(p.imgs.map(pstImage));
    const x = [7, 35.5, 64], y = [13.5, 36.5, 59.5], w = 27, h = 21;
    let n = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cell = n++;
        const px = x[col] * u, py = y[row] * u, cw = w * u, ch = h * u;
        if (cell === 4) {                       // a teal word tile
          c.fillStyle = PST.teal; c.fillRect(px, py, cw, ch);
          pstText(c, u, "EST.", x[col] + 2.4, y[row] + 8.4, { family: posterFonts.sans, weight: 600, size: 1.1, spacing: 0.45, color: PST.paper, alpha: 0.75 });
          pstText(c, u, "2026", x[col] + 2.4, y[row] + 16.4, { family: posterFonts.serif, size: 7, color: PST.paper });
          pstText(c, u, info.city.toUpperCase(), x[col] + 2.4, y[row] + 19.2, { family: posterFonts.sans, weight: 600, size: 1, spacing: 0.45, color: PST.paper, alpha: 0.75 });
        } else if (cell === 8) {                // a quiet text tile
          c.fillStyle = PST.deep; c.fillRect(px, py, cw, ch);
          pstLines(c, u, "Nothing staged. Everything felt.", 21, SF({ size: 3.2, style: "italic" })).slice(0, 3)
            .forEach((l, i) => pstText(c, u, l, x[col] + 2.4, y[row] + 8 + i * 4, { family: posterFonts.serif, style: "italic", size: 3.2, color: PST.ink }));
        } else {
          pstFill(c, ims[cell > 4 ? cell - 1 : cell], px, py, cw, ch, 0.24);
        }
      }
    }
    S(p.title1, 7, 94, { size: pstFit(c, u, p.title1, 11.4, 84, SF()), color: PST.ink });
    S(p.title2, 7, 105, { size: pstFit(c, u, p.title2, 11.4, 84, SF()), style: "italic", color: PST.teal });
    pstRule(c, u, 110.5, 7, 93);
    pstLabel(c, u, `${p.date.toUpperCase()}  \u00b7  ${p.note.toUpperCase()}`, 7, 116.5, { size: 1.15 });
    pstLabel(c, u, "ERAN STUDIO", 93, 116.5, { align: "right", size: 1.15, color: PST.ink });
  }

  /* 05 — one word over four columns */
  if (p.key === "word") {
    pstPaper(c, W, H, PST.paper);
    pstLabel(c, u, "ERAN STUDIO  \u00b7  LIGHT STUDIES", 7, 7.2, { color: PST.ink, size: 1.3, spacing: 0.65 });
    pstLabel(c, u, p.date.toUpperCase(), 93, 7.2, { align: "right", size: 1.2 });
    const size = pstFit(c, u, p.word, 30, 86, SF());
    S(p.word, 46, 36, { size, align: "center", color: PST.ink, spacing: 0.4 });
    const ims = await Promise.all(p.imgs.map(pstImage));
    ims.forEach((im, i) => pstFill(c, im, (7 + i * 22) * u, 45 * u, 20 * u, 36 * u, 0.25));
    c.fillStyle = PST.teal; c.fillRect(0, 85 * u, W, 20 * u);
    S("In good light.", 7, 95, { size: pstFit(c, u, "In good light.", 8, 60, SF()), style: "italic", color: PST.paper });
    pstLabel(c, u, "COLOUR  \u00b7  PEOPLE  \u00b7  PLACE", 7, 101.5, { color: PST.paper, size: 1.15, alpha: 0.8 });
    pstRule(c, u, 110, 7, 93);
    pstLabel(c, u, `${info.total} PHOTOGRAPHS  \u00b7  ${info.city.toUpperCase()}`, 7, 117, { size: 1.15 });
    S("05 / 08", 93, 117.6, { size: 2.6, style: "italic", align: "right", color: PST.ink, alpha: 0.7 });
  }

  /* 06 — work in progress, a quiet page */
  if (p.key === "quote") {
    pstPaper(c, W, H, PST.paper);
    pstLabel(c, u, "A NOTE FROM THE STUDIO", 7, 7.2, { color: PST.teal, size: 1.35, spacing: 0.65 });
    pstLabel(c, u, p.date.toUpperCase(), 93, 7.2, { align: "right", size: 1.2 });
    S(p.title1, 7, 29, { size: pstFit(c, u, p.title1, 12.6, 80, SF()), color: PST.ink });
    S(p.title2, 7, 42, { size: pstFit(c, u, p.title2, 12.6, 80, SF()), style: "italic", color: PST.teal });
    pstRule(c, u, 47, 7, 19, PST.teal, 0.45);
    pstLines(c, u, p.quote, 45, SF({ size: 6.6, style: "italic" })).slice(0, 3)
      .forEach((l, i) => S(l, 7, 60 + i * 8.4, { size: 6.6, style: "italic", color: PST.ink }));
    pstFill(c, await pstImage(p.img), 55 * u, 76 * u, 38 * u, 33 * u, 0.24);
    pstLabel(c, u, "A PAUSE, KEPT", 55, 111.6, { color: PST.teal, size: 1.1 });
    pstRule(c, u, 116.5, 7, 93);
    pstLabel(c, u, `${info.name.toUpperCase()}  \u00b7  ${info.year}`, 7, 121.5, { size: 1.15, color: PST.ink });
    S("06 / 08", 93, 121.8, { size: 2.6, style: "italic", align: "right", color: PST.ink, alpha: 0.7 });
  }

  /* 07 — colour block beside a portrait */
  if (p.key === "split") {
    pstPaper(c, W, H, PST.paper);
    pstFill(c, await pstImage(p.img), 42 * u, 0, W - 42 * u, H, 0.2);
    pstShade(c, W, 0, 9 * u, 0.2, 0);
    c.fillStyle = PST.ink; c.fillRect(0, 0, 42 * u, H);
    c.fillStyle = PST.teal; c.fillRect(0, 0, 42 * u, 1.2 * u);
    pstLabel(c, u, "ERAN STUDIO", 7, 8.2, { color: PST.paper, size: 1.35, spacing: 0.65 });
    pstLabel(c, u, "PORTRAIT NOTES", 7, 13.2, { color: PST.tealLight, size: 1.1 });
    S(p.title1, 7, 32, { size: pstFit(c, u, p.title1, 10.2, 30, SF()), color: PST.paper });
    S(p.title2, 7, 42, { size: pstFit(c, u, p.title2, 10.2, 30, SF()), style: "italic", color: PST.tealLight });
    pstLines(c, u, "Soft, but never weak. A portrait should sound like the person in it.", 29, SF({ size: 3.2, style: "italic" }))
      .slice(0, 4).forEach((l, i) => S(l, 7, 50 + i * 4.2, { size: 3.2, style: "italic", color: PST.paper, alpha: 0.75 }));
    ["Natural light", "Honest colour", "Your own pace"].forEach((t, i) => {
      const y = 72 + i * 11;
      pstRule(c, u, y, 7, 37, PST.paperLine, 0.12);
      pstText(c, u, `0${i + 1}`, 7, y + 5.4, { family: posterFonts.sans, weight: 600, size: 1.1, color: PST.tealLight });
      pstText(c, u, t, 12, y + 5.4, { family: posterFonts.sans, weight: 500, size: 2.5, color: PST.paper });
    });
    pstRule(c, u, 110, 7, 37, PST.paperLine, 0.12);
    pstLabel(c, u, p.date.toUpperCase(), 7, 117, { color: PST.paper, size: 1.15, alpha: 0.75 });
    S("07 / 08", 7, 122, { size: 2.6, style: "italic", color: PST.paper, alpha: 0.7 });
    pstLabel(c, u, info.handle.toUpperCase(), 93, 121, { align: "right", color: PST.paper, size: 1.1, alpha: 0.85 });
  }

  /* 08 — portrait duo */
  if (p.key === "duo") {
    pstPaper(c, W, H, PST.paper);
    pstLabel(c, u, "ERAN STUDIO  \u00b7  PORTRAITS", 7, 7.2, { color: PST.ink, size: 1.35, spacing: 0.65 });
    pstLabel(c, u, p.date.toUpperCase(), 93, 7.2, { align: "right", size: 1.2 });
    pstRule(c, u, 9);
    const ims = await Promise.all(p.imgs.map(pstImage));
    pstFrame(c, u, ims[0], 8, 14, 45, 58);
    pstFrame(c, u, ims[1], 50, 30, 42, 52);
    c.fillStyle = PST.teal; c.fillRect(7 * u, 80 * u, 0.5 * u, 12 * u);
    pstLabel(c, u, "IN HER OWN TIME", 10, 84.5, { color: PST.teal, size: 1.15 });
    S(p.title1, 7, 107, { size: pstFit(c, u, p.title1, 22, 86, SF()), style: "italic", color: PST.ink });
    pstRule(c, u, 111.5, 7, 93);
    pstLabel(c, u, `PORTRAIT ARCHIVE  \u00b7  ${info.year}  \u00b7  ${info.city.toUpperCase()}`, 7, 117.5, { size: 1.15 });
    S("08 / 08", 93, 118, { size: 2.6, style: "italic", align: "right", color: PST.ink, alpha: 0.7 });
  }
}

/* ---------- Saving and printing ---------- */

function pstDownload(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

async function posterExport(i) {
  const c = document.createElement("canvas"); c.width = MAG_EXPORT_W; c.height = MAG_EXPORT_W * 1.25;
  await posterDraw(c.getContext("2d"), MAG_EXPORT_W, posterItems[i], posterInfo);
  let blob;
  try { blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("empty"))), "image/png")); }
  catch { return showToast("This photo host blocks saving images. Try Save all instead."); }
  pstDownload(blob, `eran-studio-poster-${i + 1}.png`);
  showToast(`Poster ${i + 1} saved`);
}

// Canvas text only uses a face once it is loaded: request the four cuts the posters draw with.
async function posterLoadFonts() {
  const f = ['400 40px "Instrument Serif"', 'italic 400 40px "Instrument Serif"',
    "500 20px Inter", "600 20px Inter", "600 15px Inter"];
  try { await Promise.race([Promise.all(f.map((x) => document.fonts.load(x, "Aa"))), new Promise((r) => setTimeout(r, 4000))]); } catch {}
}

/* ---------- Screen ---------- */
const magazineScreen = {
  render() {
    const plan = posterPlan(); posterItems = plan.items; posterInfo = plan.info;
    const back = `<button class="mag__back" data-mag-back aria-label="Back to profile"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>`;
    if (!posterItems.length) return `<div class="mag"><header class="mag__bar">${back}<div class="mag__title"><b>Poster designs</b></div></header>
      <p class="mag__empty">Your poster wall is printed from delivered photographs. Once a series is delivered, the designs appear here.</p></div>`;
    const label = "Download";
    return `<div class="mag">
      <header class="mag__bar">${back}
        <div class="mag__title"><b>Poster designs</b><small>${posterItems.length} studies &middot; 4:5 <span class="mag__title-more">&middot; drawn from ${posterInfo.total} photographs</span></small></div>
        <button class="mag__pdf" data-mag-print>Save all</button>
        <span class="mag__progress" aria-hidden="true"></span>
      </header>
      <main class="poster-wall">
        <header class="poster-intro">
          <p class="arch__kick">Studio designs</p>
          <h1>The <em>poster wall</em></h1>
          <p>Eight ways to set a photograph: full bleed, type-led, collage, colour block. Each design is drawn at 4:5, ready to print or post. Save one, or take the whole wall.</p>
        </header>
        <div class="poster-grid">${posterItems.map((p, i) => `<figure class="poster">
          <div class="poster__sheet"><canvas width="${MAG_VIEW_W}" height="${MAG_VIEW_W * 1.25}" role="img" aria-label="Poster ${i + 1}: ${esc(p.name)}"></canvas></div>
          <figcaption class="poster__cap">
            <span class="poster__no">0${i + 1}</span>
            <span class="poster__name">${esc(p.name)}<small>${esc(p.note)}</small></span>
            <span class="poster__date">${esc(p.date)}</span>
            <button class="poster__save" type="button" data-poster-share="${i}">${label}</button>
          </figcaption></figure>`).join("")}</div>
        <p class="poster-foot">Every design uses only your delivered photographs. Colours and type follow the studio's print palette.</p>
      </main>
    </div>`;
  },

  async mount(root, signal) {
    root.querySelector("[data-mag-back]")?.addEventListener("click", () => { location.hash = "#/profile"; }, { signal });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") location.hash = "#/profile"; }, { signal });
    const canvases = [...root.querySelectorAll(".poster canvas")];
    if (!canvases.length) return;

    const bar = root.querySelector(".mag__bar");
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.setProperty("--mag-p", max > 0 ? Math.min(1, scrollY / max).toFixed(3) : 0);
    };
    addEventListener("scroll", onScroll, { passive: true, signal }); onScroll();

    const cs = getComputedStyle(document.documentElement);
    posterFonts.serif = cs.getPropertyValue("--font-display").trim() || posterFonts.serif;
    posterFonts.sans = cs.getPropertyValue("--font-sans").trim() || posterFonts.sans;
    await posterLoadFonts();
    if (signal.aborted) return;

    const done = new WeakSet();
    const paint = (cv) => {
      if (done.has(cv)) return Promise.resolve(); done.add(cv);
      return posterDraw(cv.getContext("2d"), MAG_VIEW_W, posterItems[canvases.indexOf(cv)], posterInfo)
        .then(() => cv.closest(".poster").classList.add("is-ready"));
    };
    // Eight small canvases: paint them in order rather than waiting for scroll,
    // so the wall is complete for reading, saving and printing.
    (async () => {
      for (const cv of canvases) {
        if (signal.aborted) return;
        await paint(cv);
      }
    })();

    root.addEventListener("click", async (e) => {
      const sh = e.target.closest("[data-poster-share]");
      if (sh) { sh.disabled = true; await posterExport(Number(sh.dataset.posterShare)); sh.disabled = false; return; }
      if (e.target.closest("[data-mag-print]")) {
        showToast("Preparing the wall\u2026");
        await Promise.all(canvases.map(paint));
        window.print();
      }
    }, { signal });
  },
};
