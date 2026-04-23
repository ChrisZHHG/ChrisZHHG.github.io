/* ==========================================================================
   Runtime modules — extracted into an external script file.
   Each block is a small namespace to keep concerns separated.
   ========================================================================== */

document.documentElement.classList.add('js');

const root = document.documentElement;
const body = document.body;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

/* ---------- Utility ---------- */
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
function setVar(name, value) { root.style.setProperty(name, value); }

/* ==========================================================================
   Audio — lazy-initialised Web Audio, shutter + focus-lock sounds
   ========================================================================== */
const Audio = (() => {
  let ctx = null;
  let muted = false;
  let noiseBuffer = null;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    /* Pre-build a short white-noise buffer for shutter clicks */
    const len = Math.floor(ctx.sampleRate * 0.18);
    noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return ctx;
  }

  function click({ centerFreq = 2800, q = 10, duration = 0.07, gain = 0.18 } = {}) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = centerFreq;
    bp.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(gain, c.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
    src.connect(bp).connect(g).connect(c.destination);
    src.start();
    src.stop(c.currentTime + duration + 0.02);
  }

  function tone({ from = 1900, to = 1500, duration = 0.08, gain = 0.06 } = {}) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(from, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(to, c.currentTime + duration);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(gain, c.currentTime + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
    osc.connect(g).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + duration + 0.02);
  }

  function shutter()  { click({ centerFreq: 2800, q: 9,  duration: 0.08, gain: 0.22 }); }
  function softTick() { click({ centerFreq: 5200, q: 14, duration: 0.04, gain: 0.12 }); }
  function lockChime(){ tone({ from: 1900, to: 1500, duration: 0.09, gain: 0.05 }); }

  function toggle() {
    muted = !muted;
    if (!muted) ensure();
    const btn = document.querySelector('.audio-toggle');
    if (btn) {
      btn.querySelector('.audio-label').textContent = muted ? 'sound · off' : 'sound · on';
      btn.setAttribute('aria-pressed', String(muted));
    }
  }

  return { ensure, shutter, softTick, lockChime, toggle,
           get muted() { return muted; } };
})();

document.querySelector('.audio-toggle').addEventListener('click', () => Audio.toggle());

/* ==========================================================================
   Grain canvas — render subtle noise once, set as background-image
   ========================================================================== */
(function renderGrain() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    img.data[i]   = v;
    img.data[i+1] = v;
    img.data[i+2] = v;
    img.data[i+3] = 32;
  }
  ctx.putImageData(img, 0, 0);
  const url = `url(${canvas.toDataURL('image/png')})`;
  document.querySelectorAll('.grain-film, .grain-paper').forEach(el => {
    el.style.backgroundImage = url;
    el.style.backgroundSize = `${size}px ${size}px`;
  });
})();

/* ==========================================================================
   Stage manager — only tracks 'paper' (default) vs 'archive' now.
   The old hero exposure ritual is gone; the page just reads as a document.
   ========================================================================== */
const Stage = (() => {
  let current = 'paper';
  function set(name) {
    if (current === name) return;
    if (current === 'archive') body.classList.remove('stage-archive');
    if (name === 'archive') body.classList.add('stage-archive');
    current = name;
  }
  return { set, get current() { return current; } };
})();

/* ==========================================================================
   Cursor + velocity tracker
   ========================================================================== */
