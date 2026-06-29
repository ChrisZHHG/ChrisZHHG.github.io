export function initSections({ isReducedMotion }) {
  const quietSections = Array.from(document.querySelectorAll('.act-quiet'));
  const codaSections  = Array.from(document.querySelectorAll('.act-coda'));
  if (!quietSections.length && !codaSections.length) return { dispose() {} };

  // Reduced-motion: skip animation, everything stays fully visible
  if (isReducedMotion()) {
    [...quietSections, ...codaSections].forEach((s) => s.style.setProperty('--focus', '1'));
    return { dispose() {} };
  }

  function update() {
    const vh = window.innerHeight;
    const center = vh / 2;

    // Quiet sections: dim when off the focal plane, brighten when centered.
    // Smoothness comes from Lenis's lerp — no CSS transition needed.
    quietSections.forEach((s) => {
      const rect = s.getBoundingClientRect();
      const sectionMid = rect.top + rect.height / 2;
      const distance = Math.abs(sectionMid - center);
      const focus = Math.max(0, 1 - distance / (vh * 0.55));
      s.style.setProperty('--focus', focus.toFixed(3));
    });

    // Coda (#contact): arrival mechanic — warm light floods in as the section
    // enters from the bottom. focus goes 0→1 as the section top travels from
    // the fold (rect.top = vh) to 30% down from the viewport top (rect.top = vh*0.3).
    codaSections.forEach((s) => {
      const rect = s.getBoundingClientRect();
      const arrival = Math.max(0, Math.min(1, (vh - rect.top) / (vh * 0.7)));
      s.style.setProperty('--focus', arrival.toFixed(3));
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
