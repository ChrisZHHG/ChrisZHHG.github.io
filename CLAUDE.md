# CLAUDE.md — chriszhang.me Action Manifesto

> This is the north-star document for the site. Read it before touching anything.
> **Last updated: June 2026 — North Star deepened with Bi Gan / Kaili Blues reading.**
> When in doubt, this file wins — it reflects the most recent owner decisions.

---

## 0. North Star

> **The train through multiple tunnels.**
> Inspired by 毕赣 (Bi Gan) / 路边野餐 (Kaili Blues):
>
> *火车在暗室穿过长长的隧道——你不知道暗室多久结束。结束的一瞬间，出现一下子的空白，豁然开朗。而前方也有不知名的暗室，突然一下又暗淡无光。你无法预测，你也无法拒绝，无法倒退，只有前进。*
>
> The visitor rides a train through the dark. Each section is its own tunnel exit:
> genuine darkness → a sudden flash of overexposure (空白) → clarity → darkness again.
> They cannot predict when the next light comes. They cannot go back. Only forward.
> **The work is what ignites in each flash. Then the dark returns.**

| Layer | Reading |
|---|---|
| **Rhythm** | Not one tunnel → one destination. Multiple tunnels. Each section is a separate emergence. |
| **The flash (空白)** | Every reveal has an overexposure beat before settling — the brief blinding moment of stepping into light. |
| **Darkness** | The space between sections is real darkness, not a gentle dim. The contrast makes each flash matter. |
| **Irreversibility** | Scroll is the only axis. No backtracking. The train does not reverse. |
| **Camera** | The lens barrel: light travels through darkness and forms an image at the focal plane. The image is brief, then the shutter closes. |

> **Previous framing** (still valid as a sub-reading): "the light at the end of the tunnel" — one journey, one destination. The Bi Gan reading deepens this: the journey has *multiple* lights, each earned in darkness, none predictable.

---

## 1. Design Laws (non-negotiable)

1. **Darkness is real, not cosmetic.** Off-center sections must feel genuinely dark — not dimmed to 55%, but to 15–20%. The contrast between dark and lit is what gives each reveal its weight.
2. **Every section reveal has a flash.** When a section enters the focal plane, it passes through a brief overexposure before settling to clarity. No section simply "fades in." The 空白 beat is mandatory.
3. **One focal plane at a time.** Only one section is lit. Neighbors are in the dark. Never a uniform wash.
4. **Depth of field = scroll position.** Focal plane content is sharp + lit; everything else is dark tunnel wall.
5. **Content at the focal plane is always fully readable.** The flash settles to full clarity. No permanent soft or dim for centered content.
6. **Scroll is the only required input.** One continuous path, no backtracking. Cursor effects are quiet rewards, never gates.
7. **One metaphor, literalized completely.** Train → tunnel → flash → clarity → tunnel. Every effect serves this rhythm. Cut anything that competes.
8. **Earned clarity.** The flash lands on meaning (the thesis; each section; each project reveal), never as decoration.
9. **Motion budget:** micro 100–150ms, panels 150–250ms, scene 200–300ms. Flash peak at ~300ms, settle by 600ms. Lenis lerp for scroll spine. `prefers-reduced-motion` disables flash/inertia; ships a static readable page.

---

## 2. The Spine — scene by scene

One vertical journey. State is a pure function of scroll position.
Each section is a separate tunnel exit — its own moment of emergence.

| # | Section (`id`) | Tunnel role | Target light state | Status |
|---|---|---|---|---|
| **00** | Gate (`.gate`) | Entering the train | Near-black. Thesis text develops from a distant pinpoint → flash → full. "Scroll to enter." | ✅ Built |
| **01** | `#intro` (hero) | First tunnel — the person | Dark on approach. Flash on arrival. Headline at closest depth plane (translateZ 28px). | ✅ Built (flash pending) |
| **02** | `#thread` (manifesto) | Second tunnel — the why | Kinetic serif words reveal sequentially. Thread-map links friction → project. | ✅ Built (flash pending) |
| **03** | `#archive` (the work) | **The long tunnel — the what.** | DOM cinema carousel. Each card DEVELOPS (dark → overexposure flash → sharp). This IS the model for all other sections. | ✅ Built |
| **04** | `#interests` `#background` `#developing` `#writing` | Quieter tunnels — the who | Currently: rack-focus dims to 55%, sharpens when centered. **Target: deepen darkness to 15–20%, add per-section flash on entry.** | ⚠️ Partially built |
| **05** | `#contact` / coda | **Stepping off the train** | Amber arrival glow. End in warmth. | ✅ Built |

---

## 3. Color & Light

- **Base / periphery:** `--paper: #14100d` — very dark warm brown. Tunnel walls near-black.
- **Accent:** amber (`--amber: #e8b84f`, `--accent: #d5a44a`) is the ONLY warm highlight — the light source, not a fill color.
- **Flash color:** overexposure peak is warm white / blown-out amber (`brightness(1.15–1.25)`) before settling to `filter: none`.
- **Focal light:** `--focal-y` drifts 46%→54% across the full scroll — the light is always slightly ahead, like a light at the end of each new tunnel.
- **Do NOT** color-ramp the page background. All progression lives in focal lighting and the flash, not the content background.

---

## 4. What has been built (current state)

