import { body, root, isCoarsePointer, clamp, createReducedMotionController } from './lib/env.js';
import { safeInit } from './lib/safe.js';
import { createAudio, initAudioToggle } from './core/audio.js';
import { initGrain } from './core/grain.js';
import { createStage } from './core/stage.js';
import { createFocalPlane } from './core/focal.js';
import { createScroll } from './core/scroll.js';
import { initCursor } from './core/cursor.js';
import { createHealthMonitor } from './core/health.js';
import { createBellows } from './core/bellows.js';
import { initPerfMode } from './core/perf.js';
import { initGate } from './features/gate.js';
import { initArchive } from './features/archive.js';
import { initNodHotspots, initNodDemoPanel } from './features/nod.js';
import { initInterestFlips } from './features/interests.js';
import { initManifesto } from './features/manifesto.js';
import { initSections } from './features/sections.js';
import { initThreadJumps, initScrollSpy, initBeforeUnloadFade } from './features/navigation.js';
import { initAnalytics, showVisitCount } from './features/analytics.js';
import { runSmokeChecks } from './features/smoke.js';
import { renderDebugHealthBadge } from './features/debugBadge.js';

document.documentElement.classList.add('js');

// Compensate for Windows classic scrollbar (takes ~17px of layout width).
// vw units include the scrollbar; this variable lets CSS subtract half of it
// so elements using vw for centering stay visually centered.
const scrollbarW = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
if (scrollbarW > 0) {
  document.documentElement.style.setProperty('--scrollbar-w', scrollbarW + 'px');
}

const health = createHealthMonitor();
const hooks = { onOk: health.onOk, onSkip: health.onSkip, onError: health.onError };
const runtime = [];
const reducedMotion = createReducedMotionController();

function trackDisposable(instance) {
  if (instance && typeof instance.dispose === 'function') runtime.push(instance);
  return instance;
}

const Audio = trackDisposable(safeInit('audio:create', () => createAudio(), hooks)) || {
  muted: true,
  shutter() {},
  softTick() {},
  lockChime() {},
  toggle() {},
  dispose() {},
};

trackDisposable(safeInit('audio:toggle', () => initAudioToggle(Audio), hooks));
trackDisposable(safeInit('grain', () => initGrain(), hooks));

const Stage = trackDisposable(safeInit('stage', () => createStage(body), hooks)) || { current: 'paper', set() {}, dispose() {} };
const FocalPlane = trackDisposable(safeInit('focal', () => createFocalPlane({
  cursorEl: document.querySelector('.cursor'),
  isReducedMotion: reducedMotion.isReduced,
}), hooks)) || { lock() {}, unlock() {}, onMotion() {}, dispose() {} };

trackDisposable(safeInit('cursor', () => initCursor({
  Stage,
  FocalPlane,
  isCoarsePointer,
  isReducedMotion: reducedMotion.isReduced,
}), hooks));

// Smooth-scroll spine (Lenis). Created before the archive so its scrollTo can be
// injected into the archive's programmatic navigation.
const Scroll = trackDisposable(safeInit('scroll', () => createScroll({
  isReducedMotion: reducedMotion.isReduced,
  isCoarsePointer,
}), hooks)) || { lenis: null, scrollTo() {}, dispose() {} };

// Bellows oscillator: subtle ±1.5% scale breathing on the leather frame.
// Starts after cursor (so --cx/--cy are writable) and before gate.
const Bellows = trackDisposable(safeInit('bellows', () => createBellows({
  isReducedMotion: reducedMotion.isReduced,
}), hooks)) || { dispose() {} };

// Auto low-power degrade: if frames are sustained-janky (weak GPU), add
// html.perf-lite (CSS drops the costly full-screen effects) and stop the
// always-on breathing loop. High-framerate machines never trip it.
trackDisposable(safeInit('perf', () => initPerfMode({
  isReducedMotion: reducedMotion.isReduced,
  onDegrade: () => { try { Bellows.dispose(); } catch (_) {} },
}), hooks));

trackDisposable(safeInit('gate', () => initGate({ body, isReducedMotion: reducedMotion.isReduced }), hooks));

const Archive = trackDisposable(safeInit('archive', () => initArchive({
  Audio,
  Stage,
  isReducedMotion: reducedMotion.isReduced,
  isCoarsePointer,
  clamp,
  scrollTo: Scroll.scrollTo,
}), hooks)) || { navigateTo() {}, dispose() {} };

trackDisposable(safeInit('nod:hotspots', () => initNodHotspots(), hooks));
trackDisposable(safeInit('nod:panel', () => initNodDemoPanel(Audio), hooks));
trackDisposable(safeInit('interests', () => initInterestFlips(Audio), hooks));
trackDisposable(safeInit('manifesto', () => initManifesto({ isReducedMotion: reducedMotion.isReduced }), hooks));
trackDisposable(safeInit('sections', () => initSections({ isReducedMotion: reducedMotion.isReduced }), hooks));
trackDisposable(safeInit('thread-jumps', () => initThreadJumps(Archive), hooks));
trackDisposable(safeInit('scroll-spy', () => initScrollSpy(), hooks));
trackDisposable(safeInit('beforeunload', () => initBeforeUnloadFade(), hooks));
safeInit('analytics', () => initAnalytics(), hooks);
safeInit('visit-count', () => showVisitCount(), hooks);
const smoke = safeInit('smoke', () => runSmokeChecks(), hooks);
const status = health.report();
safeInit('debug-badge', () => renderDebugHealthBadge({
  enabled: health.debug,
  healthStatus: status,
  smokeStatus: smoke || window.__smoke,
}), hooks);

window.__disposeSite = function disposeSiteRuntime() {
  while (runtime.length) {
    const item = runtime.pop();
    try { item.dispose(); } catch (error) { console.error('[dispose]', error); }
  }
  try { reducedMotion.dispose(); } catch (error) { console.error('[dispose:motion]', error); }
};

// Keep root imported and referenced for future state vars
void root;
