export function initSections({ isReducedMotion }) {
  const quietSections = Array.from(document.querySelectorAll('.act-quiet'));
  const codaSections  = Array.from(document.querySelectorAll('.act-coda'));
  if (!quietSections.length && !codaSections.length) return { dispose() {} };

  if (isReducedMotion()) {
    [...quietSections, ...codaSections].forEach((s) => s.style.setProperty('--focus', '1'));
    return { dispose() {} };
  }

  // Track which sections have already fired their flash this pass.
  // When a section exits the focal plane it's removed from the set,
  // so the flash replays on the next approach — like re-entering a tunnel.
  const entered = new Set();

  function triggerFlash(s) {
    // Remove first to restart the animation if somehow already playing.
    s.classList.remove('is-entering');
    void s.offsetWidth; // force reflow
    s.classList.add('is-entering');
    // The flash is transient (no `forwards`): drop the class when it ends so the
    // section settles back to its continuous --focus brightness (darkness returns).
    s.addEventListener('animationend', () => s.classList.remove('is-entering'), { once: true });
  }

  function update() {
    const vh = window.innerHeight;
    const center = vh / 2;

    quietSections.forEach((s) => {
      const rect = s.getBoundingClientRect();
      const sectionMid = rect.top + rect.height / 2;
      const distance = Math.abs(sectionMid - center);

      // Narrow window (30% vh): the transition dark→lit is sharp and binary,
      // not a long gentle ramp — this is what gives the train-tunnel rhythm.
      const focus = Math.max(0, 1 - distance / (vh * 0.30));
      s.style.setProperty('--focus', focus.toFixed(3));

      // Flash fires once the section enters the focal band (within 40% vh of
      // center). A generous, momentum-proof trigger — a fast Lenis fling still
      // crosses the band, so no section is ever skipped (the old focus>=0.85
      // window was only ~40px tall and easy to fly past).
      const inBand = distance < vh * 0.40;
      if (inBand && !entered.has(s)) {
        entered.add(s);
        triggerFlash(s);
      }

      // Re-arm once the section leaves the band, so the flash replays on the
      // next approach — like re-entering a tunnel.
      if (!inBand && entered.has(s)) {
        entered.delete(s);
      }
    });

    // Coda: warm amber arrival as #contact enters from below.
    codaSections.forEach((s) => {
      const rect = s.getBoundingClientRect();
      const arrival = Math.max(0, Math.min(1, (vh - rect.top) / (vh * 0.7)));
      s.style.setProperty('--focus', arrival.toFixed(3));
    });

    // Directional focal light: amber rim ring drifts 46%→54% across full scroll.
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
    const scrollProgress = Math.min(1, window.scrollY / maxScroll);
    const focalY = 46 + scrollProgress * 8;
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