### Foundation
- **Lenis smooth scroll** (`scripts/lib/lenis.mjs`) — lerp 0.13, wheelMultiplier 1.1. Disabled on coarse-pointer and reduced-motion.
- **Palette deepen** — darker periphery, leather bellows, amber-only accent.
- **Gate tunnel mouth** — `developReveal` keyframe; light orb grows from a pinpoint via `tunnelLightIn`, pulses with `tunnelGlowPulse`.
- **Windows scrollbar fix** — `--scrollbar-w` compensates centering on Windows.

### Hero (`#intro`)
- **Spatial depth** — `perspective: 1800px`. Headline translateZ(28px), bio -12px, tags -22px.

### Manifesto (`#thread`)
- **Kinetic reveal** (`scripts/features/manifesto.js`) — IntersectionObserver staggers `.is-revealed` 130ms apart. Large serif words (clamp 56px–108px).
- **Thread-map sync** — `.is-lit` on matching `<li>` while archive is active; `has-lit` dims others to 0.4.

### Archive (`#archive`) — DOM Cinema Carousel
- **DEVELOP mechanic** — `@keyframes developReveal`: brightness(0.18)/blur(3px) → brightness(1.18) overexposure → `filter: none`. **This is the canonical flash pattern.**
- **Coverflow** — `--o` (signed offset), `--ao` (absolute). Latent cards: brightness(0.32), saturate(0.4), blur(2.5px × ao).
- **Scroll-driven** — `updateFromScroll()` maps progress to active card index.
- **Fallback** — coarse-pointer / reduced-motion / ≤880px → static vertical stack.

### Rack-focus engine (`scripts/features/sections.js`)
- **Quiet sections** — `--focus` (0→1) drives: `opacity: calc(0.55 + 0.45 * var(--focus))`, `brightness: calc(0.7 + 0.3 * var(--focus))`, `translateY: calc((1 - var(--focus)) * 14px)`. No CSS transition (Lenis lerp smooths).
- **Coda arrival** — `--focus` 0→1 as `#contact` enters from below. Amber radial glow floods from bottom.
- **Directional focal light** — `--focal-y` on `:root`, 46%→54% across full scroll, drives bellows amber rim ring.

### Text surgery (confirmed June 2026)
- Hero bio ≤12 words. Tags: 2 only. All card `.card-desc` deleted. Both `.manifesto-body` paragraphs deleted. Both `.writing-item-sub` deleted. `#advising` deleted.
- Section order: `#intro → #thread → #archive → #interests → #background → #developing → #writing → #contact`

---

## 5. What is dead (do not rebuild)

- **WebGL / Three.js** — Cannot host interactive content. DOM carousel replaced it. Files removed.
- **Flip cards** — No hidden back. Each project is one face. Never rebuild.
- **`#advising` section** — Diluted identity. Gone.
- **`focus.mp4`** — Dead asset. Gone.

---

## 6. Next build priorities — deepening the Bi Gan rhythm

The rack-focus engine exists but is too gentle. It dims to 55% (still readable, never truly dark). The Bi Gan reading requires genuine darkness and a per-section flash. This is the remaining core work.

### Priority 1 — Deepen the darkness
`act-quiet` baseline: 0.55 → **0.15**. Focus window: 55% vh → **30% vh** (sharper, more binary).
```css
.act-quiet {
  opacity: calc(0.15 + 0.85 * var(--focus));
  filter: brightness(calc(0.3 + 0.7 * var(--focus)));
  transform: translateY(calc((1 - var(--focus)) * 20px));
}
```
The visitor must feel genuinely in the dark between sections. 55% is not dark enough.

### Priority 2 — Per-section flash on entry
When `--focus` crosses ~0.85 (section arriving at focal plane), trigger `sectionReveal` animation:
```css
@keyframes sectionReveal {
  0%   { filter: brightness(0.15); }
  55%  { filter: brightness(1.15); }
  100% { filter: none; }
}
```
JS: track when `--focus` crosses 0.85 for the first time → add `.is-revealed` class → play keyframe. One-shot per scroll-into-view.
Remove the class when section leaves the focal plane so the flash replays on next entry.

### Priority 3 — Hero and manifesto flash
`#intro` and `#thread` are always visible (near top, no approach from darkness). Add a one-time flash on first-load via `.gate` dismiss — when the gate lifts, the hero section should receive a brief `sectionReveal` flash, establishing the pattern from the very first section.

---

## 7. Guardrails / Acceptance

P0 (blockers):
- [ ] Every paragraph is fully sharp and readable at the focal plane (no permanent dim).
- [ ] Darkness baseline never makes text unreadable — it hides sections, not destroys them.
- [ ] The whole site is completable with scroll only.
- [ ] ~60fps. `prefers-reduced-motion` ships a static, fully readable page with no flash/inertia.
- [ ] One coherent warm palette. Accent = amber only.
- [ ] Mobile / coarse pointer: fallback path, blur off, no custom-cursor dependency.
- [ ] `#advising` never re-appears. WebGL never re-appears.

---

## 8. Non-Goals

- No WebGL (permanent).
- No flip cards (permanent).
- No required mouse operation to progress.
- No competing metaphor (no light-meter, timecode, fps HUD, particle system).
- No background color-ramp that sacrifices text contrast.
- No `#advising` section.
- Do not write "8 yrs Big 4" — Chris is Deloitte → Vanke → KPMG, MS grad 2026.
