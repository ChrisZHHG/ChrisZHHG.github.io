import { body, root, prefersReducedMotion, isCoarsePointer, clamp } from './lib/env.js';
import { safeInit } from './lib/safe.js';
import { createAudio, initAudioToggle } from './core/audio.js';
import { initGrain } from './core/grain.js';
import { createStage } from './core/stage.js';
import { createFocalPlane } from './core/focal.js';
import { initCursor } from './core/cursor.js';
import { createHealthMonitor } from './core/health.js';
import { initGate } from './features/gate.js';
import { initArchive } from './features/archive.js';
import { initNodHotspots, initNodDemoPanel } from './features/nod.js';
import { initInterestFlips } from './features/interests.js';
import { initThreadJumps, initScrollSpy, initBeforeUnloadFade } from './features/navigation.js';
import { runSmokeChecks } from './features/smoke.js';

document.documentElement.classList.add('js');
const health = createHealthMonitor();
const hooks = { onOk: health.onOk, onError: health.onError };

const Audio = safeInit('audio:create', () => createAudio(), hooks) || {
  muted: true,
  shutter() {},
  softTick() {},
  lockChime() {},
  toggle() {},
};

safeInit('audio:toggle', () => initAudioToggle(Audio), hooks);
safeInit('grain', () => initGrain(), hooks);

const Stage = safeInit('stage', () => createStage(body), hooks) || { current: 'paper', set() {} };
const FocalPlane = safeInit('focal', () => createFocalPlane({ cursorEl: document.querySelector('.cursor'), prefersReducedMotion }), hooks) || { lock() {}, unlock() {}, onMotion() {} };

safeInit('cursor', () => initCursor({ Stage, FocalPlane, isCoarsePointer, prefersReducedMotion }), hooks);
safeInit('gate', () => initGate({ body, prefersReducedMotion }), hooks);

const Archive = safeInit('archive', () => initArchive({ Audio, Stage, prefersReducedMotion, clamp }), hooks) || { navigateTo() {} };

safeInit('nod:hotspots', () => initNodHotspots(), hooks);
safeInit('nod:panel', () => initNodDemoPanel(Audio), hooks);
safeInit('interests', () => initInterestFlips(Audio), hooks);
safeInit('thread-jumps', () => initThreadJumps(Archive), hooks);
safeInit('scroll-spy', () => initScrollSpy(), hooks);
safeInit('beforeunload', () => initBeforeUnloadFade(), hooks);
safeInit('smoke', () => runSmokeChecks(), hooks);
health.report();

// Keep root imported and referenced for future state vars
void root;
