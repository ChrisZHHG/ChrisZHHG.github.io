export function initSections({ isReducedMotion }) {
  const sections = Array.from(document.querySelectorAll('.act-quiet'));
  if (!sections.length) return { dispose() {} };

  // Reduced-motion: skip animation, sections stay fully visible
  if (isReducedMotion()) {
    sections.forEach((s) => s.style.setProperty('--focus', '1'));
    return { dispose() {} };
  }

  function update() {
    const vh = window.innerHeight;
    const center = vh / 2;
    sections.forEach((s) => {
      const rect = s.getBoundingClientRect();
      // Focus peaks when the section's vertical midpoint aligns with the viewport center.
      // Fade window = 55% of viewport height on each side.
      const sectionMid = rect.top + rect.height / 2;
      const distance = Math.abs(sectionMid - center);
      const focus = Math.max(0, 1 - distance / (vh * 0.55));
      s.style.setProperty('--focus', focus.toFixed(3));
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();

  return {
    dispose() {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    },
  };
}
