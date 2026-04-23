export function initNodHotspots() {
  const card = document.querySelector('[data-plate="4"]');
  if (!card) return { status: 'skipped', reason: 'missing nod card' };
  const el = card.querySelector('[data-role="nod-callout"]');
  if (!el) return { status: 'skipped', reason: 'missing nod callout' };
  const copy = {
    feast: 'Grand Feast · sharing-table path: one pooled pass over the menu so the group stops burning attention on “what should we get?”.',
    agent: 'Agent Chat · manager–worker loop: Eye OCRs, Brain proposes ranked picks, Gatekeeper vetoes allergy clashes — you steer the conversation, not the pixels.',
    solo: 'Solo tasting · fast knapsack-style shortlist for one diner under your caps; Gatekeeper still runs so shortcuts do not compromise safety.'
  };
  const handlers = [];
  card.querySelectorAll('.nod-hotspot[data-nod]').forEach((btn) => {
    const onClick = (e) => {
      e.stopPropagation();
      const key = btn.dataset.nod;
      if (copy[key]) el.textContent = copy[key];
    };
    btn.addEventListener('click', onClick);
    handlers.push([btn, onClick]);
  });
  return {
    dispose() {
      handlers.forEach(([btn, onClick]) => btn.removeEventListener('click', onClick));
    },
  };
}

export function initNodDemoPanel(Audio) {
  const card = document.querySelector('[data-plate="4"]');
  if (!card) return { status: 'skipped', reason: 'missing nod card' };
  const out = card.querySelector('[data-role="nod-demo-out"]');
  if (!out) return { status: 'skipped', reason: 'missing nod output' };
  const copy = {
    feast: '<strong>Grand Feast</strong> → Table mode: merges constraints across guests and returns 3 dishes with overlap-safe substitutions.',
    agent: '<strong>Agent Chat</strong> → Conversational loop: Eye OCR extracts menu structure, Brain ranks candidates, Gatekeeper blocks allergen collisions in real time.',
    solo: '<strong>Solo Tasting</strong> → Fast shortlist: budget + preference caps + allergy guardrail produce one “safe best” pick and two backups.'
  };
  const buttons = Array.from(card.querySelectorAll('.nod-demo-btn[data-nod-demo]'));
  const handlers = [];
  buttons.forEach((btn) => {
    const onClick = (e) => {
      e.stopPropagation();
      const key = btn.dataset.nodDemo;
      buttons.forEach((b) => b.classList.toggle('is-active', b === btn));
      if (copy[key]) out.innerHTML = copy[key];
      if (!Audio.muted) Audio.softTick();
    };
    btn.addEventListener('click', onClick);
    handlers.push([btn, onClick]);
  });
  return {
    dispose() {
      handlers.forEach(([btn, onClick]) => btn.removeEventListener('click', onClick));
    },
  };
}
