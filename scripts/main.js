import { body, root, isCoarsePointer, clamp, createReducedMotionController } from './lib/env.js';
import { safeInit } from './lib/safe.js';
import { createAudio, initAudioToggle } from './core/audio.js';
import { initGrain } from './core/grain.js';
import { createStage } from './core/stage.js';
import { createFocalPlane } from './core/focal.js';
import { initCursor } from './core/cursor.js';
import { createHealthMonitor } from './core/health.js';
import { createBellows } from './core/bellows.js';
import { createViewfinder } from './core/viewfinder.js';
import { initGate } from './features/gate.js';
import { initArchive } from './features/archive.js';
import { initNodHotspots, initNodDemoPanel } from './features/nod.js';
import { initInterestFlips } from './features/interests.js';
import { initThreadJumps, initScrollSpy, initBeforeUnloadFade } from './features/navigation.js';
import { runSmokeChecks } from './features/smoke.js';
import { renderDebugHealthBadge } from './features/debugBadge.js';

document.documentElement.classList.add('js');
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

// Bellows oscillator: starts after cursor (--cx/--cy must be writable) and
// before gate so the breathing is live when the gate fades out.
trackDisposable(safeInit('bellows', () => createBellows({
  isReducedMotion: reducedMotion.isReduced,
}), hooks));

// Viewfinder telemetry: timer, scroll %, fps, act — the "camera readouts"
// visible in the four bellows corners.
trackDisposable(safeInit('viewfinder', () => createViewfinder(), hooks));

trackDisposable(safeInit('gate', () => initGate({ body, isReducedMotion: reducedMotion.isReduced }), hooks));

const Archive = trackDisposable(safeInit('archive', () => initArchive({
  Audio,
  Stage,
  isReducedMotion: reducedMotion.isReduced,
  clamp,
}), hooks)) || { navigateTo() {}, dispose() {} };

trackDisposable(safeInit('nod:hotspots', () => initNodHotspots(), hooks));
trackDisposable(safeInit('nod:panel', () => initNodDemoPanel(Audio), hooks));
trackDisposable(safeInit('interests', () => initInterestFlips(Audio), hooks));
trackDisposable(safeInit('thread-jumps', () => initThreadJumps(Archive), hooks));
trackDisposable(safeInit('scroll-spy', () => initScrollSpy(), hooks));
trackDisposable(safeInit('beforeunload', () => initBeforeUnloadFade(), hooks));
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
