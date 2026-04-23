# Chris Zhang — Portfolio Philosophy

---

## 1. The core theory: Time · Attention · Friction

### The anchor sentence (never changes)
> **"Time is currency. Attention is where you spend it."**

### Structure

| Concept | Meaning |
|---|---|
| **Time** | Your only non-renewable resource |
| **Attention** | How you choose to spend it |
| **Friction** | The tax on attention — every window switch, every re-entry, every approval wait is draining your focus |
| **Tools** | Everything I build exists to remove that tax |

### Key insight (from 8 years in Big 4 audit)
In audit work the most expensive thing is not bad debt, not fraud, but **human attention disappearing inside process**. Switching, waiting, repeating, confirming — these frictions have no line item, but the cost is real.

---

## 2. Camera optics ↔ website design

### How a camera works
- **Dark box**: the outside is black. The world already exists — but without light, nothing is seen.
- **Lens**: decides where light enters, and where the focus lies.
- **Focal plane**: at any moment, only one plane is sharp. Everything in front of or behind it falls into bokeh.
- **Autofocus hunt**: the camera does not lock in one shot. It oscillates, narrowing each time, until it converges. That is a damped harmonic oscillator.

### The mapping to attention

| Camera | Attention theory |
|---|---|
| Dark box | The substrate of time — the world already exists |
| Lens | Consciousness — it decides where light (attention) enters |
| Focal plane | The present moment — you can only live clearly in one place |
| Bokeh beyond depth of field | Friction / noise — where your attention has not reached |
| Focus hunt | Decision-making — probing, narrowing, finally locking |
| Shutter click | The moment of action — every project is a shutter press |
| Photograph | The work you leave behind |

### Key insight
> A camera is a light-collecting system. Dark surfaces reflect light into it, and with light, it leaves an image.
> So are you. Where your attention shines, that is where things become real.

---

## 3. Human evolution and AI — the long thread

### The philosophical frame (original)

1. **Human evolution = biomimicry**
   From totem worship to the industrial revolution, every step forward has been imitating a natural structure and then surpassing it. We build wheels because legs are not enough. We build planes because wings are not ours. We build computers because memory fails.

2. **AI = humans recognizing themselves**
   Understanding the world and understanding ourselves is one process. The AI we are building speaks our own vocabulary: Memory, Attention, Context, Chains of Thought. The core mechanism of the Transformer is literally called **Attention**.

3. **What AI will eventually become**
   Not a tool, not a threat — it will become more and more human.

4. **What then is the true difference between humans and AI**
   Not compute, not memory, not reasoning — it is **Empathy**. The ability to feel another person directly, without calculation.

5. **This thread connects to CyberTao**
   CyberTao is the project that explores that edge: when the machine thinks for you, where does your attention go?

---

## 4. Website design philosophy

### Two phases of experience

**Phase one — the dark box (first screen)**
- On arrival the whole screen is blurred and dim. Drowsy eyes. The light has not yet arrived.
- The mouse is the lens. Wherever you carry light, that is where things begin to exist.
- After 1.8 s of dwell, the hunt begins: the blur oscillates (damped harmonic formula).
- After 4–5 oscillations it locks — "click" of the shutter, a white flash, and the page is suddenly sharp.
- This process **is not explained, only experienced**. What the visitor feels *is* the theory.

**Phase two — the clear narrative (on scroll)**
- After the lock, reading mode begins.
- Content is fully legible; only a gentle vignette remains at the edges — the natural corner darkening of a viewfinder.
- The mouse stays as a viewfinder cursor (four L-shaped corners, not a circle).

### Cursor design
- **Shape**: four L-shaped corners — the photographer's framing gesture, or a director's composition hand.
- **Not a circle**: a circle reads as a sniper scope, not a camera.
- **States**:
  - Normal: 56 px corner frame
  - Hover on a link: widens to 72 px (pulls the composition back)
  - During hunt: contracts with breathing flicker
  - At lock: snaps to minimum, pops back open — the visual "click"