const Cursor = (() => {
  const el = document.querySelector('.cursor');
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let lastX = x, lastY = y, lastT = performance.now();
  let velocityEMA = 0;              // px/s, smoothed
  let dwellTimer = null;
  let isLocking = false;
  let isFlipped = false;             // not used for cursor but for toggle
  const STILL_THRESHOLD = 4;         // px
  const DWELL_MS = 1800;

  // Initialise pointer var
  setVar('--cx', x + 'px');
  setVar('--cy', y + 'px');

  function moveTo(nx, ny) {
    const now = performance.now();
    const dt = Math.max(1, now - lastT);
    const dx = nx - lastX;
    const dy = ny - lastY;
    const speed = Math.hypot(dx, dy) / dt * 1000; // px / s
    /* EMA smoothing for velocity */
    velocityEMA = velocityEMA * 0.7 + speed * 0.3;
    lastX = nx; lastY = ny; lastT = now;
    x = nx; y = ny;
    setVar('--cx', x + 'px');
    setVar('--cy', y + 'px');
    /* Reset dwell */
    if (Math.hypot(dx, dy) > STILL_THRESHOLD) {
      resetDwell();
      FocalPlane.onMotion();
    }
  }

  function resetDwell() {
    if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = null; }
    if (isLocking) { FocalPlane.unlock(); isLocking = false; }
  }

  function scheduleDwell() {
    if (prefersReducedMotion || isCoarsePointer) return;
    if (Stage.current === 'archive') return;
    if (dwellTimer) return;
    dwellTimer = setTimeout(() => {
      if (!isLocking) {
        isLocking = true;
        FocalPlane.lock(x, y);
      }
    }, DWELL_MS);
  }

  /* After every N ms of no motion, schedule a dwell */
  let idleCheck = setInterval(() => {
    if (performance.now() - lastT > 180) scheduleDwell();
  }, 120);

  /* Mouse events */
  window.addEventListener('mousemove', (e) => moveTo(e.clientX, e.clientY), { passive: true });

  /* Hover affordance */
  const hoverSelector = 'a, button, .manifesto-item, .card-flip-hint, .card-split-cta, .demo-link, .demo-video-tile, .poster-cta, .nod-hotspot, [data-role="flip-back"], [data-role="prev"], [data-role="next"]';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverSelector)) el.classList.add('is-hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverSelector)) el.classList.remove('is-hover');
  });

  /* Embedded iframes can still expose their own cursor styles. Fade out the
     custom cursor at boundary to avoid a jarring dual-cursor moment. */
  document.querySelectorAll('iframe').forEach((frame) => {
    frame.addEventListener('mouseenter', () => setVar('--bracket-opacity', '0'));
    frame.addEventListener('mouseleave', () => setVar('--bracket-opacity', '1'));
  });

  /* Velocity getter for Flow module */
  function velocity() { return velocityEMA; }

  /* Hide cursor when leaving window */
  document.addEventListener('mouseleave', () => setVar('--bracket-opacity', '0'));
  document.addEventListener('mouseenter', () => setVar('--bracket-opacity', '1'));

  return {
    velocity,
    get x() { return x; },
    get y() { return y; },
    el
  };
})();

/* ==========================================================================
   Damped oscillator for focus-lock
   ========================================================================== */
function damped(onTick, onDone) {
  if (prefersReducedMotion) { onDone && onDone(); return { cancel() {} }; }
  const zeta = 0.15;
  const omega0 = 4.5;
  const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
  const duration = 6000;
  const start = performance.now();
  let raf = 0;
  let cancelled = false;
  function frame(now) {
    if (cancelled) return;
    const t = (now - start) / 1000;
    const elapsed = now - start;
    const envelope = Math.exp(-zeta * omega0 * t);
    const value = envelope * Math.cos(omegaD * t);
    onTick(value, elapsed / duration, envelope);
    if (elapsed < duration && envelope > 0.01) {
      raf = requestAnimationFrame(frame);
    } else {
      onTick(0, 1, 0);
      onDone && onDone();
    }
  }
  raf = requestAnimationFrame(frame);
  return { cancel() { cancelled = true; cancelAnimationFrame(raf); } };
}

/* ==========================================================================
   Focal Plane — stripped to a small amber pulse on dwell.
   No more fullscreen blur, no more focal-radius mask. The cursor itself is
   the only thing that reacts, so "idea" stays visible without eating content.
   ========================================================================== */
const FocalPlane = (() => {
  const cursorEl = Cursor.el;
  let pulseT = null;

  function lock(/* x, y */) {
    if (prefersReducedMotion) return;
    if (pulseT) clearTimeout(pulseT);
    cursorEl.classList.add('is-flash');
    /* Keep passive hover/focus effects silent. */
    pulseT = setTimeout(() => cursorEl.classList.remove('is-flash'), 220);
  }
  function unlock() {
    if (pulseT) { clearTimeout(pulseT); pulseT = null; }
    cursorEl.classList.remove('is-flash');
  }
  function onMotion() { unlock(); }
  return { lock, unlock, onMotion };
})();

