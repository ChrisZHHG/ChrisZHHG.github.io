export function initInterestFlips(Audio) {
  const cards = Array.from(document.querySelectorAll('[data-role="interest-card"]'));
  if (!cards.length) return { status: 'skipped', reason: 'missing interest cards' };

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

  const handlers = [];
  cards.forEach((card) => {
    const onClick = (e) => {
      if (e.target.closest('[data-role="interest-flip-back"]')) {
        flip(card);
        return;
      }
      if (e.target.closest('a, button')) return;
      flip(card);
    };
    card.addEventListener('click', onClick);
    handlers.push([card, onClick]);
  });
  return {
    dispose() {
      handlers.forEach(([card, onClick]) => card.removeEventListener('click', onClick));
    },
  };
}