### Physics (damped harmonic oscillator)
```
blur(t) = A · e^(-ζω₀t) · |cos(ω_d·t)|
ζ = 0.15       (under-damped, ~4 oscillations)
ω₀ = 4.5 rad/s (each oscillation ~1.4 s)
total hunt time ~6 s
```

### Sound design
- Web Audio API synthesis — no external files
- Shutter click = mechanical noise transient (filtered noise burst, 2800 Hz bandpass)
- Lock-in chime = short high tone (1900 Hz → 1500 Hz, 70 ms)

---

## 5. Narrative structure (five chapters)

| Chapter | Title | Core |
|---|---|---|
| 01 ORIGIN | You are a camera. | Dark-box metaphor; attention as lens |
| 02 REFLECTION | AI is humanity recognizing itself. | Human evolution → AI mimics humans → Empathy |
| 03 MEASURE | Friction is the tax on your focal plane. | Big 4 background, DevValue |
| 04 REMOVE | Give the focal plane back to what matters. | Cleanroll, Nod, FFP |
| 05 NEXT | This lens, pointed at enterprise AI. | AI auditing direction |

---

## 6. Project matrix (by friction type)

| Project | Friction removed | Status |
|---|---|---|
| **DevValue** | AI cost opacity — you don't know where your attention budget is going | Live |
| **Cleanroll** | Canadian payroll — jumping between six windows just to pay someone | Beta |
| **Nod** | Menu-decision anxiety — the focal plane should be on the person across the table, not the menu | TestFlight |
| **CyberTao** | The AI / cognition boundary — a philosophical frame for thinking alongside machines | Live |
| **FFP** | Points complexity — travel optimization should not need a spreadsheet | Private |
| **Pedalling** | Life trajectory — cities, decisions, the formation of this way of thinking | Story |

---

## 7. Personal workflow (theory as daily practice)

Primary input is **Super Whisper** voice-to-text:
- Thought reaches execution without keyboard, mouse, or visual search.
- Voice writes directly into whatever window is active.
- Eliminates typos, autocorrect wrangling, mouse switching, visual scanning — all of it.

> This is not a tool preference. It is the theory applied daily.

---

## 8. Positioning

**One-line bio:**
> Former Big 4 auditor turned builder. At the intersection of AI, financial systems, and product — building tools that eliminate friction so your attention flows toward what actually matters.

**Background tags:**
- MS CS @ Northeastern University Vancouver
- 8 years Tech Risk & Data Governance @ Deloitte / KPMG
- Career Peer Advisor @ CDEL
- MS Student Advisory Board

---

## 9. Related links

- Personal site: `chriszhang.me` (GitHub Pages: ChrisZHHG/chriszhang.me)
- CyberTao: `cybertao.netlify.app` (can also be bound to `cybertao.chriszhang.me`)
- DevValue: VS Code Marketplace (`ChrisZhang.devvalue`)
- Substack essay: *You Are a Camera* (drafted, pending release)

---

## 10. Substack outline — *You Are a Camera*

Drafted. Core structure:
1. The lens is your attention.
2. Focus-hunt is the process of thinking (damped oscillation → decision).
3. The shutter is what you leave behind (each project = one photograph).
4. Friction is the blur outside the focus.
5. AI is also a camera (the Attention mechanism).
6. The difference between humans and AI: Empathy.

---

*This document summarizes the complete dialogue with Claude on April 11, 2026.*

---

## 11. Round 4 redesign plan (Apr 22, 2026)

### Problems observed in the live site
1. **Cleanroll card-back iframe hijacks the flip** — Loom fullscreen covers the "try app" link and prevents flip-back; video is also ~3 min, too long for an archive beat.
2. **Nod is just spec text** — looks pale next to Cleanroll's live demo. Reference: kylemcgraw.me embeds iOS apps *inside* a phone mockup so the product feels alive, not "documented".
3. **Two projects missing**: YVR e-GSE Capstone (Transformer + PPO, 90 % coverage, 9.2 % gain), and ICBC FlashSlot (personal road-test slot snatcher — a pure "friction-removal" tool that matches the manifesto exactly).
4. **Archive feels "generic dark theme"** — pure `#0d0c0a` + cold vignette reads like any portfolio template. Needs a warmer, more print-like base.
5. **Type is too small on 27″ monitors** — body 16 px / specs 14.5 px feel undersized at ~100 % zoom on 4K-at-standard-scaling.

