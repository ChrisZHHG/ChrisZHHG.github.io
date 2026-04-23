export function initNodHotspots() {
  const card = document.querySelector('[data-plate="4"]');
  if (!card) return;
  const el = card.querySelector('[data-role="nod-callout"]');
  if (!el) return;
  const copy = {
    feast: 'Grand Feast · sharing-table path: one pooled pass over the menu so the group stops burning attention on “what should we get?”.',
    agent: 'Agent Chat · manager–worker loop: Eye OCRs, Brain proposes ranked picks, Gatekeeper vetoes allergy clashes — you steer the conversation, not the pixels.',
    solo: 'Solo tasting · fast knapsack-style shortlist for one diner under your caps; Gatekeeper still runs so shortcuts do not compromise safety.'
  };
  card.querySelectorAll('.nod-hotspot[data-nod]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = btn.dataset.nod;
      if (copy[key]) el.textContent = copy[key];
    });
  });
}

export function initNodDemoPanel(Audio) {
  const card = document.querySelector('[data-plate="4"]');
  if (!card) return;
  const out = card.querySelector('[data-role="nod-demo-out"]');
  if (!out) return;
  const copy = {
    feast: '<strong>Grand Feast</strong> → Table mode: merges constraints across guests and returns 3 dishes with overlap-safe substitutions.',
    agent: '<strong>Agent Chat</strong> → Conversational loop: Eye OCR extracts menu structure, Brain ranks candidates, Gatekeeper blocks allergen collisions in real time.',
    solo: '<strong>Solo Tasting</strong> → Fast shortlist: budget + preference caps + allergy guardrail produce one “safe best” pick and two backups.'
  };
  const buttons = Array.from(card.querySelectorAll('.nod-demo-btn[data-nod-demo]'));
  buttons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = btn.dataset.nodDemo;
      buttons.forEach((b) => b.classList.toggle('is-active', b === btn));
      if (copy[key]) out.innerHTML = copy[key];
      if (!Audio.muted) Audio.softTick();
    });
  });
}
