# CLAUDE.md — chriszhang.me Action Manifesto

> This is the north-star document for the site. Read it before touching anything.
> Companions: `portfolio_philosophy_summary.md` (the *why*), `ui_taste_skill.md`
> (motion/type/color taste), `ui_acceptance_checklist.md` (the release gate).
> When this file and the others disagree, **this file wins** — it is the most recent
> synthesis (June 2026).

---

## 0. North Star (one sentence — never dilute)

> **A tunnel toward the light.**
> The visitor enters in darkness, sees a light far ahead (the thesis = the promised
> direction), travels the dark by scrolling, and the world racks into focus and
> ignites *exactly* at the moments that matter — the justification, and the work.
> **The work is what you see clearly when you reach the light.**

This unifies every metaphor we already use:

| Layer | The tunnel reading |
|---|---|
| **Camera** | The lens barrel / dark box: light travels down a black tube to the focal plane and forms an image. |
| **Architecture (Tadao Ando)** | The approach sequence — a long dark passage that delivers you to a single slot of light. |
| **The thesis** | Friction = the long darkness you must cross. Attention/clarity = the light. The projects = what you finally see, sharp and lit, at the end. |
| **Perception** | The eye is pulled to the single brightest point and to change. A tunnel is the purest possible instruction: one light, one direction, forward only. |

English idiom anchor: *"the light at the end of the tunnel."* Use it. It is the spine.

---

## 1. Why the old site read as "ordinary" (the diagnosis we are fixing)

The foundation is good (leather bellows, Instrument Serif, amber, sticky archive).
It did **not** grab attention because:

1. **The first impression was a bug.** The `.gate` used `background: var(--ink)`
   (#ece6d9 cream) with near-white text — invisible white-on-white. First frame =
   near-blank screen. This is the opposite of a hook. **(P0 fix.)**
2. **Light was uniform, not directional.** A centered, symmetric, *unchanging*
   amber halo frames content but never *directs* the eye. Uniform light = no
   instruction = nothing commands attention.
3. **The "flow" was never built.** 35mm's smoothness is **Lenis** (lerped inertia
   scroll). We were on native scroll. The thing the owner loves most was missing.
4. **The signature interaction existed only in the doc.** The documented focus-hunt
   (blur → damped oscillation → shutter snap) degraded in code to "cursor flashes
   amber after 1.8s dwell." The soul mechanic never shipped.
5. **Everything sat in mid-tone.** No real chiaroscuro → the eye never knew where to
   look.

---

## 2. Design Laws (perception-first; these are non-negotiable)

1. **The eye goes to the brightest point.** Light must be *directional and singular*
   — one focal light at a time, never a uniform wash. (Caravaggio / Ando / cinema.)
2. **Depth of field = scroll position.** What sits at the focal plane (viewport
   center) is **sharp + lit**; what is approaching (below) or leaving (above) is
   **soft + dim**. As you scroll, content racks into focus when it centers.
