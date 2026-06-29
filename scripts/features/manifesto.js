/**
 * initManifesto — kinetic reveal for the "Why I build" manifesto items.
 *
 * Each .manifesto-item starts opacity:0 / translateY(28px) in CSS.
 * An IntersectionObserver fires when each item enters the viewport and adds
 * .is-revealed (opacity:1 / translateY:0) with a staggered delay so the four
 * concepts appear sequentially rather than all at once.
 *
 * Reduced-motion: all items are shown immediately without animation.
 */
export function initManifesto({ isReducedMotion }) {
  const items = document.querySelectorAll('.manifesto-item');
  if (!items.length) return { dispose() {} };

  if (isReducedMotion()) {
    items.forEach((item) => item.classList.add('is-revealed'));
    return { dispose() {} };
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const idx = [...items].indexOf(entry.target);
        setTimeout(() => entry.target.classList.add('is-revealed'), idx * 130);
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.18 },
  );

  items.forEach((item) => io.observe(item));

  return {
    dispose() {
      io.disconnect();
    },
  };
}
