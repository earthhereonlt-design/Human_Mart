/**
 * Zero-install version of check-responsive.mjs.
 *
 * Run `npm run dev`, open the site, hit F12, switch on the device toolbar
 * (Ctrl+Shift+M), set the width to 375 / 768 / 1280 / 1440 in turn, and paste
 * the whole of this file into the Console at each one. It prints a table of any
 * element sticking out past the viewport, widest overhang first.
 *
 * Scroll to the bottom of the page and back up before running it — the
 * reveal-on-scroll sections are translated off to the side until they animate
 * in, and they read as false positives while they're still hidden.
 */
(() => {
  // globals.css sets `html { overflow-x: clip }` as a safety net, which stops a
  // too-wide child from growing scrollWidth. Lift it or the bug hides.
  const html = document.documentElement;
  const prev = html.style.overflowX;
  html.style.overflowX = "visible";
  const limit = html.clientWidth;

  const clipped = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if (ox === "hidden" || ox === "clip" || ox === "auto" || ox === "scroll") return true;
    }
    return false;
  };

  const rows = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) continue;
    const by = Math.max(r.right - limit, -r.left);
    if (by <= 1 || clipped(el)) continue;
    rows.push({
      over: Math.round(by) + "px",
      el: el.tagName.toLowerCase(),
      w: Math.round(r.width),
      text: (el.textContent ?? "").trim().slice(0, 34),
      node: el,
    });
  }

  html.style.overflowX = prev;

  console.log(`viewport ${limit}px · document ${html.scrollWidth}px`);
  if (!rows.length) console.log("%cno overflow", "color:green;font-weight:bold");
  else console.table(rows.sort((a, b) => parseInt(b.over) - parseInt(a.over)).slice(0, 12));
})();
