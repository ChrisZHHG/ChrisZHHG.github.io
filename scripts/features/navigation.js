export function initThreadJumps(Archive) {
  const links = Array.from(document.querySelectorAll('a[data-jump]'));
  const handlers = [];
  links.forEach((a) => {
    const onClick = (e) => {
      const n = parseInt(a.dataset.jump, 10);
      if (Number.isFinite(n)) {
        e.preventDefault();
        Archive.navigateTo(n - 1);
      }
    };
    a.addEventListener('click', onClick);
    handlers.push([a, onClick]);
  });
  return {
    dispose() {
      handlers.forEach(([a, onClick]) => a.removeEventListener('click', onClick));
    },
  };
}

export function initScrollSpy() {
  const tocLinks = Array.from(document.querySelectorAll('[data-role="toc"] a'));
  if (!tocLinks.length) return { status: 'skipped', reason: 'missing toc links' };

  const map = new Map();
  tocLinks.forEach((a) => {
    const id = a.dataset.toc;
    const target = id && document.getElementById(id);
    if (target) map.set(target, a);
  });
  if (!map.size) return { status: 'skipped', reason: 'missing toc targets' };

  const targets = Array.from(map.keys());

  function setActive(el) {
    tocLinks.forEach((a) => a.classList.remove('is-active'));
    const link = map.get(el);
    if (link) link.classList.add('is-active');
  }

  function update() {
    const horizon = window.innerHeight * 0.35;
    let chosen = targets[0];
    for (const target of targets) {
      const rect = target.getBoundingClientRect();
      if (rect.top <= horizon) chosen = target;
    }
    setActive(chosen);
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

export function initBeforeUnloadFade() {
  const onBeforeUnload = () => {
    document.body.style.transition = 'filter 0.2s ease, opacity 0.2s ease';
    document.body.style.filter = 'blur(14px)';
    document.body.style.opacity = '0.3';
  };
  window.addEventListener('beforeunload', onBeforeUnload);
  return {
    dispose() {
      window.removeEventListener('beforeunload', onBeforeUnload);
    },
  };
}
