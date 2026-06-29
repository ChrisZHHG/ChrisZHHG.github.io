# CLAUDE.md — chriszhang.me Action Manifesto

> This is the north-star document for the site. Read it before touching anything.
> **Last updated: June 2026 (reconciled with actual build state).**
> When in doubt, this file wins — it reflects the most recent owner decisions.

---

## 0. North Star (one sentence — never dilute)

> **A tunnel toward the light.**
> The visitor enters in darkness, sees a light far ahead (the thesis = the promised
> direction), travels the dark by scrolling, and the world racks into focus and
> ignites *exactly* at the moments that matter — the justification, and the work.
> **The work is what you see clearly when you reach the light.**

| Layer | The tunnel reading |
|---|---|
| **Camera** | The lens barrel / dark box: light travels down a black tube to the focal plane and forms an image. |
| **Architecture (Tadao Ando)** | The approach sequence — a long dark passage that delivers you to a single slot of light. |
| **The thesis** | Friction = the long darkness you must cross. Attention/clarity = the light. The projects = what you finally see, sharp and lit, at the end. |
| **Perception** | The eye is pulled to the single brightest point. A tunnel is the purest instruction: one light, one direction, forward only. |

English idiom anchor: *"the light at the end of the tunnel."* This is the spine.

---

## 1. Design Laws (non-negotiable)

1. **The eye goes to the brightest point.** Light must be directional and singular — one focal light at a time, never a uniform wash.
2. **Depth of field = scroll position.** Focal plane content is sharp + lit; approaching/leaving content is soft + dim. Content racks into focus as it centers.
3. **Content at rest is always readable.** Blur/dimming applies only during transit. The paragraph you are reading is never permanently soft.
4. **Scroll is the only required input.** One continuous path, no backtracking. Cursor effects are quiet rewards, never gates.
5. **One metaphor, literalized once.** Tunnel → film → develop. Every effect serves darkness → focus → light. Cut anything that competes.
6. **Never darken an already-dark surface.** Add light, warmth, or material to create contrast — do not subtract.
7. **Earned clarity.** The focus-lock lands on meaning (the thesis; each project reveal), never as decoration.
8. **Motion budget:** micro 100–150ms, panels 150–250ms, scene 200–300ms. Ease-out on enter, exit ~20% faster. Lenis lerp for the scroll spine. `prefers-reduced-motion` disables blur/inertia and ships a static, readable page.

---

## 2. The Spine — scene by scene

One vertical journey. State is a pure function of scroll position.

| # | Section (`id`) | Tunnel role | Light state | Status |
|---|---|---|---|---|
| **00** | Gate (`.gate`) | Tunnel entrance | Near-black. Thesis text develops from a distant pinpoint of light — small/blurry → full/sharp. "Scroll to enter." | ✅ Built |
| **01** | `#intro` (hero) | First steps in | Headline is the closest depth plane (translateZ 28px); bio recedes into the tunnel wall (-12px). Amber halo surrounds content. | ✅ Built |
| **02** | `#thread` (manifesto) | **Clarity beat #1** | Time / Attention / Friction / Tools reveal sequentially as large kinetic serif words on scroll. Thread-map links each friction to a project. | ✅ Built |
| **03** | `#archive` (the work) | **The light. The climax.** | DOM cinema carousel. Each card arrives as a dim latent negative and **develops** (dark/blur → overexposed flash → sharp) when it reaches the focal plane. | ✅ Built |
| **04** | `#interests` `#background` `#developing` `#writing` | Quieter, still inside | Calm. Should rack into focus when centered (lit-when-centered). **Not yet built** — currently plain scroll. | ❌ Missing |
| **05** | `#contact` / coda | **Arrival — step out into light** | Bellows/vignette opens outward, frame dissolves into brightness. End on light, not dark. | ❌ Missing |

---

## 3. Color & Light

- **Base / periphery:** `--paper: #14100d` — very dark warm brown. Tube walls fall near-black. Center reading surface is legible.
- **Accent:** amber (`--amber: #e8b84f`, `--accent: #d5a44a`) is the ONLY warm highlight. It is the light — use for focal glow, not surface fills.
- **Focal light:** should be directional and track the focal plane, not a static centered halo. The current amber halo is static — this is a known gap.
- **Do NOT** color-ramp the page background. Dark→light progression lives in the vignette/bellows aperture and focal lighting, not the content background.

---

## 4. What has been built (current state)

### Foundation
- **Lenis smooth scroll** (`scripts/lib/lenis.mjs`) — lerp 0.13, wheelMultiplier 1.1. The single biggest "flow" win. Disabled on coarse-pointer and reduced-motion.
- **Palette deepen** — darker periphery, leather bellows, amber-only accent.
- **Gate tunnel mouth** — `developReveal` keyframe on thesis text; light orb grows from a pinpoint via `tunnelLightIn` then pulses gently with `tunnelGlowPulse`.

### Hero
- **Spatial depth** — `perspective: 1800px` on `.act-hero`. Headline at translateZ(28px), sub-headline 12px, rule 0, bio -12px, tags -22px. Tunnel entrance feeling — closest plane is the thesis, details recede.

### Manifesto (`#thread`)
- **Kinetic reveal** (`scripts/features/manifesto.js`) — IntersectionObserver staggers `.is-revealed` class onto each item (130ms delay between). Large serif words (clamp 56px–108px) appear sequentially.
- **Thread-map** — 5 friction tags each linking to a project via `data-jump`. Thread-map entries sync with the active archive card: `.is-lit` on the matching `<li>`, others dim to 0.4 opacity while in archive.

