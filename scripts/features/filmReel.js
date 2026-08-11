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
