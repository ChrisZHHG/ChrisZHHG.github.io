#!/usr/bin/env node
/**
 * Adaptive-layout verification — fresh loads across devices + live switching.
 *
 *   node tests/adaptive.mjs [--shots <dir>] [--only <substring>]
 *
 * Needs Playwright with Chromium (require('playwright') must resolve). Serves
 * the repo itself on a random local port; nothing else to set up.
 *
 * PASS CRITERIA (every check below must hold; the script exits 1 otherwise)
 *
 *  A. Fresh load, per device profile (phones, foldables, tablets, Mac, Windows
 *     with classic scrollbars at 100% / 125% / 150% scaling, ultrawide):
 *     A1 no page errors, no console errors
 *     A2 the layout mode matches the device (cinema: fine pointer and > 880px;
 *        reel otherwise)
 *     A3 layout width == window width (no scrollbar steals width on any OS)
 *     A4 no horizontal overflow at any scroll position
 *     A5 the frame at the viewport center is horizontally centered (±1px)
 *     A6 the page is completable by scroll alone: the coda is reachable
 *
 *  B. Live switching without reload (resize, window drag, rotate, unfold,
 *     reduced-motion toggle), from a known frame:
 *     B1 the same logical frame (hero / project N / section) is at the center
 *        after every change
 *     B2 the mode-bound engine matches the new mode: cinema has Lenis and one
 *        focal card; the reel has no Lenis and no coverflow residue
 *     B3 A3–A5 hold at the new size
 *     B4 no page errors
 *
 *  C. Smoothness of a switch, sampled every animation frame in the page:
 *     C1 zero wrong frames: every frame painted after the change already shows
 *        the target frame (no flash of the old layout, no jump-then-correct)
 *     C2 no drift: the scroll position stays put after the first frame
 *     C3 a mode flip closes the shutter in its first frame and it is fully
 *        open again within 400ms; resizes inside one mode never show it
 *     C4 the controller's own work per change — teardown, rebuild, forced
 *        style + layout of the new layout, re-seat — never costs more than two
 *        60Hz frames (< 33.4ms); the typical cost is printed per change.
 *        Frame-to-frame times are printed too, but not gated: headless
 *        Chromium paints on the CPU, so they measure this machine, not the page
 *     C5 after a switch into the cinema, a wheel gesture scrolls forward from
 *        where the reader is (Lenis has not kept a stale target)
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const shotsDir = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : null;
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
if (shotsDir) fs.mkdirSync(shotsDir, { recursive: true });

// ── static server ───────────────────────────────────────────────────────────
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.json': 'application/json',
};
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, url === '/' ? 'index.html' : url);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

// ── reporting ───────────────────────────────────────────────────────────────
const failures = [];
let checks = 0;
function check(label, ok, detail = '') {
  checks += 1;
  if (!ok) failures.push(`${label}${detail ? ' — ' + detail : ''}`);
  return ok;
}
const log = (...a) => console.log(...a);

// ── in-page probes ──────────────────────────────────────────────────────────
const PROBES = () => {
  window.__probe = {
    frame() {
      const vh = innerHeight;
      const vc = vh / 2;
      const archive = document.getElementById('archive');
      const cards = [...archive.querySelectorAll('.card')];
      const layout = document.documentElement.dataset.layout || '';
      const carousel = layout === 'cinema';
      const r = archive.getBoundingClientRect();
      if (carousel && r.top <= 1 && r.bottom >= vh - 1) {
        const i = cards.findIndex((c) => c.classList.contains('is-active'));
        return { name: 'card' + i, el: cards[i] };
      }
      const els = [document.querySelector('.act-hero'), ...(carousel ? [archive] : cards),
        ...document.querySelectorAll('.act-quiet, .act-coda')];
      for (const el of els) {
        const b = el.getBoundingClientRect();
        if (b.top <= vc && b.bottom > vc) {
          const name = el.classList.contains('card') ? 'card' + cards.indexOf(el) : (el.id === 'intro' ? 'hero' : el.id);
          return { name, el };
        }
      }
      return { name: 'gap', el: null };
    },
    state() {
      const html = document.documentElement;
      const cw = html.clientWidth;
      const f = this.frame();
      let off = null;
      if (f.el) {
        const target = f.el.classList.contains('act-hero') ? f.el.querySelector('.hero-headline') || f.el : f.el;
        const b = target.getBoundingClientRect();
        off = (b.left + b.right) / 2 - cw / 2;
      }
      const cards = [...document.querySelectorAll('#archive .card')];
      return {
        layout: html.dataset.layout,
        lenis: html.classList.contains('lenis'),
        iw: innerWidth, cw, sw: html.scrollWidth, y: Math.round(scrollY),
        max: html.scrollHeight - innerHeight,
        frame: f.name, off,
        actives: cards.filter((c) => c.classList.contains('is-active')).length,
        residue: cards.filter((c) => c.style.getPropertyValue('--o') !== '' || c.classList.contains('is-prev')).length,
        veil: (document.querySelector('.fold-veil') || {}).className || '',
        reducedQuery: matchMedia('(prefers-reduced-motion: reduce)').matches,
        fold: window.__fold ? { ...window.__fold } : null,
      };
    },
    // Wait until the coverflow has finished sliding the focal card into place.
    async calm(limit = 1500) {
      const els = [...document.querySelectorAll('#archive .card')];
      const running = els.flatMap((el) => el.getAnimations());
      await Promise.race([
        Promise.all(running.map((a) => a.finished.catch(() => {}))),
        new Promise((r) => setTimeout(r, limit)),
      ]);
    },
    // Record one sample per animation frame (= what gets painted).
    record() {
      const samples = [];
      let t0 = performance.now();
      let last = t0;
      let raf = 0;
      const tick = (now) => {
        const veil = document.querySelector('.fold-veil');
        samples.push({
          t: now - t0, dt: now - last, y: Math.round(scrollY), frame: this.frame().name,
          veil: veil ? parseFloat(getComputedStyle(veil).opacity) : 0,
          iw: innerWidth, ih: innerHeight,
        });
        last = now;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      this.stop = () => { cancelAnimationFrame(raf); return samples; };
    },
    jump(y) {
      const s = document.documentElement.style;
      const prev = s.scrollBehavior;
      s.scrollBehavior = 'auto';
      window.scrollTo(0, y);
      s.scrollBehavior = prev;
    },
    // Scroll so a logical frame sits at the viewport center.
    targetY(name) {
      const vh = innerHeight;
      const archive = document.getElementById('archive');
      const cards = [...archive.querySelectorAll('.card')];
      const carousel = document.documentElement.dataset.layout === 'cinema';
      const y0 = scrollY;
      if (name.startsWith('card')) {
        const k = Number(name.slice(4));
        if (carousel) {
          const r = archive.getBoundingClientRect();
          return y0 + r.top + ((k + 0.4) / cards.length) * (r.height - vh);
        }
        const b = cards[k].getBoundingClientRect();
        return y0 + b.top + b.height / 2 - vh / 2;
      }
      const el = name === 'hero' ? document.querySelector('.act-hero') : document.getElementById(name);
      const b = el.getBoundingClientRect();
      return y0 + b.top + b.height / 2 - vh / 2;
    },
  };
};

const settle = (page, ms = 120) => page.evaluate((ms) => new Promise((r) => {
  requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms)));
}), ms);

async function goTo(page, name) {
  await page.evaluate((n) => window.__probe.jump(window.__probe.targetY(n)), name);
  await settle(page, 250);
  await page.evaluate((n) => window.__probe.jump(window.__probe.targetY(n)), name);
  await settle(page, 250);
}

function expectedMode(p, reduced = false) {
  const reel = p.touch || p.w <= 880;
  return `${reel ? 'reel' : 'cinema'}${reduced ? '-still' : ''}`;
}

function geometry(label, s) {
  check(`${label}: layout width == window width`, s.cw === s.iw, `clientWidth ${s.cw} vs innerWidth ${s.iw}`);
  check(`${label}: no horizontal overflow`, s.sw <= s.cw, `scrollWidth ${s.sw} > ${s.cw}`);
  if (s.off !== null) check(`${label}: ${s.frame} centered`, Math.abs(s.off) <= 1, `off by ${s.off.toFixed(1)}px`);
}

// ── profiles ────────────────────────────────────────────────────────────────
const PROFILES = [
  { name: 'iPhone SE', w: 375, h: 553, dpr: 2, touch: true },
  { name: 'iPhone 15', w: 393, h: 660, dpr: 3, touch: true },
  { name: 'iPhone 15 Pro Max', w: 430, h: 740, dpr: 3, touch: true },
  { name: 'Pixel 8', w: 412, h: 780, dpr: 2.625, touch: true },
  { name: 'Galaxy Fold (folded)', w: 344, h: 882, dpr: 3, touch: true },
  { name: 'Galaxy Fold (open)', w: 882, h: 1104, dpr: 2.5, touch: true },
  { name: 'iPhone 15 landscape', w: 852, h: 361, dpr: 3, touch: true },
  { name: 'iPad portrait', w: 820, h: 1180, dpr: 2, touch: true },
  { name: 'iPad landscape', w: 1180, h: 820, dpr: 2, touch: true },
  { name: 'narrow desktop window', w: 800, h: 900, dpr: 1, touch: false, classic: true },
  { name: 'Windows 1366x768 100%', w: 1366, h: 768, dpr: 1, touch: false, classic: true },
  { name: 'Windows 1536x864 125%', w: 1536, h: 864, dpr: 1.25, touch: false, classic: true },
  { name: 'Windows 1280x720 150%', w: 1280, h: 720, dpr: 1.5, touch: false, classic: true },
  { name: 'Windows 1920x1080 100%', w: 1920, h: 1080, dpr: 1, touch: false, classic: true },
  { name: 'MacBook Air 13', w: 1440, h: 900, dpr: 2, touch: false },
  { name: 'MacBook Pro 14', w: 1512, h: 982, dpr: 2, touch: false },
  { name: 'MacBook Pro 16', w: 1728, h: 1117, dpr: 2, touch: false },
  { name: 'iMac / 1440p', w: 2560, h: 1440, dpr: 1, touch: false, classic: true },
  { name: 'Ultrawide 3440', w: 3440, h: 1440, dpr: 1, touch: false, classic: true },
];

const classicBrowser = await chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] });
const overlayBrowser = await chromium.launch();

async function open(p, { gate = false } = {}) {
  const browser = p.classic ? classicBrowser : overlayBrowser;
  const ctx = await browser.newContext({
    viewport: { width: p.w, height: p.h },
    deviceScaleFactor: p.dpr,
    isMobile: !!p.touch,
    hasTouch: !!p.touch,
  });
  if (!gate) await ctx.addInitScript(() => { try { localStorage.setItem('cz_visited_v2', '1'); } catch (_) {} });
  await ctx.addInitScript(PROBES);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR|favicon|cz-analytics/i.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto(BASE + '?v=' + Date.now(), { waitUntil: 'load' });
  await settle(page, 400);
  return { ctx, page, errors };
}

async function shot(page, name) {
  if (!shotsDir) return;
  await page.screenshot({ path: path.join(shotsDir, name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.png') });
}

// ── A. fresh loads ──────────────────────────────────────────────────────────
log('\nA. Fresh load per device');
for (const p of PROFILES) {
  if (only && !p.name.includes(only)) continue;
  const { ctx, page, errors } = await open(p);
  const L = `[A ${p.name} ${p.w}x${p.h}@${p.dpr}]`;
  const failsBefore = failures.length;
  let s = await page.evaluate(() => window.__probe.state());
  check(`${L} mode`, s.layout === expectedMode(p), `got ${s.layout}, want ${expectedMode(p)}`);
  check(`${L} engine`, s.layout.startsWith('cinema') ? s.lenis : !s.lenis, `lenis=${s.lenis}`);
  let worst = 0;
  let maxOverflow = 0;
  let worstFrame = '';
  const step = Math.round(p.h * 0.5);
  for (let y = 0; y <= s.max + step; y += step) {
    await page.evaluate((y) => window.__probe.jump(y), Math.min(y, s.max));
    await settle(page, 60);
    await page.evaluate(() => window.__probe.calm());
    const t = await page.evaluate(() => window.__probe.state());
    maxOverflow = Math.max(maxOverflow, t.sw - t.cw);
    if (t.off !== null && Math.abs(t.off) > Math.abs(worst)) { worst = t.off; worstFrame = `${t.frame}@y${t.y}`; }
    check(`${L} layout width == window width @y${t.y}`, t.cw === t.iw, `${t.cw} vs ${t.iw}`);
  }
  check(`${L} no horizontal overflow at any scroll`, maxOverflow <= 0, `overflow ${maxOverflow}px`);
  check(`${L} every frame centered`, Math.abs(worst) <= 1, `worst ${worst.toFixed(1)}px at ${worstFrame}`);
  await page.evaluate(() => window.__probe.jump(1e7));
  await settle(page, 200);
  const end = await page.evaluate(() => {
    const c = document.getElementById('contact').getBoundingClientRect();
    return c.top < innerHeight && c.bottom > 0;
  });
  check(`${L} coda reachable by scroll`, end);
  await shot(page, `A-${p.name}-end`);
  await goTo(page, 'card2');
  await shot(page, `A-${p.name}-card2`);
  check(`${L} no errors`, errors.length === 0, errors.join(' | '));
  log(`  ${failures.length === failsBefore ? '✓' : '✗'} ${p.name.padEnd(24)} ${s.layout.padEnd(7)} worst center ${worst.toFixed(1)}px${worstFrame ? ' (' + worstFrame + ')' : ''}, overflow ${maxOverflow}px, errors ${errors.length}`);
  await ctx.close();
}

// ── B + C. live switching ───────────────────────────────────────────────────
async function change(page, label, to, expect, { flip, errors }) {
  await page.evaluate(() => window.__probe.record());
  const before = await page.evaluate(() => ({ switches: window.__fold.switches }));
  if (to.reduced !== undefined) await page.emulateMedia({ reducedMotion: to.reduced ? 'reduce' : 'no-preference' });
  if (to.w) await page.setViewportSize({ width: to.w, height: to.h });
  await page.evaluate((ms) => new Promise((r) => setTimeout(r, ms)), flip ? 900 : 400);
  const samples = await page.evaluate(() => window.__probe.stop());
  await page.evaluate(() => window.__probe.calm());
  const s = await page.evaluate(() => window.__probe.state());
  const L = `[B ${label}]`;
  const failsBefore = failures.length;

  check(`${L} B1 frame kept`, s.frame === expect.frame, `at ${s.frame}, want ${expect.frame}`);
  check(`${L} B2 mode`, s.layout === expect.mode, `got ${s.layout}, want ${expect.mode} (reduced query ${s.reducedQuery})`);
  if (s.layout === 'cinema') {
    check(`${L} B2 cinema engine`, s.lenis && s.actives === 1, `lenis=${s.lenis} actives=${s.actives}`);
  } else {
    check(`${L} B2 static engine`, !s.lenis && s.residue === 0, `lenis=${s.lenis} residue=${s.residue}`);
  }
  geometry(L + ' B3', s);
  check(`${L} B4 no errors`, errors.length === 0, errors.join(' | '));

  // Samples after the viewport actually changed.
  const changedAt = to.w ? samples.findIndex((x) => x.iw === to.w && x.ih === to.h) : samples.findIndex((x, i) => i > 0 && x.y !== samples[0].y) ;
  const after = changedAt >= 0 ? samples.slice(changedAt) : samples.slice(1);
  const wrong = after.filter((x) => x.frame !== expect.frame);
  check(`${L} C1 zero wrong frames`, wrong.length === 0, `${wrong.length}/${after.length} frames showed ${[...new Set(wrong.map((x) => x.frame))].join(',')}`);
  const ys = after.map((x) => x.y);
  const drift = ys.length ? Math.max(...ys) - Math.min(...ys) : 0;
  check(`${L} C2 no drift after first frame`, drift <= 1, `scroll moved ${drift}px across ${ys.length} frames`);
  const switched = s.fold.switches > before.switches;
  if (flip && to.reduced) {
    check(`${L} C3 mode flip happened`, switched);
    check(`${L} C3 no shutter under reduced motion`, after.every((x) => x.veil === 0), `veil ${Math.max(...after.map((x) => x.veil))}`);
  } else if (flip) {
    check(`${L} C3 mode flip happened`, switched);
    const first = after[0];
    check(`${L} C3 shutter closed on the swap frame`, first && first.veil > 0.9, `veil ${first && first.veil}`);
    const open400 = after.filter((x) => x.t - (first ? first.t : 0) >= 400);
    check(`${L} C3 shutter open by 400ms`, open400.length > 0 && open400.every((x) => x.veil < 0.02), `veil ${open400.map((x) => x.veil.toFixed(2)).join(',')}`);
  } else {
    check(`${L} C3 no shutter inside one mode`, !switched && after.every((x) => x.veil === 0), `switched=${switched}`);
  }
  check(`${L} C4 controller cost < 33.4ms`, s.fold.lastCostMs < 33.4, `${s.fold.lastCostMs.toFixed(1)}ms`);
  // Reported, not gated: headless Chromium rasterises on the CPU with no GPU,
  // so a full repaint at a new window size is slow here whatever the page does.
  const longest = Math.max(0, ...after.slice(1).map((x) => x.dt));

  if (s.layout === 'cinema' && flip) {
    const y0 = s.y;
    await page.mouse.move(s.cw / 2, 300);
    await page.mouse.wheel(0, 240);
    await page.evaluate(() => new Promise((r) => setTimeout(r, 700)));
    const y1 = await page.evaluate(() => Math.round(scrollY));
    check(`${L} C5 wheel scrolls forward from the kept frame`, y1 > y0 && y1 - y0 < 1200, `y ${y0} → ${y1}`);
    await page.evaluate((y) => window.__probe.jump(y), y0);
    await settle(page, 200);
  }
  log(`  ${failures.length === failsBefore ? '✓' : '✗'} ${label.padEnd(46)} → ${s.layout.padEnd(12)} ${s.frame.padEnd(11)} cost ${s.fold.lastCostMs.toFixed(1)}ms, longest frame ${longest.toFixed(0)}ms, wrong ${wrong.length}, drift ${drift}px`);
  await shot(page, `B-${label}`);
}

async function scenario(title, p, steps) {
  if (only && !title.includes(only)) return;
  log(`\nB/C. ${title}`);
  const { ctx, page, errors } = await open(p);
  let cur = { ...p };
  for (const st of steps) {
    if (st.goto) {
      await goTo(page, st.goto);
      const f = await page.evaluate(() => window.__probe.state().frame);
      check(`[B ${title}] reached ${st.goto}`, f === st.goto, `at ${f}`);
      continue;
    }
    const next = { ...cur, ...st.to };
    const mode = expectedMode(next, !!next.reduced);
    const flip = mode !== expectedMode(cur, !!cur.reduced);
    await change(page, `${title}: ${st.label}`, st.to, { frame: st.frame, mode }, { flip, errors });
    cur = next;
  }
  await ctx.close();
}

const desk = { w: 1440, h: 900, dpr: 2, touch: false };
const win = { w: 1536, h: 864, dpr: 1.25, touch: false, classic: true };
const phone = { w: 393, h: 660, dpr: 3, touch: true };
const fold = { w: 344, h: 882, dpr: 3, touch: true };

for (const [title, base] of [['Mac window', desk], ['Windows window', win]]) {
  await scenario(title, base, [
    { goto: 'card3' },
    { label: 'narrow to 860 (cinema → reel)', to: { w: 860, h: 900 }, frame: 'card3' },
    { label: 'phone width 400', to: { w: 400, h: 900 }, frame: 'card3' },
    { label: 'back to wide (reel → cinema)', to: { w: base.w, h: base.h }, frame: 'card3' },
    { label: 'grow to 1920x1080', to: { w: 1920, h: 1080 }, frame: 'card3' },
    { label: 'shrink height to 700', to: { w: 1920, h: 700 }, frame: 'card3' },
    { goto: 'background' },
    { label: 'narrow to 700 at #background', to: { w: 700, h: 700 }, frame: 'background' },
    { label: 'wide again at #background', to: { w: 1440, h: 900 }, frame: 'background' },
    { goto: 'hero' },
    { label: 'narrow at hero', to: { w: 600, h: 900 }, frame: 'hero' },
    { label: 'wide at hero', to: { w: 1440, h: 900 }, frame: 'hero' },
    { goto: 'card5' },
    { label: 'reduced motion on (cinema → still)', to: { reduced: true }, frame: 'card5' },
    { label: 'reduced motion off', to: { reduced: false }, frame: 'card5' },
  ]);
}

await scenario('Foldable', fold, [
  { goto: 'card2' },
  { label: 'unfold 344 → 882', to: { w: 882, h: 1104 }, frame: 'card2' },
  { label: 'fold back 882 → 344', to: { w: 344, h: 882 }, frame: 'card2' },
  { goto: 'developing' },
  { label: 'unfold at #developing', to: { w: 882, h: 1104 }, frame: 'developing' },
  { label: 'fold at #developing', to: { w: 344, h: 882 }, frame: 'developing' },
]);

await scenario('Phone rotation', phone, [
  { goto: 'card4' },
  { label: 'rotate to landscape', to: { w: 852, h: 361 }, frame: 'card4' },
  { label: 'rotate to portrait', to: { w: 393, h: 660 }, frame: 'card4' },
  { goto: 'interests' },
  { label: 'rotate to landscape at #interests', to: { w: 852, h: 361 }, frame: 'interests' },
  { label: 'rotate to portrait at #interests', to: { w: 393, h: 660 }, frame: 'interests' },
]);

// Continuous window drag across the breakpoint, one resize event per step.
async function drag(title, p, frame, widths) {
  if (only && !title.includes(only)) return;
  log(`\nB/C. ${title}`);
  const { ctx, page, errors } = await open(p);
  await goTo(page, frame);
  let cur = { ...p };
  let ok = 0;
  for (const w of widths) {
    const next = { ...cur, w };
    const flip = expectedMode(next) !== expectedMode(cur);
    const before = failures.length;
    await page.evaluate(() => window.__probe.record());
    await page.setViewportSize({ width: w, height: p.h });
    await page.evaluate((ms) => new Promise((r) => setTimeout(r, ms)), flip ? 450 : 60);
    const samples = await page.evaluate(() => window.__probe.stop());
    await page.evaluate(() => window.__probe.calm());
    const s = await page.evaluate(() => window.__probe.state());
    const L = `[B ${title} @${w}]`;
    check(`${L} frame kept`, s.frame === frame, `at ${s.frame}`);
    check(`${L} mode`, s.layout === expectedMode(next), s.layout);
    geometry(L, s);
    const after = samples.slice(Math.max(0, samples.findIndex((x) => x.iw === w)));
    const wrong = after.filter((x) => x.frame !== frame).length;
    check(`${L} zero wrong frames`, wrong === 0, `${wrong} wrong`);
    check(`${L} controller cost < 33.4ms`, s.fold.lastCostMs < 33.4, `${s.fold.lastCostMs.toFixed(1)}ms`);
    if (failures.length === before) ok += 1;
    cur = next;
  }
  check(`${title} no errors`, errors.length === 0, errors.join(' | '));
  log(`  ${ok === widths.length ? '✓' : '✗'} ${ok}/${widths.length} drag steps kept ${frame}`);
  await ctx.close();
}
const sweep = [];
for (let w = 1440; w >= 640; w -= 40) sweep.push(w);
for (let w = 680; w <= 1440; w += 40) sweep.push(w);
await drag('Window drag 1440 ↔ 640 at card 4', desk, 'card4', sweep);
await drag('Window drag 1440 ↔ 640 at #writing', win, 'writing', sweep);

// Gate path: first visit, dismissed by the first wheel.
if (!only || 'Gate'.includes(only)) {
  log('\nA. First visit through the gate');
  const { ctx, page, errors } = await open({ w: 1536, h: 864, dpr: 1.25, classic: true }, { gate: true });
  const gated = await page.evaluate(() => document.body.classList.contains('is-gated'));
  const g = await page.evaluate(() => {
    const cw = document.documentElement.clientWidth;
    const b = document.querySelector('.gate-line').getBoundingClientRect();
    return { off: (b.left + b.right) / 2 - cw / 2, cw, iw: innerWidth };
  });
  check('[A gate] shown on first visit', gated);
  check('[A gate] thesis centered', Math.abs(g.off) <= 1, `off ${g.off.toFixed(1)}px`);
  await page.mouse.move(700, 400);
  await page.mouse.wheel(0, 120);
  await settle(page, 900);
  const s = await page.evaluate(() => window.__probe.state());
  check('[A gate] dismissed by scroll', !(await page.evaluate(() => document.body.classList.contains('is-gated'))));
  geometry('[A gate] after dismiss', s);
  check('[A gate] no errors', errors.length === 0, errors.join(' | '));
  log(`  ✓ gate centered (${g.off.toFixed(1)}px), dismissed by wheel`);
  await ctx.close();
}

await classicBrowser.close();
await overlayBrowser.close();
server.close();

log(`\n${checks - failures.length}/${checks} checks passed`);
if (failures.length) {
  log('\nFAILURES');
  failures.forEach((f) => log('  ✗ ' + f));
  process.exit(1);
}
log('ALL PASS');