/* Flow module removed — content stays crisp. Provide a no-op shim just in
   case anything still references it (defensive programming). */
const Flow = { get value() { return 0; } };

/* ==========================================================================
   Capture — now a no-op shim. The camera-frames counter / badges are gone,
   but FocalPlane + Archive still call maybeCaptureAtPoint / markFrame, so
   keep the API stable.
   ========================================================================== */
const Capture = {
  markFrame() {},
  maybeCaptureAtPoint() {},
};

/* ==========================================================================
   Gate — first-visit entry. A calm dark card with the tagline; click or key
   to enter. On subsequent visits the gate is skipped entirely via
   localStorage.cz_visited.
   ========================================================================== */
(function Gate() {
  const gate = document.querySelector('[data-role="gate"]');
  if (!gate) return;

  const VISIT_KEY = 'cz_visited_v2';
  const alreadyVisited = (() => {
    try { return !!localStorage.getItem(VISIT_KEY); } catch (_) { return false; }
  })();

  if (alreadyVisited || prefersReducedMotion) {
    gate.remove();
    return;
  }

  body.classList.add('is-gated');
  gate.setAttribute('aria-hidden', 'false');

  let dismissed = false;
  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    /* Gate exits silently; no desynced cue on first click. */
    gate.classList.add('is-leaving');
    body.classList.remove('is-gated');
    try { localStorage.setItem(VISIT_KEY, '1'); } catch (_) {}
    setTimeout(() => gate.remove(), 750);
  }

  /* Any interaction dismisses the gate */
  ['click', 'touchend', 'keydown'].forEach(ev => {
    window.addEventListener(ev, dismiss, { once: true, capture: true });
  });

  /* Fail-safe: auto-dismiss after 6s so search engine previews still see content */
  setTimeout(dismiss, 6000);
})();

/* ==========================================================================
   Archive — sticky scroll mapping → card index + flip controller
   ========================================================================== */
