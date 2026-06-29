import { SkipInitError } from '../lib/safe.js';

export const Capture = {
  markFrame() {},
  maybeCaptureAtPoint() {},
};

export function initArchive({ Audio, Stage, isReducedMotion, isCoarsePointer, clamp, scrollTo }) {
  // Route programmatic scrolls through the Lenis spine when provided, so the
  // smooth-scroll engine stays the single source of truth (no native/Lenis fight).
  const scrollToY = typeof scrollTo === 'function'
    ? (top) => scrollTo(top)
    : (top) => window.scrollTo({ top, behavior: 'smooth' });
  const section = document.getElementById('archive');
  const stack = document.querySelector('[data-role="card-stack"]');
  if (!section || !stack) throw new SkipInitError('missing archive section or card stack');

  const cards = Array.from(stack.querySelectorAll('.card'));
  const prevBtn = section.querySelector('[data-role="prev"]');
  const nextBtn = section.querySelector('[data-role="next"]');
  const plateNum = document.querySelector('[data-role="plate-current"]');
  if (!cards.length) throw new SkipInitError('no archive cards found');

  function lazyLoadFrame(card) {
    card.querySelectorAll('iframe[data-src]').forEach((frame) => {
      if (!frame.src) frame.src = frame.dataset.src;
    });
  }

  // ── STATIC PATH: touch / narrow / reduced-motion ───────────────────────────
  // The coverflow is a desktop-pointer mechanic. Running it anywhere else was
  // the root cause of the broken mobile layout: it marks one card `.is-active`
  // (which then escaped the mobile CSS, rendering its full desktop 2-column
  // internals) and hijacks scroll. Here we run NO carousel at all — the CSS
  // lays every card out as a plain vertical document — and only lazy-load each
  // card's demo iframes as it scrolls into view.
  const staticStack =
    isCoarsePointer ||
    isReducedMotion() ||
    window.matchMedia('(max-width: 880px)').matches;
  if (staticStack) {
    let io = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            lazyLoadFrame(entry.target);
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '300px 0px' });
      cards.forEach((card) => io.observe(card));
    } else {
      cards.forEach(lazyLoadFrame);
    }
    return {
      setActive() {},
      flipActive() {},
      // Thread "jump to project" links still work: scroll to that card.
      navigateTo(idx) {
        const card = cards[clamp(idx, 0, cards.length - 1)];
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
      dispose() { if (io) io.disconnect(); },
    };
  }

  // ── CAROUSEL PATH: fine pointer, wide screen, motion allowed ────────────────
  let current = -1;
  let inArchive = false;
  let archiveDwellT = null;

  function scheduleArchiveCapture() {
    if (archiveDwellT) clearTimeout(archiveDwellT);
    archiveDwellT = setTimeout(() => Capture.markFrame('archive'), 1600);
  }

  // Thread-map items sync: one <li> per project, in order.
  const threadItems = Array.from(document.querySelectorAll('.thread-map li'));

  function setActive(idx) {
    idx = clamp(idx, 0, cards.length - 1);
    if (idx === current) return;
    cards.forEach((card, i) => {
      // Remove old state classes
      card.classList.remove('is-active', 'is-prev', 'is-flipped');
      if (i === idx) card.classList.add('is-active');
      else if (i < idx) card.classList.add('is-prev');
      // Set coverflow offset CSS custom props:
      //   --o  = signed offset (negative = left side, positive = right side)
      //   --ao = absolute offset (always >= 0, used for depth/dimming)
      const o = i - idx;
      card.style.setProperty('--o', o);
      card.style.setProperty('--ao', Math.abs(o));
    });
    // Mirror active project onto the thread-map (visible when above #archive)
    threadItems.forEach((li, i) => li.classList.toggle('is-lit', i === idx));
    current = idx;
    if (plateNum) plateNum.textContent = String(idx + 1).padStart(2, '0');
    scheduleArchiveCapture();
    lazyLoadFrame(cards[idx]);
  }

  // flipActive kept as a stub for API compatibility but does nothing
  function flipActive() { /* flip is dead — no-op */ }

  cards.forEach((card) => {
    card.addEventListener('click', (e) => {
      // Ignore clicks on interactive elements inside the focal card
      if (e.target.closest('a, button, input, select, textarea')) return;
      // If not focal, focus it (coverflow navigation)
      if (!card.classList.contains('is-active')) {
        const idx = cards.indexOf(card);
        if (!Audio.muted) Audio.softTick();
        setActive(idx);
        return;
      }
      // Clicking the focal card body does nothing (content is already shown)
    });
  });

  function navigateTo(idx, source = 'programmatic') {
    idx = clamp(idx, 0, cards.length - 1);
    if (isReducedMotion()) { setActive(idx); return; }
    if (source !== 'scroll' && !Audio.muted) Audio.softTick();
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const topbarH = window.innerWidth > 880 ? 52 : 0;
    const effVh = vh - topbarH;
    const total = section.offsetHeight - effVh;
    const targetProgress = (idx + 0.4) / cards.length;
    const sectionTopAbs = window.scrollY + rect.top;
    const targetY = sectionTopAbs + targetProgress * total - topbarH;
    scrollToY(targetY);
  }

  const onPrev = () => navigateTo(current - 1, 'button');
  const onNext = () => navigateTo(current + 1, 'button');
  prevBtn?.addEventListener('click', onPrev);
  nextBtn?.addEventListener('click', onNext);

  const onKeydown = (e) => {
    if (Stage.current !== 'archive') return;
    if (e.key === 'ArrowRight' || e.key === 'Right') { e.preventDefault(); navigateTo(current + 1, 'keyboard'); }
    else if (e.key === 'ArrowLeft' || e.key === 'Left') { e.preventDefault(); navigateTo(current - 1, 'keyboard'); }
    // F key and Space: flip is dead — no longer bound
  };
  window.addEventListener('keydown', onKeydown);

  let touchStartX = 0;
  let touchStartY = 0;
  const onTouchStart = (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  };
  stack.addEventListener('touchstart', onTouchStart, { passive: true });

  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
      navigateTo(current + (dx < 0 ? 1 : -1), 'swipe');
    }
    // Tap on focal card: flip is dead — do nothing (content already visible)
  };
  stack.addEventListener('touchend', onTouchEnd);

  function updateFromScroll() {
    if (isReducedMotion()) return;
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const topbarH = window.innerWidth > 880 ? 52 : 0;
    const effVh = vh - topbarH;
    const total = rect.height - effVh;
    const traveled = clamp(topbarH - rect.top, 0, total);
    const progress = total > 0 ? traveled / total : 0;
    const idx = clamp(Math.floor(progress * cards.length + 0.15), 0, cards.length - 1);

    const threadMap = document.querySelector('.thread-map');
    const enter = rect.top <= topbarH + 1 && rect.bottom >= effVh;
    if (enter && !inArchive) {
      inArchive = true;
      Stage.set('archive');
      if (threadMap) threadMap.classList.add('has-lit');
    } else if (!enter && inArchive) {
      inArchive = false;
      Stage.set('paper');
      if (threadMap) threadMap.classList.remove('has-lit');
    }

    if (enter) setActive(idx);
  }

  window.addEventListener('scroll', updateFromScroll, { passive: true });
  window.addEventListener('resize', updateFromScroll);
  const initTimer = setTimeout(() => {
    setActive(0);
    updateFromScroll();
  }, 50);

  return {
    setActive,
    flipActive,
    navigateTo,
    dispose() {
      clearTimeout(initTimer);
      if (archiveDwellT) clearTimeout(archiveDwellT);
      prevBtn?.removeEventListener('click', onPrev);
      nextBtn?.removeEventListener('click', onNext);
      window.removeEventListener('keydown', onKeydown);
      window.removeEventListener('scroll', updateFromScroll);
      window.removeEventListener('resize', updateFromScroll);
      stack.removeEventListener('touchstart', onTouchStart);
      stack.removeEventListener('touchend', onTouchEnd);
    },
  };
}
