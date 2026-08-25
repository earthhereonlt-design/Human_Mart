/**
 * Responsive overflow sweep.
 *
 *   npm i -D playwright && npx playwright install chromium
 *   npm run dev                       # in one terminal
 *   node scripts/check-responsive.mjs # in another
 *
 * Screenshots land in screenshots/. Exit code is 1 if anything overflowed, so
 * this can go in CI later.
 *
 * Why element rects and not scrollWidth: globals.css sets `html {
 * overflow-x: clip }` as a safety net, which means a genuinely-too-wide child
 * no longer grows documentElement.scrollWidth — the net silently swallows the
 * evidence. So the page neutralizes that property before measuring, then walks
 * the DOM for boxes poking past the viewport, ignoring anything an ancestor
 * legitimately clips (the marquee is meant to be wider than the screen).
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const VIEWPORTS = [
  { name: "phone-375", width: 375, height: 667 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "laptop-1280", width: 1280, height: 800 },
  { name: "laptop-1440", width: 1440, height: 900 },
];

const ROUTES = [
  ["home", "/"],
  ["explore", "/explore"],
  ["cart", "/cart"],
  ["list", "/list"],
  ["login", "/login"],
  ["probe", "/responsive-probe"],
];

/** Runs in the page. Returns { docScroll, clientWidth, offenders[] }. */
const AUDIT = () => {
  // drop the safety net so real overflow is measurable again
  const html = document.documentElement;
  const prev = html.style.overflowX;
  html.style.overflowX = "visible";

  const limit = html.clientWidth;

  const clippedByAncestor = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if (ox === "hidden" || ox === "clip" || ox === "auto" || ox === "scroll") return true;
    }
    return false;
  };

  const offenders = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const over = Math.max(r.right - limit, -r.left);
    if (over <= 1) continue;
    if (clippedByAncestor(el)) continue;
    offenders.push({
      tag: el.tagName.toLowerCase(),
      cls: (el.getAttribute("class") ?? "").slice(0, 110),
      text: (el.textContent ?? "").trim().slice(0, 40),
      by: Math.round(over),
      width: Math.round(r.width),
    });
  }

  const result = {
    docScroll: html.scrollWidth,
    clientWidth: limit,
    // an inner element usually drags its parents over too; the widest overhang
    // is the one worth reading first
    offenders: offenders.sort((a, b) => b.by - a.by).slice(0, 8),
  };
  html.style.overflowX = prev;
  return result;
};

/** Scroll-triggered Reveal/StaggerItem start hidden and translated. Settle them
 *  first or every measurement is taken mid-animation. */
async function settle(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(700);
}

await mkdir("screenshots", { recursive: true });

const browser = await chromium.launch();
let failures = 0;

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    isMobile: vp.width < 768,
    hasTouch: vp.width < 768,
  });
  const page = await ctx.newPage();

  for (const [label, route] of ROUTES) {
    try {
      await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 30_000 });
    } catch {
      console.log(`  ?  ${vp.name} ${route} — did not load, skipped`);
      continue;
    }
    await settle(page);

    const { docScroll, clientWidth, offenders } = await page.evaluate(AUDIT);
    await page.screenshot({ path: `screenshots/${vp.name}--${label}.png`, fullPage: true });

    if (offenders.length === 0 && docScroll <= clientWidth) {
      console.log(`  ok ${vp.name} ${route}`);
    } else {
      failures++;
      console.log(
        `  XX ${vp.name} ${route} — scrollWidth ${docScroll} vs ${clientWidth}`
      );
      for (const o of offenders) {
        console.log(`       +${o.by}px  <${o.tag} w=${o.width}> ${JSON.stringify(o.text)}`);
        console.log(`               class="${o.cls}"`);
      }
    }
  }
  await ctx.close();
}

await browser.close();
console.log(
  failures === 0
    ? "\nNo horizontal overflow at any tested width."
    : `\n${failures} page/width combinations overflowed — see above.`
);
process.exit(failures === 0 ? 0 : 1);