### Chosen solutions (all documented here so the next session can pick up cleanly)

| # | Problem | Solution |
|---|---|---|
| 1 | Cleanroll flip trap | **Split card back**: smaller video on the left (`loop=1&muted=1&hide_owner=1`), "what it does / try it" column on the right with a prominent CTA button. Persistent "flip back" affordance that sits above the iframe's event layer. |
| 2 | Nod feels flat | **Plan A — HTML/CSS recreation** inside an iPhone 16 Pro mockup: dumpling photo as bg, `Snap 📷 / Decode 🌐 / Trust 👆` serif list with a cycling highlight, the big `NOD` wordmark (orange O), `How are you dining today?` + three round amber buttons (Grand Feast / Agent Chat / Solo Tasting), `Join a Table` footer. All live — hover states, cycling animation. Disclaimer line: *"Pre-release. Not representative of final app."* |
| 3 | Missing projects | Add **YVR e-GSE Capstone** as Plate 02 (prominent, right after DevValue) — Transformer + PPO for optimizing EV ground-support equipment charging at Vancouver Airport; embeds the YouTube simulation video; links to LinkedIn post. Add **ICBC FlashSlot** further down — personal tool that polls ICBC's road-test booking page and notifies when a seat opens. Pure "friction → tool" story. |
| 4 | Archive contrast | Shift archive from `#0d0c0a` flat black to a warmer deep-umber gradient (`#1a1411` → `#0f0b09`) with slightly warmer card faces (`#1e1a15` → `#13100d`). Soften the vignette (`0.5 → 0.28`). Pure black stays only inside iframes. Reads more like "gallery print room" than "dark mode". |
| 5 | Readability on 27″ | Global type bump: body `16 → 17`, hero-bio / manifesto-body / now-list / bg-value `15.5 → 17.5`, card-desc `14.5 → 16.5`, spec-sub `14.5 → 16`, spec-list `11.5 → 13`, thread-map `12.5 → 14`, topbar `10.5 → 12`, toc `11 → 12.5`. |

### New project matrix (8 plates)

| # | Project | Friction removed | Status |
|---|---|---|---|
| 01 | **DevValue** | AI cost opacity | Live (VS Code Marketplace) |
| 02 | **YVR e-GSE Capstone** | Manual airport charging schedules → ML-optimized | Demo + paper |
| 03 | **Cleanroll** | Canadian payroll complexity | Beta (cleanroll.onrender.com) |
| 04 | **Nod** | Foreign-menu decision anxiety | TestFlight (iPhone mockup) |
| 05 | **CyberTao** | Thinking alongside machines | Live (essay site) |
| 06 | **ICBC FlashSlot** | Road-test booking lottery | Private tool |
| 07 | **FFP** | Points programs sprawl | Private backend |
| 08 | **Pedalling** | Drift in my own story | Drafting |

### Files touched this round
- `index.html` — archive palette, typography tokens, Cleanroll back, Nod mockup, YVR + FlashSlot plates, 8-plate TOC/thread-map, scroll math updated for 8 cards.
- `assets/nod-home.jpg` — dumpling-background screenshot used under the CSS-rebuilt UI overlay.
- `portfolio_philosophy_summary.md` — this section.

### Carry-over / next round
- Once YVR YouTube URL + LinkedIn post URL are confirmed, hot-swap the placeholders in Plate 02.
- Once Nod has a public website or App Store listing, upgrade the mockup into a real "↗ open app" CTA.
- Consider a Substack / long-form embed on the Pedalling plate once the first essay ships.

