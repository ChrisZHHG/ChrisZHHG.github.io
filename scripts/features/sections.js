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

    // Directional focal light: drift the amber bellows rim ring based on
    // overall scroll progress. Range 46%→54%: ring starts slightly above center
    // (light is ahead of you) and settles just below as you exit (you've passed
    // through). Gives the tunnel illusion of moving toward and past a light.
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
    const scrollProgress = Math.min(1, window.scrollY / maxScroll);
    const focalY = 46 + scrollProgress * 8; // 46% at top, 54% at bottom
    document.documentElement.style.setProperty('--focal-y', focalY.toFixed(1) + '%');
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
