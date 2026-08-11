/**
 * initFilmReel — the mobile 35mm reel's "develop" beat.
 *
 * On the touch reel each screen is a film cell. As a cell seats in the gate
 * (crosses ~55% of the viewport) it flashes once — dark → overexposed → settled
 * (the 空白 beat), the same develop language as the desktop archive. Pure
 * scroll drives it; nothing to tap.
 *
 * Scoped to the archive cards + hero + coda. The quiet sections already run
 * their own per-entry flash (features/sections.js), so they're left out to
 * avoid stacking two animations on one element.
 *
 * No-ops on desktop and under reduced-motion.
 */
/**
 * initReelProgress — writes --reel-progress (0 at the top → 1 at the end) to
 * :root on scroll. The dawn layer (styles) uses it to warm/brighten the scene
 * as you descend: the dark tunnel gives way to light, culminating at the coda.
 * The Bi Gan "light at the end" arc, made continuous. Runs on every viewport.
 */
export function initReelProgress() {
  const root = document.documentElement;
  let ticking = false;
  const update = () => {
    ticking = false;
    const max = (document.body.scrollHeight - window.innerHeight) || 1;
    const p = Math.min(1, Math.max(0, window.scrollY / max));
    root.style.setProperty('--reel-progress', p.toFixed(3));
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
  return {
    dispose() {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    },
  };
}

export function initFilmReel({ isCoarsePointer, isReducedMotion } = {}) {
  const isMobileReel = isCoarsePointer || window.matchMedia('(max-width: 880px)').matches;
  if (!isMobileReel) return { status: 'skipped', reason: 'not the mobile reel' };
  if (isReducedMotion && isReducedMotion()) return { status: 'skipped', reason: 'reduced motion' };
  if (!('IntersectionObserver' in window)) return { status: 'skipped', reason: 'no IntersectionObserver' };

  const frames = Array.from(document.querySelectorAll('.act-hero, #archive .card, .act-coda'));
  if (!frames.length) return { dispose() {} };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.55) return;
        const el = entry.target;
        if (el.classList.contains('film-seat')) return;
        el.classList.add('film-seat');
        el.addEventListener('animationend', () => el.classList.remove('film-seat'), { once: true });
      });
    },
    { threshold: [0, 0.55, 1] },
  );

  frames.forEach((f) => io.observe(f));
  return { dispose() { io.disconnect(); } };
}
