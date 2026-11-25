#!/usr/bin/env node
/**
 * Phone verification — every frame of the 35mm reel on every phone profile.
 *
 *   node tests/mobile.mjs [--shots <dir>] [--only <substring>]
 *
 * RESOLUTIONS. Every profile is Playwright's own device descriptor (1.63):
 * the CSS viewport measured in the phone's stock browser with its toolbars
 * showing, the full screen size, the device pixel ratio, touch and the real
 * user agent. A phone browser's visible area moves between two bounds while
 * you scroll — toolbars shown (the smallest, = 100svh) and toolbars collapsed
 * (at most the full screen, = 100lvh); in-app browsers such as WeChat sit in
 * between. Each phone is tested at BOTH bounds:
 *   "shown"  viewport = descriptor viewport (e.g. iPhone 16: 393×659)
 *   "full"   viewport = descriptor screen   (e.g. iPhone 16: 393×852)
 * plus landscape, a live rotation, and a live toolbar collapse.
 *
 * GATED (exit 1 if any fails), per phone and bound:
 *   M1 no page errors, no console errors
 *   M2 the reel is live: data-layout=reel, no Lenis, scroll-snap on <html>
 *   M3 nothing visible pokes past the left or right screen edge (checked per
 *      element — the page clips sideways overflow, so scrollWidth can't see it)
 *   M4 every frame cell is symmetric: equal left and right gutters
 *   M5 no text is truncated (no clamp, no ellipsis, no clipped box)
 *   M6 every link and button has a ≥44px-tall hit area that nothing covers
 *   M7 a rotation to landscape and back keeps the reader on the same frame
 *   M8 a toolbar collapse never moves the reader. On a real phone the
 *      viewport units svh / lvh / vh stay fixed while the toolbars slide, so
 *      layout only reflows through dvh or JS-written heights; the check is
 *      (a) no dvh anywhere in the CSS, (b) no inline height written into a
 *      frame, (c) a height-only resize on touch never makes the fold
 *      controller re-seat. (Chromium emulation recomputes svh on every
 *      resize, so watching scrollY across a resize would test the emulator.)
 * REPORTED (not gated — a content decision, see CLAUDE.md §4/§6):
 *   F  one frame = one screen: frames whose content runs past the screen
 *      bottom with the toolbars shown, and by how much
 *   T  the smallest text size on the page
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

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

// ── phones ──────────────────────────────────────────────────────────────────
const PHONES = [
  'iPhone SE', 'iPhone SE (3rd gen)', 'iPhone 13 Mini', 'iPhone 14', 'iPhone 16e',
  'iPhone 15', 'iPhone 16', 'iPhone 16 Pro', 'iPhone 17 Pro', 'iPhone 15 Plus',
  'iPhone 16 Pro Max', 'iPhone 17 Pro Max',
  'Galaxy S9+', 'Galaxy S24', 'Galaxy A55', 'Pixel 5', 'Pixel 7', 'Pixel 8', 'Pixel 9',
  'Pixel 9 Pro', 'Pixel 9 Pro XL', 'Galaxy Z Flip 7', 'Galaxy Z Fold 7 Cover', 'Galaxy Z Fold 7',
].filter((n) => devices[n]);

// ── reporting ───────────────────────────────────────────────────────────────
const failures = [];
const warnings = [];
let checks = 0;
function check(label, ok, detail = '') {
  checks += 1;
  if (!ok) failures.push(`${label}${detail ? ' — ' + detail : ''}`);
  return ok;
}

// ── in-page probes ──────────────────────────────────────────────────────────
const PROBES = () => {
  const FRAME_SEL = '.act-hero, #archive .card, .act-quiet, .act-coda';
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    for (let p = el; p && p !== document.body; p = p.parentElement) {
      const ps = getComputedStyle(p);
      if (ps.display === 'none' || ps.visibility === 'hidden' || parseFloat(ps.opacity) === 0) return false;
    }
    return true;
  };
  const ownText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const nameOf = (el) => {
    const id = el.id ? '#' + el.id : '';
    const cls = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28);
    return `${el.tagName.toLowerCase()}${id}${cls}${text ? ' "' + text + '"' : ''}`;
  };

  window.__phone = {
    frames() {
      const cards = [...document.querySelectorAll('#archive .card')];
      return [...document.querySelectorAll(FRAME_SEL)].map((el) => (
        el.classList.contains('card') ? 'card' + cards.indexOf(el) : (el.id === 'intro' ? 'hero' : el.id)
      ));
    },
    frameEl(name) {
      if (name.startsWith('card')) return document.querySelectorAll('#archive .card')[Number(name.slice(4))];
      return name === 'hero' ? document.querySelector('.act-hero') : document.getElementById(name);
    },
    // Seat a frame in the gate the way a flick + scroll-snap would: top at 0.
    seat(name) {
      const el = this.frameEl(name);
      const s = document.documentElement.style;
      const prev = s.scrollBehavior;
      s.scrollBehavior = 'auto';
      window.scrollTo(0, el.getBoundingClientRect().top + scrollY);
      s.scrollBehavior = prev;
    },
    global() {
      const html = document.documentElement;
      return {
        layout: html.dataset.layout,
        lenis: html.classList.contains('lenis'),
        snap: getComputedStyle(html).scrollSnapType,
        cw: html.clientWidth, iw: innerWidth, vh: innerHeight,
        fold: window.__fold ? { restores: window.__fold.restores, switches: window.__fold.switches } : null,
      };
    },
    report(name) {
      const frame = this.frameEl(name);
      const cw = document.documentElement.clientWidth;
      const vh = innerHeight;
      const fr = frame.getBoundingClientRect();
      const fs = getComputedStyle(frame);
      const out = {
        name,
        frame: { left: fr.left, right: cw - fr.right, top: fr.top, height: fr.height,
          padL: parseFloat(fs.paddingLeft), padR: parseFloat(fs.paddingRight) },
        contentBottom: 0, outside: [], clipped: [], taps: [], minFont: Infinity, minFontEl: '',
      };
      const all = [...frame.querySelectorAll('*')].filter(visible);
      for (const el of all) {
        const r = el.getBoundingClientRect();
        const tag = el.tagName;
        const leaf = ownText(el) || ['IMG', 'IFRAME', 'VIDEO', 'SVG', 'svg', 'BUTTON', 'A', 'INPUT', 'CANVAS'].includes(tag);
        if (!leaf) continue;
        out.contentBottom = Math.max(out.contentBottom, r.bottom - fr.top);
        if (r.left < -0.5 || r.right > cw + 0.5) out.outside.push(`${nameOf(el)} [${r.left.toFixed(0)}…${r.right.toFixed(0)} of ${cw}]`);
        if (ownText(el)) {
          const cs = getComputedStyle(el);
          const size = parseFloat(cs.fontSize);
          if (size < out.minFont) { out.minFont = size; out.minFontEl = nameOf(el); }
          const clipsY = /hidden|clip/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1;
          const clipsX = /hidden|clip/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1;
          const clamp = cs.webkitLineClamp && cs.webkitLineClamp !== 'none';
          if (clipsY || clipsX || clamp) out.clipped.push(`${nameOf(el)} (${clamp ? 'line-clamp ' + cs.webkitLineClamp : clipsY ? 'clipped ' + (el.scrollHeight - el.clientHeight) + 'px tall' : 'clipped ' + (el.scrollWidth - el.clientWidth) + 'px wide'})`);
        }
      }
      // Tap targets that are on screen right now: probe 21px above and below
      // the centre — a 44px-tall hit area — and require that the link itself
      // (or something inside it) answers there, not a neighbour or an overlay.
      for (const el of frame.querySelectorAll('a[href], button, [role="button"], .embed-poster')) {
        if (!visible(el)) continue;
        const r = el.getBoundingClientRect();
        const cx = (r.left + r.right) / 2;
        const cy = (r.top + r.bottom) / 2;
        if (cy - 22 < 0 || cy + 22 > vh) continue;
        const owns = (y) => { const hit = document.elementFromPoint(cx, y); return !!hit && (hit === el || el.contains(hit)); };
        const ok = owns(cy) && owns(cy - 21) && owns(cy + 21);
        const coveredBy = owns(cy) ? null : document.elementFromPoint(cx, cy);
        out.taps.push({ el: nameOf(el), h: r.height, ok, coveredBy: coveredBy ? nameOf(coveredBy) : null });
      }
      return out;
    },
    frameAtCenter() {
      const vc = innerHeight / 2;
      for (const name of this.frames()) {
        const r = this.frameEl(name).getBoundingClientRect();
        if (r.top <= vc && r.bottom > vc) return name;
      }
      return 'gap';
    },
  };
};

const settle = (page, ms = 150) => page.evaluate((ms) => new Promise((r) => {
  requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms)));
}), ms);

const browser = await chromium.launch();

async function open(desc, viewport) {
  const { defaultBrowserType, ...ctxDesc } = desc;
  const ctx = await browser.newContext({ ...ctxDesc, viewport });
  await ctx.addInitScript(() => { try { localStorage.setItem('cz_visited_v2', '1'); } catch (_) {} });
  await ctx.addInitScript(PROBES);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR|favicon|cz-analytics/i.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto(BASE + '?v=' + Date.now(), { waitUntil: 'load' });
  await settle(page, 500);
  return { ctx, page, errors };
}

const rows = [];

async function runBound(name, desc, bound) {
  const viewport = bound === 'shown' ? desc.viewport : { width: desc.screen.width, height: desc.screen.height };
  const L = `[${name} ${bound} ${viewport.width}×${viewport.height}]`;
  const { ctx, page, errors } = await open(desc, viewport);
  const g = await page.evaluate(() => window.__phone.global());
  check(`${L} M2 reel live`, g.layout === 'reel' && !g.lenis && /y/.test(g.snap), `layout=${g.layout} lenis=${g.lenis} snap=${g.snap}`);
  check(`${L} layout width == screen width`, g.cw === g.iw, `${g.cw} vs ${g.iw}`);

  const frames = await page.evaluate(() => window.__phone.frames());
  const over = [];
  let outside = 0;
  let clipped = 0;
  let tapBad = 0;
  let tapCount = 0;
  let minFont = Infinity;
  let minFontEl = '';
  for (const f of frames) {
    await page.evaluate((f) => window.__phone.seat(f), f);
    await settle(page, 120);
    const r = await page.evaluate((f) => window.__phone.report(f), f);
    const asym = Math.abs(r.frame.left - r.frame.right) > 0.5 || Math.abs(r.frame.padL - r.frame.padR) > 0.5;
    check(`${L} M4 ${f} symmetric`, !asym, `gutters L${r.frame.left.toFixed(1)}/R${r.frame.right.toFixed(1)}, padding ${r.frame.padL}/${r.frame.padR}`);
    check(`${L} M3 ${f} inside the screen`, r.outside.length === 0, r.outside.slice(0, 3).join('; '));
    check(`${L} M5 ${f} no truncated text`, r.clipped.length === 0, r.clipped.slice(0, 3).join('; '));
    for (const t of r.taps) {
      tapCount += 1;
      if (!check(`${L} M6 ${f} tap target`, t.ok, `${t.el} is ${t.h.toFixed(0)}px tall${t.coveredBy ? ', covered by ' + t.coveredBy : ''}`)) tapBad += 1;
    }
    outside += r.outside.length;
    clipped += r.clipped.length;
    if (r.minFont < minFont) { minFont = r.minFont; minFontEl = r.minFontEl; }
    const runOver = Math.round(r.contentBottom - g.vh);
    if (bound === 'shown' && runOver > 0) over.push(`${f} +${runOver}`);
    if (shotsDir && (bound === 'shown')) {
      await page.screenshot({ path: path.join(shotsDir, `${name}-${f}`.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.png') });
    }
  }
  if (bound === 'shown' && over.length) warnings.push(`${name} (${viewport.width}×${viewport.height}): ${over.length}/${frames.length} frames run past one screen — ${over.join(', ')}`);

  if (bound === 'shown') {
    // M8: toolbar collapse mid-read — height grows to the full screen, width stays.
    await page.evaluate(() => window.__phone.seat('card2'));
    await settle(page, 200);
    const before = await page.evaluate(() => ({ y: Math.round(scrollY), ...window.__phone.global() }));
    await page.setViewportSize({ width: viewport.width, height: desc.screen.height });
    await settle(page, 250);
    const mid = await page.evaluate(() => ({ y: Math.round(scrollY), ...window.__phone.global() }));
    await page.setViewportSize(viewport);
    await settle(page, 250);
    const after = await page.evaluate(() => ({ y: Math.round(scrollY), ...window.__phone.global() }));
    check(`${L} M8 toolbar collapse does not re-seat`, mid.fold.restores === before.fold.restores && after.fold.restores === before.fold.restores,
      `restores ${before.fold.restores} → ${mid.fold.restores} → ${after.fold.restores}`);
    const dyn = await page.evaluate(() => {
      const hits = [];
      const walk = (sheet) => {
        let rules;
        try { rules = sheet.cssRules; } catch (_) { return; }
        for (const rule of rules) {
          if (rule.styleSheet) walk(rule.styleSheet);
          if (rule.cssRules) walk(rule);
          if (rule.style && /\bd(v|vb|vi)h\b|\bdv(w|max|min)\b/.test(rule.cssText)) hits.push(rule.selectorText || rule.cssText.slice(0, 60));
        }
      };
      [...document.styleSheets].forEach(walk);
      const inline = [...document.querySelectorAll('.act-hero, #archive .card, .act-quiet, .act-coda, .act-hero *, #archive .card *, .act-quiet *, .act-coda *')]
        .filter((el) => /(^|;)\s*(min-|max-)?height\s*:/.test(el.getAttribute('style') || '')).map((el) => el.tagName + '.' + el.className);
      return { hits, inline };
    });
    check(`${L} M8 no dynamic viewport units`, dyn.hits.length === 0, dyn.hits.join(', '));
    check(`${L} M8 no JS-written frame heights`, dyn.inline.length === 0, dyn.inline.join(', '));

    // M7: live rotation from a known frame.
    for (const f of ['card3', 'background']) {
      await page.evaluate((f) => window.__phone.seat(f), f);
      await settle(page, 200);
      const start = await page.evaluate(() => window.__phone.frameAtCenter());
      await page.setViewportSize({ width: viewport.height, height: viewport.width });
      await settle(page, 300);
      const land = await page.evaluate(() => window.__phone.frameAtCenter());
      const landG = await page.evaluate(() => window.__phone.global());
      await page.setViewportSize(viewport);
      await settle(page, 300);
      const back = await page.evaluate(() => window.__phone.frameAtCenter());
      check(`${L} M7 rotate at ${f}`, start === f && land === f && back === f, `${start} → landscape ${land} → portrait ${back}`);
      check(`${L} M7 landscape is the reel`, landG.layout === 'reel', landG.layout);
    }
  }

  check(`${L} M1 no errors`, errors.length === 0, errors.join(' | '));
  rows.push({ name, bound, vp: `${viewport.width}×${viewport.height}`, dpr: desc.deviceScaleFactor, frames: frames.length,
    over: bound === 'shown' ? over.length : '–', outside, clipped, taps: `${tapCount - tapBad}/${tapCount}`, minFont, minFontEl, errors: errors.length });
  await ctx.close();
}

async function runLandscape(name, desc) {
  const land = devices[`${name} landscape`];
  const viewport = land ? land.viewport : { width: desc.viewport.height, height: desc.viewport.width };
  const L = `[${name} landscape ${viewport.width}×${viewport.height}]`;
  const { ctx, page, errors } = await open(land || desc, viewport);
  const g = await page.evaluate(() => window.__phone.global());
  check(`${L} M2 reel live`, g.layout === 'reel' && !g.lenis, `layout=${g.layout} lenis=${g.lenis}`);
  const frames = await page.evaluate(() => window.__phone.frames());
  let outside = 0;
  let clipped = 0;
  for (const f of frames) {
    await page.evaluate((f) => window.__phone.seat(f), f);
    await settle(page, 100);
    const r = await page.evaluate((f) => window.__phone.report(f), f);
    check(`${L} M4 ${f} symmetric`, Math.abs(r.frame.left - r.frame.right) <= 0.5 && Math.abs(r.frame.padL - r.frame.padR) <= 0.5, `L${r.frame.left}/R${r.frame.right}`);
    check(`${L} M3 ${f} inside the screen`, r.outside.length === 0, r.outside.slice(0, 3).join('; '));
    check(`${L} M5 ${f} no truncated text`, r.clipped.length === 0, r.clipped.slice(0, 3).join('; '));
    outside += r.outside.length;
    clipped += r.clipped.length;
  }
  check(`${L} M1 no errors`, errors.length === 0, errors.join(' | '));
  rows.push({ name, bound: 'landscape', vp: `${viewport.width}×${viewport.height}`, dpr: desc.deviceScaleFactor, frames: frames.length,
    over: '–', outside, clipped, taps: '–', minFont: '', minFontEl: '', errors: errors.length });
  await ctx.close();
}

for (const name of PHONES) {
  if (only && !name.includes(only)) continue;
  const desc = devices[name];
  if (!desc.screen) desc.screen = { width: desc.viewport.width, height: desc.viewport.height };
  const before = failures.length;
  await runBound(name, desc, 'shown');
  await runBound(name, desc, 'full');
  await runLandscape(name, desc);
  const mine = rows.filter((r) => r.name === name);
  const s = mine.find((r) => r.bound === 'shown');
  console.log(`${failures.length === before ? '✓' : '✗'} ${name.padEnd(22)} ${String(s.vp).padEnd(9)} @${s.dpr}  screen ${desc.screen.width}×${desc.screen.height}  `
    + `frames past one screen ${s.over}/${s.frames}  taps ${s.taps}  min text ${s.minFont}px`);
}

await browser.close();
server.close();

console.log(`\n${checks - failures.length}/${checks} gated checks passed`);
if (warnings.length) {
  console.log('\nREPORTED — one frame = one screen (toolbars shown):');
  warnings.forEach((w) => console.log('  · ' + w));
}
const fonts = rows.filter((r) => r.bound === 'shown').map((r) => `${r.minFont}px ${r.minFontEl}`);
console.log('\nREPORTED — smallest text: ' + [...new Set(fonts)].join(' | '));
if (failures.length) {
  console.log('\nFAILURES');
  [...new Set(failures)].forEach((f) => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('ALL GATED CHECKS PASS');