### Archive (`#archive`) — DOM Cinema Carousel
- **Coverflow** with CSS custom props `--o` (signed offset) and `--ao` (absolute offset). JS (`scripts/features/archive.js`) writes these on every `setActive()` call.
- **DEVELOP mechanic** — `@keyframes developReveal`: focal card animates from brightness(0.18)/blur(3px) → brief brightness(1.18) overexposure → `filter: none`. Latent cards: brightness(0.32), saturate(0.4), blur(2.5px × ao). The develop flash is the signature moment.
- **Film skin** — sprocket-hole perforations (CSS radial-gradient) on every visible card. Focal card shows live interactive demo (iframe/video/phone mockup). Latent cards show compact teaser (name + friction tag centered).
- **Scroll-driven** — `updateFromScroll()` maps scroll progress inside the sticky section to the active card index (0–4). One scroll axis, no JS input required.
- **Fallback** — coarse-pointer / reduced-motion / ≤880px → static vertical stack, no carousel, IntersectionObserver lazy-loads iframes.
- **Windows fix** — JS measures `scrollbarW = window.innerWidth - document.documentElement.clientWidth`, sets `--scrollbar-w`. Archive-viewport uses `padding-right: var(--scrollbar-w, 0px)` to compensate centering.

### Text surgery (confirmed June 2026)
- Hero bio: "Builds tools that remove friction from finance workflows. Former Big 4 auditor." (≤12 words)
- Hero tags: 2 only (removed MS CS tag)
- All 5 card `.card-desc` paragraphs deleted — description lives on the focal card's live back face
- Both `.manifesto-body` paragraphs deleted
- Both `.writing-item-sub` paragraphs deleted
- `#advising` section deleted entirely
- Contact renumbered 06

### Section order (confirmed: WHY before WHAT)
`#intro → #thread → #archive → #interests → #background → #developing → #writing → #contact`

Owner confirmed: "先why后what更合理" — manifesto context must come before the project evidence.

---

## 5. What is dead (do not rebuild)

### WebGL / Three.js — PERMANENTLY DEAD
Built, tested, then removed. Reason: WebGL textures cannot host interactive content. Our projects' value IS the interactivity (live Hugging Face demo, clickable Nod mockup, live CyberTao site, Loom embeds). A WebGL screenshot of a working demo is a downgrade. DOM carousel keeps full substance + interactivity + Lenis smoothness.

Files removed: `scripts/core/film.js`, `scripts/lib/three.module.js`, `styles/modules/film.css`.

### Flip cards — DEAD
No "press F to flip", no hidden back side. A film negative has no back. Each project is one face: the focal card develops into its live content (real demo/video/mockup). Latent cards show only name + friction. Never rebuild flip.

### `#advising` section — DELETED
Diluted the builder/thinker identity. Gone from HTML and TOC. Do not restore.

### `focus.mp4` — DELETED
2MB dead asset, unreferenced. Gone.

---

## 6. What is still missing (next build priorities)

### Priority 1 — Section rack-focus engine (`#04` sections)
`#interests`, `#background`, `#developing`, `#writing` are currently plain scroll — no depth, no focus. They should "rack into focus when centered."

Implementation: IntersectionObserver per section + scroll progress → per-section `--focus` (0 = off-center, 1 = centered). CSS: `opacity: calc(0.55 + 0.45 * var(--focus))`, `brightness: calc(0.7 + 0.3 * var(--focus))`, `translateY: calc((1 - var(--focus)) * 12px)`. No real blur (perf). Cheap and high-impact.

### Priority 2 — Coda peel (`#contact`)
The final beat: "step out into the light." Bellows/vignette mask-radius opens outward, frame dissolves into brightness. End on light, not dark. This is the emotional payoff for completing the journey.

### Priority 3 — Directional focal light
The current amber halo is static and centered. It should track the scroll focal plane — as you scroll, the warm light source shifts downward to "illuminate" whatever section is centered. This is what makes it feel like you're moving toward a light, not standing under a lamp.

### Pending content — X / Twitter links
`index.html` lines ~80 and ~633 still point to `x.com/home` placeholder. Replace with real handle or remove entirely. **Awaiting URL from owner.**

---

## 7. Guardrails / Acceptance

P0 (blockers):
- [ ] First frame is never low-contrast text-on-same-color.
- [ ] Every paragraph is fully sharp and readable at rest (no permanent blur).
- [ ] The whole site is completable with scroll only — no required mouse op.
- [ ] Scroll holds ~60fps; reduced-motion ships a static, fully readable page.
- [ ] One coherent warm palette; no accidental theme flips; accent = emphasis only.
- [ ] Mobile / coarse pointer: scroll-only, blur off, no custom-cursor dependency.
- [ ] `#advising` never re-appears. `focus.mp4` never re-appears. WebGL never re-appears.

---

## 8. Non-Goals

- No WebGL (permanent).
- No flip cards (permanent).
- No required mouse operation to progress.
- No competing second metaphor (no light-meter, timecode, fps HUD).
- No background color-ramp that sacrifices text contrast.
- No `#advising` section.
- Do not write "8 yrs Big 4" — Chris is a Deloitte → Vanke → KPMG career arc, MS grad 2026. See memory file `chris-background-facts.md`.