const Archive = (() => {
  const section   = document.getElementById('archive');
  const stack     = document.querySelector('[data-role="card-stack"]');
  const cards     = Array.from(stack.querySelectorAll('.card'));
  const prevBtn   = section.querySelector('[data-role="prev"]');
  const nextBtn   = section.querySelector('[data-role="next"]');
  const plateNum  = document.querySelector('[data-role="plate-current"]');
  let current = 0;
  let inArchive = false;

  function setActive(idx) {
    idx = clamp(idx, 0, cards.length - 1);
    if (idx === current) return;
    cards.forEach((card, i) => {
      card.classList.remove('is-active', 'is-prev', 'is-flipped');
      if (i === idx) card.classList.add('is-active');
      else if (i < idx) card.classList.add('is-prev');
    });
    current = idx;
    if (plateNum) plateNum.textContent = String(idx + 1).padStart(2, '0');
    /* Scroll progress changes cards often — keep this silent. */
    /* On the first time any card shows for >1.5s, mark archive captured */
    scheduleArchiveCapture();
    /* Lazy-load iframe on cards when reached */
    lazyLoadFrame(cards[idx]);
  }

  let archiveDwellT = null;
  function scheduleArchiveCapture() {
    if (archiveDwellT) clearTimeout(archiveDwellT);
    archiveDwellT = setTimeout(() => {
      Capture.markFrame('archive');
    }, 1600);
  }

  function lazyLoadFrame(card) {
    /* A card can now hold multiple iframes (split-view), so load them all */
    card.querySelectorAll('iframe[data-src]').forEach((frame) => {
      if (!frame.src) frame.src = frame.dataset.src;
    });
  }

  function flipActive() {
    const active = cards[current];
    if (!active) return;
    active.classList.toggle('is-flipped');
    if (!Audio.muted) {
      const onFlipMotionDone = (e) => {
        if (e.propertyName !== 'transform') return;
        Audio.shutter();
      };
      active.addEventListener('transitionend', onFlipMotionDone, { once: true });
    }
    /* Mark archive captured on first flip */
    Capture.markFrame('archive');
  }

  /* Click on card to flip */
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      /* A dedicated flip-back button always flips, even though it's a button */
      if (e.target.closest('[data-role="flip-back"]')) {
        flipActive();
        return;
      }
      /* If another anchor/button inside was clicked, let it pass through */
      if (e.target.closest('a, button')) return;
      if (!card.classList.contains('is-active')) {
        const idx = cards.indexOf(card);
        if (!Audio.muted) Audio.softTick();
        setActive(idx);
        return;
      }
      flipActive();
    });
  });

  /* Scroll-sync navigation so that explicit prev/next/arrow/swipe
     does not fight the scroll-derived state on subsequent scrolls. */
  function navigateTo(idx, source = 'programmatic') {
    idx = clamp(idx, 0, cards.length - 1);
    if (prefersReducedMotion) { setActive(idx); return; }
    if (source !== 'scroll' && !Audio.muted) Audio.softTick();
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const topbarH = window.innerWidth > 880 ? 52 : 0;
    const effVh = vh - topbarH;
    const total = section.offsetHeight - effVh;
    const targetProgress = (idx + 0.4) / cards.length;
    const sectionTopAbs = window.scrollY + rect.top;
    /* Scroll so that "topbarH - rect.top" == targetProgress * total, i.e.
       traveled == targetProgress * total when sticky anchor is topbarH. */
    const targetY = sectionTopAbs + targetProgress * total - topbarH;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }

  /* Prev/next buttons */
  prevBtn.addEventListener('click', () => navigateTo(current - 1, 'button'));
  nextBtn.addEventListener('click', () => navigateTo(current + 1, 'button'));

  /* Keyboard */
  window.addEventListener('keydown', (e) => {
    if (Stage.current !== 'archive') return;
    if (e.key === 'ArrowRight' || e.key === 'Right') { e.preventDefault(); navigateTo(current + 1, 'keyboard'); }
    else if (e.key === 'ArrowLeft' || e.key === 'Left') { e.preventDefault(); navigateTo(current - 1, 'keyboard'); }
    else if (e.key.toLowerCase() === 'f' || (e.code === 'Space' && Stage.current === 'archive')) {
      e.preventDefault();
      flipActive();
    }
  });

  /* Touch swipe */
  let touchStartX = 0;
  let touchStartY = 0;
  stack.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  stack.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
      navigateTo(current + (dx < 0 ? 1 : -1), 'swipe');
    } else if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      /* Treat as tap on active card */
      if (e.target.closest('a, button')) return;
      flipActive();
    }
  });

  /* Scroll position → card index. Accounts for the fixed topbar on desktop
     so the sticky viewport starts just under it. */
  function updateFromScroll() {
    if (prefersReducedMotion) return;
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const topbarH = window.innerWidth > 880 ? 52 : 0;
    const effVh = vh - topbarH;
    const total = rect.height - effVh;
    const traveled = clamp(topbarH - rect.top, 0, total);
    const progress = total > 0 ? traveled / total : 0;
    const idx = clamp(Math.floor(progress * cards.length + 0.15), 0, cards.length - 1);

    /* Stage enter/exit based on whether the sticky viewport is pinned. */
    const enter = rect.top <= topbarH + 1 && rect.bottom >= effVh;
    if (enter && !inArchive) {
      inArchive = true;
      Stage.set('archive');
    } else if (!enter && inArchive) {
      inArchive = false;
      Stage.set('paper');
    }

    if (enter) setActive(idx);
  }
  window.addEventListener('scroll', updateFromScroll, { passive: true });
  window.addEventListener('resize', updateFromScroll);
  /* Initial position check */
  setTimeout(updateFromScroll, 50);

  return { setActive, flipActive, navigateTo };
})();

/* Nod plate — hotspots swap the in-phone caption (static mockup, not the app binary). */
(function NodHotspots() {
  const card = document.querySelector('[data-plate="4"]');
  if (!card) return;
  const el = card.querySelector('[data-role="nod-callout"]');
  if (!el) return;
  const copy = {
    feast: 'Grand Feast · sharing-table path: one pooled pass over the menu so the group stops burning attention on “what should we get?”.',
    agent: 'Agent Chat · manager–worker loop: Eye OCRs, Brain proposes ranked picks, Gatekeeper vetoes allergy clashes — you steer the conversation, not the pixels.',
    solo: 'Solo tasting · fast knapsack-style shortlist for one diner under your caps; Gatekeeper still runs so shortcuts do not compromise safety.'
  };
  card.querySelectorAll('.nod-hotspot[data-nod]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const k = btn.dataset.nod;
      if (copy[k]) el.textContent = copy[k];
    });
  });
})();

