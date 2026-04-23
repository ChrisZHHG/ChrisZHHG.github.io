# UI Acceptance Checklist (Release Gate)

Use this checklist before every push to production.

How to use:
- Mark each item as `[x]` only when it meets the acceptance rule.
- If any **P0** item fails, do not ship.

---

## P0 — Must Pass (Blocker)

### 1) Interaction Causality
- [ ] Every visible motion is triggered by clear user intent (click, key, hover, drag, or explicit state change).
- [ ] No passive "random" effects that fire without user action.
- [ ] Interactive demos produce a visible state/output change after input.

**Pass rule:** user can explain "I did X, UI did Y" for each major interaction.

### 2) Motion Quality
- [ ] Micro-interactions are within 100-150ms.
- [ ] Standard card/panel transitions are within 150-250ms.
- [ ] Large transitions are within 200-300ms.
- [ ] No regular UI animation exceeds 300ms.

**Pass rule:** transitions feel responsive; no sluggish or floating delay.

### 3) Cursor / Pointer Integrity
- [ ] No dual-cursor moments (custom + native) in normal desktop flow.
- [ ] On embedded surfaces (iframe/video), pointer behavior is stable (no sudden pointer/hand mismatch).
- [ ] Hover/active states are consistent and reversible.

**Pass rule:** cursor behavior remains predictable for a full page walk-through.

### 4) Typography Readability
- [ ] Body text remains readable on 27" desktop at default zoom.
- [ ] No dense card text appears compressed or undersized.
- [ ] Label hierarchy is clear (display vs body vs metadata).

**Pass rule:** no critical paragraph requires zoom-in to read comfortably.

### 5) Color Cohesion
- [ ] Page uses one coherent palette family (or one intentional gradient narrative), no abrupt accidental theme breaks.
- [ ] Contrast supports hierarchy and legibility.
- [ ] Accent color is used for emphasis/interaction, not random decoration.

**Pass rule:** adjacent sections do not feel like separate products.

### 6) HTTPS + Trust Surface
- [ ] Domain resolves on HTTPS without warning.
- [ ] HTTP path redirects to HTTPS.
- [ ] Favicon is present in browser tab.

**Pass rule:** no "Not secure" warning in normal visit path.

---

## P1 — Should Pass (Strongly Recommended)

### 7) Information Architecture
- [ ] Core Work and Interests are clearly separated.
- [ ] Core narrative answers: friction -> tool -> outcome.
- [ ] Secondary/personal projects do not dilute primary portfolio proof.

**Pass rule:** first-time visitor can identify "main work" in < 20 seconds.

### 8) Demo Honesty
- [ ] Prototype vs production is clearly labeled where relevant.
- [ ] Links to real app/repo/video are available when demo is constrained.

**Pass rule:** user never mistakes a mock interaction for full production behavior.

### 9) Content Consistency
- [ ] Profile links are consistent across sidebar/contact/cards.
- [ ] Plate counts/section labels match actual content counts.
- [ ] Terminology is consistent ("Work", "Interests", etc.).

**Pass rule:** no contradictory labels or stale copy.

---

## P2 — Nice to Have

### 10) Performance Feel
- [ ] No noticeable jank during card flip/scroll on modern laptop.
- [ ] Heavy embeds lazy-load and do not block initial interaction.

### 11) Editorial Polish
- [ ] Quotes and long-form blocks use consistent spacing and rhythm.
- [ ] Buttons/links have consistent hover and active feel.

---

## Final Go/No-Go

- [ ] **GO** only if all P0 items pass.
- [ ] If any P0 fails -> **NO-GO** and create a fix list.

