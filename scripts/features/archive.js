import { SkipInitError } from '../lib/safe.js';

export const Capture = {
  markFrame() {},
  maybeCaptureAtPoint() {},
};

export function initArchive({ Audio, Stage, isReducedMotion, clamp }) {
  const section = document.getElementById('archive');
  const stack = document.querySelector('[data-role="card-stack"]');
  if (!section || !stack) throw new SkipInitError('missing archive section or card stack');

  const cards = Array.from(stack.querySelectorAll('.card'));
  const prevBtn = section.querySelector('[data-role="prev"]');
  const nextBtn = section.querySelector('[data-role="next"]');
  const plateNum = document.querySelector('[data-role="plate-current"]');
  if (!cards.length) throw new SkipInitError('no archive cards found');

  let current = -1;
  let inArchive = false;
  let archiveDwellT = null;

  function lazyLoadFrame(card) {
    card.querySelectorAll('iframe[data-src]').forEach((frame) => {
      if (!frame.src) frame.src = frame.dataset.src;
    });
  }

  function scheduleArchiveCapture() {
    if (archiveDwellT) clearTimeout(archiveDwellT);
    archiveDwellT = setTimeout(() => Capture.markFrame('archive'), 1600);
  }

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
    scheduleArchiveCapture();
    lazyLoadFrame(cards[idx]);
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
    Capture.markFrame('archive');
  }

  cards.forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-role="flip-back"]')) {
        flipActive();
        return;
      }
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
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }

  const onPrev = () => navigateTo(current - 1, 'button');
  const onNext = () => navigateTo(current + 1, 'button');
  prevBtn?.addEventListener('click', onPrev);
  nextBtn?.addEventListener('click', onNext);

  const onKeydown = (e) => {
    if (Stage.current !== 'archive') return;
    if (e.key === 'ArrowRight' || e.key === 'Right') { e.preventDefault(); navigateTo(current + 1, 'keyboard'); }
    else if (e.key === 'ArrowLeft' || e.key === 'Left') { e.preventDefault(); navigateTo(current - 1, 'keyboard'); }
    else if (e.key.toLowerCase() === 'f' || (e.code === 'Space' && Stage.current === 'archive')) {
      e.preventDefault();
      flipActive();
    }
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
    } else if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      if (e.target.closest('a, button')) return;
      flipActive();
    }
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
