# CLAUDE.md — chriszhang.me Action Manifesto

> This is the north-star document for the site. Read it before touching anything.
> **Last updated: August 2026 — added §4 "Mobile — the 35mm reel" (the touch
> path had shipped undocumented) and refreshed §6. Earlier July reconciliation:
> hero carries the thesis, tunnel rhythm rebalanced, embeds click-to-load,
> `#thread` manifesto confirmed removed, "flip cards" clarified. §0–§1 stay
> aspirational; §2/§4/§5 describe what actually ships.**
> When in doubt, trust the CODE over this file, then fix the file.

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
| **00** | Gate (`.gate`) | Entering the train | Near-black. Thesis develops from a distant pinpoint → flash → full. "Scroll to enter." | ✅ Built |
| **01** | `#intro` (hero) | First tunnel — the person | Fills the first screen; carries the thesis as the page `<h1>` (*Time is currency. / Attention is where you spend it.*) so the strongest line persists from the gate. Flashes once on gate dismiss. Depth planes via translateZ. | ✅ Built |
| **02** | `#archive` (the work) | **The long tunnel — the what.** | DOM cinema carousel, ~48% of total scroll. Each card DEVELOPS (dark → overexposure flash → sharp). This IS the model for all other sections. | ✅ Built |
| **03** | `#interests` `#background` `#developing` `#writing` | Quieter tunnels — the who | Genuine darkness (0.15 baseline) + a per-section flash fired on entering the focal band; each is `min-height: 80vh` so exactly one is lit at a time. | ✅ Built |
| **04** | `#contact` / coda | **Stepping off the train** | Amber arrival glow floods from below. End in warmth. | ✅ Built |

