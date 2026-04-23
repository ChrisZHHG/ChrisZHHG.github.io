# ChrisZhang.me UI Taste Skill (v1)

Derived from: https://emilkowal.ski/ui/agents-with-taste

## Goal

Keep the site cinematic, readable, and interaction-first without visual noise.
Every animation and layout choice must have a reason.

## 1) Motion Principles

- UI micro-interactions: 100-150ms.
- Standard panel/card transitions: 150-250ms.
- Large scene transitions: 200-300ms.
- Never exceed 300ms for normal UI transitions.
- Exit can be ~20% faster than enter.

### Easing Decision Rules

- Entering/exiting view: `ease-out`.
- On-screen morph/move: `ease-in-out`.
- Hover state changes: `ease`.
- Continuous loops: `linear`.

## 2) Cursor + Focus Rules

- Cursor is a functional affordance, not decoration.
- If a custom cursor exists, it must map to real interaction states:
  - hover target
  - active/pressed
  - focus lock
- No passive noisy effects when user is not interacting.
- Avoid dual-cursor moments (custom + native) on embedded surfaces.

## 3) Typography Rules

- Body text max width around 60-65ch for readability.
- Uppercase labels need loose tracking (avoid cramped all-caps).
- Underlines are for links only.
- Do not style non-clickable text as if clickable.
- Keep one clear hierarchy:
  - display serif for title
  - sans for body
  - mono for metadata

## 4) Color System Rules

- One coherent palette family per page state.
- Avoid abrupt theme flips between sections unless narrative requires it.
- Use contrast by hierarchy, not random hue switching.
- Accent color should indicate interaction or emphasis, not fill large surfaces.

## 5) Information Architecture Rules

- Separate `Core Work` from `Interests`.
- Core cards prove capability; interest cards show personality.
- Narrative should answer:
  1. What friction?
  2. What tool?
  3. What outcome?

## 6) Demo Experience Rules

- "Looks interactive" is not enough; user must be able to try a flow.
- If real backend is unavailable, provide a constrained but real stateful demo.
- Prefer:
  - clickable mode switches
  - visible output changes
  - clear "prototype vs production" labeling

## 7) Anti-Patterns (Do Not Ship)

- Animation without purpose.
- Multiple competing visual metaphors in one viewport.
- Tiny text inside high-density cards.
- Third-party iframe layouts that break typographic consistency without fallback.
- Sound cues triggered by passive scroll (desync feeling).

## 8) QA Checklist Before Push

- Does each interaction have a user-intent trigger?
- Is motion duration within allowed ranges?
- Is text readable at 27" desktop scale?
- Are links and non-links visually distinguishable?
- Does this change reduce or increase cognitive load?

## 9) Operationalization

For concrete release checks, run:

- `ui_acceptance_checklist.md` (pass/fail gate for shipping)

Rule:
- Any P0 failure in the acceptance checklist blocks release.