/* Nod demo panel — fully interactive, in-card prototype flow. */
(function NodDemoPanel() {
  const card = document.querySelector('[data-plate="4"]');
  if (!card) return;
  const out = card.querySelector('[data-role="nod-demo-out"]');
  if (!out) return;
  const copy = {
    feast: '<strong>Grand Feast</strong> → Table mode: merges constraints across guests and returns 3 dishes with overlap-safe substitutions.',
    agent: '<strong>Agent Chat</strong> → Conversational loop: Eye OCR extracts menu structure, Brain ranks candidates, Gatekeeper blocks allergen collisions in real time.',
    solo: '<strong>Solo Tasting</strong> → Fast shortlist: budget + preference caps + allergy guardrail produce one “safe best” pick and two backups.'
  };
  const buttons = Array.from(card.querySelectorAll('.nod-demo-btn[data-nod-demo]'));
  buttons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = btn.dataset.nodDemo;
      buttons.forEach((b) => b.classList.toggle('is-active', b === btn));
      if (copy[key]) out.innerHTML = copy[key];
      if (!Audio.muted) Audio.softTick();
    });
  });
})();

/* Interest cards — same flip behavior style as work cards. */
(function InterestFlips() {
  const cards = Array.from(document.querySelectorAll('[data-role="interest-card"]'));
  if (!cards.length) return;

  function flip(card) {
    card.classList.toggle('is-flipped');
    if (!Audio.muted) {
      const onFlipMotionDone = (e) => {
        if (e.propertyName !== 'transform') return;
        Audio.shutter();
      };
      card.querySelector('.interest-flip-inner')?.addEventListener('transitionend', onFlipMotionDone, { once: true });
    }
  }

  cards.forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-role="interest-flip-back"]')) {
        flip(card);
        return;
      }
      if (e.target.closest('a, button')) return;
      flip(card);
    });
  });
})();

/* ==========================================================================
   Thread-map jumps — clicking a solution link on the manifesto should take
   the reader straight to that plate in the archive, keeping the logic tight.
   ========================================================================== */
document.querySelectorAll('a[data-jump]').forEach(a => {
  a.addEventListener('click', (e) => {
    const n = parseInt(a.dataset.jump, 10);
    if (Number.isFinite(n)) {
      e.preventDefault();
      Archive.navigateTo(n - 1);
    }
  });
});

/* ==========================================================================
   Sidebar scroll-spy — highlights the current section in the left TOC so the
   reader always knows where they are inside the document.
   ========================================================================== */
(function ScrollSpy() {
  const tocLinks = Array.from(document.querySelectorAll('[data-role="toc"] a'));
  if (!tocLinks.length) return;

  const map = new Map();
  tocLinks.forEach(a => {
    const id = a.dataset.toc;
    const target = id && document.getElementById(id);
    if (target) map.set(target, a);
  });
  if (!map.size) return;

  const targets = Array.from(map.keys());
  function setActive(el) {
    tocLinks.forEach(a => a.classList.remove('is-active'));
    const link = map.get(el);
    if (link) link.classList.add('is-active');
  }

  function update() {
    /* Pick the section whose top is closest to (but above) a horizon near the
       top of the viewport. Archive is tall so its top sticks for many
       viewports — explicitly detect that. */
    const horizon = window.innerHeight * 0.35;
    let chosen = targets[0];
    for (const t of targets) {
      const rect = t.getBoundingClientRect();
      if (rect.top <= horizon) chosen = t;
    }
    setActive(chosen);
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* ==========================================================================
   Beforeunload / blur — gentle page fadeout
   ========================================================================== */
window.addEventListener('beforeunload', () => {
  document.body.style.transition = 'filter 0.2s ease, opacity 0.2s ease';
  document.body.style.filter = 'blur(14px)';
  document.body.style.opacity = '0.3';
});

/* ==========================================================================
   Unlock audio context on first interaction (Safari/iOS autoplay policy)
   ========================================================================== */
/* Audio context now initializes lazily when user enables sound. */