> There is **no `#thread` / manifesto section** — it was removed. The actual order
> is `#intro → #archive → #interests → #background → #developing → #writing → #contact`.
> Its code (`manifesto.js`, `.thread-map` / `.manifesto-*` CSS) was deleted in the
> July 2026 cleanup — see §5.

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
- **Carries the thesis** — the page `<h1>` is *Time is currency.* + *Attention is where you spend it.* (the gate's line, now persistent). This is the subject shot.
- **Fills the first screen** — `min-height: calc(100vh - topbar)`, flex-centered, so the archive never bleeds in at scroll 0 (Design Law §3).
- **Spatial depth** — `perspective: 1800px`. `.hero-headline` translateZ(28px), `.hero-headline-2` 12px, bio -12px, tags -22px.
- **First flash** — on gate dismiss the hero gets a one-shot `.is-entering` flash (main.js `onDismiss`), establishing the 空白 beat from section one.

### Manifesto (`#thread`) — REMOVED
- The section and all its code are gone: `manifesto.js` deleted, `initManifesto` / `initThreadJumps` removed, `.thread-map` / `.manifesto-*` CSS stripped (July 2026). Do not rebuild.

### Archive (`#archive`) — DOM Cinema Carousel
- **DEVELOP mechanic** — `@keyframes developReveal`: brightness(0.18)/blur(3px) → brightness(1.18) overexposure → `filter: none`. **This is the canonical flash pattern.**
- **Coverflow** — `--o` (signed offset), `--ao` (absolute). Latent cards: brightness(0.32), saturate(0.4), blur(2.5px × ao).
- **Two-face cards** — each card has a `.card-front` (compact teaser, shown while latent) and `.card-back` (full detail, shown when focal via `.is-active`). This is NOT a 3D flip — the press-F/rotateY flip is dead (§5).
- **Click-to-load embeds** (`scripts/features/embeds.js`) — heavy third-party iframes (HF Space, Loom, CyberTao, YouTube) carry `data-embed-src` and show a dark `.embed-poster` first. Loading on click kills the white cold-start, the wheel scroll-trap, and third-party console noise. Never auto-load these on view.
- **Scroll-driven** — `updateFromScroll()` maps progress to active card index; section height is `*5` viewports (was `*6.2`).
- **Fallback** — coarse-pointer / reduced-motion / ≤880px → static vertical stack.

### Rack-focus engine (`scripts/features/sections.js`)
- **Quiet sections** — `--focus` (0→1, window 30% vh) drives: `opacity: calc(0.15 + 0.85 * var(--focus))`, `brightness: calc(0.3 + 0.7 * var(--focus))`, `translateY: calc((1 - var(--focus)) * 20px)`. Genuine darkness baseline (Design Law §1). No CSS transition (Lenis lerp smooths).
- **Per-section flash** — fires once when a section's midpoint enters the focal band (`distance < 40% vh`) — a generous, momentum-proof trigger. The `sectionReveal` animation is **transient** (no `forwards`) and the class is dropped on `animationend`, so the section settles back to its `--focus` darkness — only the centered section stays lit.
- **Coda arrival** — `--focus` 0→1 as `#contact` enters from below. Amber radial glow floods from bottom.
- **Directional focal light** — `--focal-y` on `:root`, 46%→54% across full scroll, drives bellows amber rim ring.

### Periphery / leather (`styles/modules/bellows.css`)
- Leather is pulled DOWN (`brightness(0.92)`, `opacity 0.7`) so the periphery reads as clean cinematic black, not busy brown noise. The amber rim ring + vignette are the framing, not the leather.

### Text surgery
- Hero bio ≤12 words. Tags: 2 only. All card `.card-desc` deleted. Both `.writing-item-sub` deleted. `#advising` deleted.
- **Actual section order:** `#intro → #archive → #interests → #background → #developing → #writing → #contact` (no `#thread`).

### Mobile — the 35mm reel (`styles/modules/mobile-film.css`, `scripts/features/filmReel.js`)
Touch / ≤880px gets its own literalization of the same metaphor: instead of the
carousel, the page IS a strip of film running past a fixed gate. Perforation
rails live inside `.world` so they travel with the scroll; the gate's corner
ticks are pinned to the viewport. Every section is one frame cell
(`scroll-snap-align: start`, `min-height: 100svh`) and seats with a
`filmSeat` flash — the 空白 beat, per frame. Pure scroll: no taps to progress.
- **One frame = one screen.** Budget against **`100svh` ≈ 660px on a 393×852
  phone** — Safari's URL bar + toolbar eat ~190pt, so the device's screen height
  is the wrong number to design to (that mistake is what put CTAs below the
  fold). Verify in a real 393×660 viewport, not a 393×852 one.
- **One frame, one thing.** The static stack renders BOTH card faces (there is
  no focal state to swap them), so anything a frame says twice gets cut on the
  reel: the back kicker that repeats the 身/心 pillar, the pinned pill that
  repeats an in-flow CTA, a second play poster.
- **Thumbs, not cursors.** Every link gets a 44px-tall hit area, expanded with a
  pseudo-element so nothing shifts visually. Not square — a 44px box around the
  coda's 9px "X" would let its neighbour swallow the tap.
- **No focal dressing in the stack.** `archive.js` doesn't run here, so the
  markup's initial `is-active` (plate 01) must not keep its desktop focal
  styling — archive.css's static-stack block resets it.
- Fallback within the fallback: reduced-motion drops `filmSeat` + smooth scroll.

---

## 5. What is dead (do not rebuild)

- **WebGL / Three.js** — Cannot host interactive content. DOM carousel replaced it. Files removed.
- **The 3D card FLIP** — the press-`F` / `rotateY(180deg)` flip-to-back mechanic is gone (`flipActive` is a no-op stub; `.card-flip-hint` / `.card-back-flip` are `display:none`). Do NOT rebuild the flip. Note: cards still have a `.card-front` teaser + `.card-back` detail — those are swapped by focal state (`.is-active`), which is not a flip. Keep that.
- **`#thread` / manifesto section** — fully removed (July 2026): DOM, `manifesto.js`, `initManifesto` / `initThreadJumps`, and the `.thread-map` / `.manifesto-*` CSS. Do not rebuild.
- **`#advising` section** — Diluted identity. Gone.
- **`focus.mp4`** — Dead asset. Gone.

---

## 6. Build status — Bi Gan rhythm

The core rhythm work is **done** (July 2026):

- ✅ **Genuine darkness** — `.act-quiet` baseline 0.15, 30% vh window (was 0.55 / 55%).
- ✅ **Per-section flash on entry** — `sectionReveal` fires when a section enters the focal band (`distance < 40% vh`); transient (no `forwards`) so darkness returns after. Momentum can't skip it.
- ✅ **Hero flash** — one-shot on gate dismiss, landing on the thesis `<h1>`.
- ✅ **Dwell** — quiet sections + coda are `min-height: 80vh`, so one tunnel exit fills the frame at a time (they used to be thin and get flown past).
- ✅ **Clean black periphery** — leather toned down so contrast reads.

Mobile fit is **done** (August 2026), verified in Chromium mobile emulation at
393/390/412/430px wide: all 12 frames land at exactly one screen, no horizontal
overflow, every link ≥44px tall. See §4 "Mobile — the 35mm reel".

### Remaining / nice-to-have
- ~~"Former Big 4 auditor" wording~~ — done: `#background` now lists the roles
  plainly (Technology Risk — KPMG / Audit & Assurance — Deloitte / Finance
  Controller — Nanjing Vanke), no "Big 4" claim to mis-read.
- **`--iris-t`** — declared in `tunnel.css` for a `scripts/core/iris.js` that
  does not exist and read by nothing. Delete both the var and its doc comment.
- **Clamped copy on the reel** — `.card-split-sub` is clamped to 2 lines, so the
  身 plate's blurb ends mid-sentence ("…turns your…"). Either accept the
  ellipsis as "there's more" or write a ≤60-char first sentence that lands whole
  in two lines at 393px.
- **Very small phones** (375×553, SE 2/3) still run 2-13% over one frame on the
  visual-heavy plates. Nothing clips — the reel snaps by proximity — but it's
  the one width where a frame is not a frame.
- **Real WebKit** — the August fit pass was verified on Chromium mobile
  emulation only; this environment can't run Playwright's WebKit (host libs
  missing). iOS-specific layout bugs (see the flexbug history in the git log)
  can only be caught on real WebKit or a device.

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
- No 3D card flip (permanent) — the press-`F` / `rotateY` flip. (The `.card-front` teaser ↔ `.card-back` detail swap on focal state is fine and current — that is not a flip.)
- No required mouse operation to progress.
- No competing metaphor (no light-meter, timecode, fps HUD, particle system).
- No background color-ramp that sacrifices text contrast.
- No `#advising` section.
- Do not write "8 yrs Big 4" — Chris is Deloitte → Vanke → KPMG, MS grad 2026.