3. **Content at rest is sacred and ALWAYS readable.** Blur/dimming applies only to
   *approaching/leaving* content during transit. The paragraph you are actually
   reading is never permanently soft. (This is the lesson of the failed "color
   tunnel" Attempt A — never kill legibility for atmosphere.)
4. **Scroll is the only required input.** No operation needed to experience the site
   (the 35mm lesson). One continuous path, no backtracking. The cursor-lens and any
   flashlight effect are **quiet, secondary, optional** — rewards for exploration,
   never gates.
5. **Reduce interference — one metaphor, literalized once.** The tunnel/lens is the
   only metaphor. Every effect must serve **darkness → focus → light**. If an effect
   competes with that (or with the content), cut it. Do not stack iris wipes +
   flashbulbs + grain + breathing + HUD all at once.
6. **Never darken an already-dark surface.** To create contrast, *add* light, warmth,
   or material — do not subtract.
7. **Earned clarity.** The focus-lock must land **on meaning** (the thesis
   justification; each project reveal), never as decoration. Clarity is the payoff.
8. **Motion budget** (from `ui_taste_skill.md`): micro 100–150ms, panels 150–250ms,
   scene 200–300ms; ease-out on enter, exit ~20% faster; Lenis lerp for the spine;
   `prefers-reduced-motion` disables blur/inertia and ships a static, readable page.

---

## 3. The Spine — scene by scene (mapped to existing `#sections`)

One vertical journey. Each stage is a function of scroll position.

| # | Section (id) | Tunnel role | Light state |
|---|---|---|---|
| **00** | tunnel mouth *(replaces `.gate`)* | You stand at the entrance. | Near-black. One distant warm light = the thesis line, faintly lit. "scroll to enter." Optional: moving the mouse (flashlight) reveals the surroundings — not required. |
| **01** | `#intro` (hero) | First steps in. | Headline lit at the focal plane; periphery dark (bellows = tube wall). Bio racks into focus as it centers. |
| **02** | `#thread` (manifesto / justification) | **Clarity beat #1.** | Snaps sharp + lit. This is where the *reason* is delivered — Time · Attention · Friction · Tools, and the friction→tool thread. Earned. |
| **03** | `#archive` (the work) | **The light. The climax.** | Brightest, sharpest, fully in focus. Each plate racks focus as it centers. This is the spot-on payoff — the projects are what you see clearly at the end of the tunnel. |
| **04** | `#interests` `#background` `#now` `#writing` | Still inside, quieter. | Calm, lit-when-centered. No new mechanics. |
| **05** | `#contact` / coda | **Arrival — step out into the light.** | The bellows/vignette opens outward (the planned "peel"); the frame dissolves into brightness. End on light, not on dark. |

Backtracking just rewinds the same timeline (state = pure function of scroll). No
route changes, no separate pages — that is what makes it "one path, no return."

---

## 4. Color & Light (Direction chosen: **deepen the warm leather/amber world**)

Keep the warm identity; push **contrast** and make light **directional + reactive**.

- **Base / periphery:** push `--paper` (#14100d) darker toward the edges so the tube
  walls fall to near-black (chiaroscuro). The center reading surface stays at a
  legible warm dark.
- **Accent:** keep amber (`--amber #e8b84f`, `--accent #d5a44a`) as the *only* warm
  highlight. It is the light — use it for the focal glow and the lock flash, not for
  filling surfaces.
- **New token — the distant light:** define the "end-of-tunnel" warm glow that the
  viewer scrolls toward (a directional gradient at the vanishing point, not a
  centered halo).
- **Replace the symmetric halo** with a **directional** light that tracks the focal
  plane (and, on the tunnel mouth only, the cursor).
- **Filmic finish (subtle):** keep grain low (`grain-paper` ~0.05), reserve any
  bloom/glow for the focal light. ACES-style highlight roll-off can be faked with
  `brightness()/contrast()` on the focal layer only.
- **Do NOT** flip the whole page background through a color ramp (Attempt A). The
  tunnel's dark→light progression lives in the **vignette/bellows aperture and the
  focal lighting**, not in the content background.

---

## 5. Tech Plan

- **Smooth scroll: vendor Lenis** (~3KB) into `scripts/lib/` (no build step; this is
  a static GitHub Pages site). Drive the rAF loop; pair scroll-linked effects off it.
  This is the single biggest "flow" win and matches 35mm exactly.
- **Depth-of-field focus engine:** repurpose the existing (now-vestigial)
  `tunnel.css` / `tunnel.js` as the spine module. Use `IntersectionObserver` +
  scroll progress to write a per-section `--focus` (0 = far/soft/dim, 1 =
  centered/sharp/lit). Map cheaply: `opacity`, `brightness()`, small `translateY`.
  **Reserve real `filter: blur()` (2–6px max) for the hero + the two clarity beats**
  only — never blur whole long sections continuously (perf). Manage `will-change`;
  disable entirely under reduced-motion and on coarse pointers.
- **Keep & quiet** the existing cursor viewfinder (the lens) and leather bellows (the
  tube wall). They are background now; the spine is the hero.
- **Coda peel:** implement the documented mask-radius opening on the final stage only.
- **Performance budget:** 60fps scroll on a 2020-era laptop. If blur drops frames,
  fall back to opacity+brightness. Lazy-load all iframes (already done).

---

## 6. Guardrails / Acceptance (extends `ui_acceptance_checklist.md`)

P0 (blockers), in addition to the existing checklist:
- [ ] First frame is **never** low-contrast text-on-same-color (the old gate bug).
- [ ] Every paragraph is fully sharp and readable **at rest** (no permanent blur).
- [ ] The whole site is completable with **scroll only** — no required mouse op.
- [ ] Scroll holds ~60fps; reduced-motion ships a static, fully readable page.
- [ ] One coherent warm palette; no accidental theme flips; accent = emphasis only.
- [ ] Mobile / coarse pointer: scroll-only, blur off, no custom-cursor dependency.

---

## 7. Non-Goals (do not do these)

- ~~No WebGL~~ — **REVERSED June 2026 by owner decision.** WebGL/Three.js is now the
  archive centerpiece (see §9). Kept *scoped*: WebGL for the projects "film" only;
  DOM stays for readable text (hero, manifesto, coda) so SEO/a11y survive.
- No required mouse operation to progress (scroll-only spine still holds).
- No competing second metaphor (no light-meter, timecode, fps HUD). The film IS the
  metaphor now — lean in, don't dilute.
- No background color-ramp that sacrifices text contrast (Attempt A is dead).

---

## 8.5 Flip is dead (June 2026)

The archive flip-card is removed. A film negative has no back — front and back are
the same. Each project is **one face**: a still/screenshot + name + one-line friction
+ **a direct link to the real thing**. No "press F to flip", no hidden back side.
The old "front too empty, nobody knew to flip" problem is solved by putting
everything on the single visible frame.

---

## 8. Build Order (today)

1. **Phase 1 — Foundation + flow + the bug.** Fix the tunnel mouth (kill the
   white-gate). Vendor + wire Lenis. Deepen palette contrast (darker periphery).
   → Site already feels smoother and the first impression stops being broken.
2. **Phase 2 — Depth-of-field focus engine.** Per-section `--focus`; rack-focus on
   centering; the two clarity beats (`#thread`, `#archive`) get the real snap.
3. **Phase 3 — Arrival.** Coda peel at `#contact` — step out into the light.
4. **Phase 4 — Content fixes** (confirmed June 2026):
   - **Hero bio** → reposition from résumé voice to *Builder* voice. Source material
     (merge into site voice, keep the attention/friction thread + MS CS context):
     *"Strategic builder and effective communicator with 8+ years in Big 4 audit,
     finance, and digital transformation. I bring structure to ambiguity, bridging
     technical systems with human needs to build high-impact solutions and foster
     stakeholder trust."*
   - **Smart Airport** = team name; keep it as the project title, add a trimmed
     one-line descriptor (from "A Transformer-Based Deep Reinforcement Learning
     Approach for Efficient Airport Vehicle Charging Dispatching"). Working line:
     *"Smart Airport — a Transformer + deep-RL dispatcher for airport EV charging."*
   - **Delete `focus.mp4`** (2MB, unreferenced dead asset).
   - **X links** (`index.html:80`, `:633`) point to `x.com/home` placeholder →
     replace with the real handle, or remove X. **(Awaiting the URL from owner.)**
   - **Nod**: keep "iOS 26.1" (year-based versioning, intentional). Liquid Glass:
     mention only, do not over-claim.

Ship Phase 1 first and look at it before going further. Evolve, don't rewrite.

---

## 9. The projects archive — DOM Cinema Carousel (June 2026)

> **PIVOT (after building the WebGL film strip):** WebGL is REMOVED from the archive.
> Reason discovered in build: a WebGL frame can show an image or even play a video
> (VideoTexture), but it **cannot host interactive content** — you can't click a
> button inside a WebGL texture. Our projects' *value is their interactivity* (the
> live Hugging Face dispatch demo, the clickable Nod mockup, the live CyberTao site,
> the Loom embeds, "try the app"). 35mm could be pure WebGL because it showcases a
> *static product* (a camera); we showcase *interactive tools*. So the film strip,
> while pretty, threw away the substance — a regression. A static screenshot of a
> working demo is a downgrade ("why photograph a video?"). **The owner is right.**
>
> **New approach = a DOM cinema carousel** of the existing rich cards: the focal
> project enlarges and shows its REAL content (video playing, live demo, intro,
> try-link); the others scale down, dim, recede behind as ambient surround. The
> DEVELOP metaphor lives on, in DOM: side cards are dim *latent negatives*; the focal
> card is *developed* = bright and **alive** (the working demo). Keeps all substance +
> interactivity + Lenis smoothness. The WebGL files (`scripts/core/film.js`,
> `scripts/lib/three.module.js`, `styles/modules/film.css`) were REMOVED after the
> pivot. (`scripts/lib/lenis.mjs` stays — Lenis still powers the smooth scroll.)

The original "depth-of-field rack focus" idea survives as the carousel's
focal-vs-latent treatment.

### The mechanic — DEVELOP (显影): the heart of the whole site
Film imaging = in a darkroom, **light develops a latent negative into a photograph.**
That IS the owner's thesis made literal: his projects turn **negative → photo, dark →
light, blur → clarity, vague → clarity**. So a project frame is NOT a pre-finished
card. It arrives as a **dark, soft, undeveloped negative**, and as it reaches the
focal plane it **develops** — brightens, sharpens, resolves into the real positive
photo (the actual project screenshot), face-on to the camera. Clarity is *developed*
by arriving — earned, not given. This is the signature moment; everything else serves
it.

Scroll = running the film. A 3D camera travels along a long 35mm strip of these
frames (one per project); the focal frame develops, neighbors stay as dim negatives
curving away into bokeh. Entering the film should feel like the camera **diving into
the tunnel light** — the DOM tunnel resolves into the film reel, no visible "stitch"
(the owner's core complaint: the old site felt like 拼接/spliced parts; 35mm feels
like one continuous object).

### Side projects / backlog (do NOT derail the film main thread)
- **Realistic aperture/iris.** The current focus reticle / "focus hole" doesn't read
  as a real camera aperture. Build a true multi-blade diaphragm iris (SVG/CSS or a
  small WebGL element) as a *separate* task. Secondary — never competes with the film.

### Architecture (scoped, honest)
- **WebGL only for the projects film.** Three.js, vendored locally
  (`scripts/lib/three.module.js`, no build step). One `<canvas>` pinned during the
  archive act.
- **DOM stays** for hero / manifesto / background / now / writing / contact — readable
  text, SEO, a11y. The film is the climax, not the whole site (can extend later if the
  owner wants the hero lens in WebGL too).
- **Scroll spine = Lenis** drives the camera position (camera dolly = `scroll * k`).
  One scroll axis, no backtracking — same property that makes it "one path".
- **No flip** (see §8.5). Each frame is one face with a real link.
- **Fallback:** coarse-pointer / reduced-motion / no-WebGL → a static DOM project list
  (the film is progressive enhancement, never a usability gate). Lazy-init the canvas.
- **Perf budget:** 60fps on a 2020 laptop; dispose GL context on teardown; cap pixel
  ratio; textures sized sanely.

### Assets needed
One still per project (DevValue, Smart Airport, Cleanroll, Nod, CyberTao). `Nod` has
`assets/nod-screen.jpg`. Others: capture from the live demos/sites, or placeholder
frames (name on warm card) until real screenshots land.

### Build order (the film, phased — checkpoint + independent review at each ★)
- **F1** Vendor Three.js; stand up a renderable scene (canvas, camera, lights, one
  textured plane). Verify it paints. ★
- **F2** Build the strip: N frame-planes along a gentle 3D curve + sprocket-hole
  borders; project name/link DOM overlay synced to the focal frame.
- **F3** Scroll-driven camera dolly (Lenis → focus index along the strip). The
  **develop** mechanic: focal frame develops (dark/soft negative → bright/sharp
  positive), faces camera; neighbors stay dim negatives, curve away + bokeh. ★
- **F4** The dive-in transition: tunnel light → film reel (kill the seam).
- **F5** Real project textures; art direction (filmic grain/tone, amber key light). ★
- **F6** Fallback + perf + mobile + a11y pass. ★ (release gate)

### Honesty note
A polished 1:1-with-35mm result is a multi-session build, not one turn. Each turn ends
with a *verified, working* increment, not a half-broken scene.
