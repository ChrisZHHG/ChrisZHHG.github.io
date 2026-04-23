import { body, root, prefersReducedMotion, isCoarsePointer, clamp } from './lib/env.js';
import { safeInit } from './lib/safe.js';
import { createAudio, initAudioToggle } from './core/audio.js';
import { initGrain } from './core/grain.js';
import { createStage } from './core/stage.js';
import { createFocalPlane } from './core/focal.js';
import { initCursor } from './core/cursor.js';
import { initGate } from './features/gate.js';
import { initArchive } from './features/archive.js';
import { initNodHotspots, initNodDemoPanel } from './features/nod.js';
import { initInterestFlips } from './features/interests.js';
import { initThreadJumps, initScrollSpy, initBeforeUnloadFade } from './features/navigation.js';

document.documentElement.classList.add('js');

const Audio = safeInit('audio:create', () => createAudio()) || {
  muted: true,
  shutter() {},
  softTick() {},
  lockChime() {},
  toggle() {},
};

safeInit('audio:toggle', () => initAudioToggle(Audio));
safeInit('grain', () => initGrain());

const Stage = safeInit('stage', () => createStage(body)) || { current: 'paper', set() {} };
const FocalPlane = safeInit('focal', () => createFocalPlane({ cursorEl: document.querySelector('.cursor'), prefersReducedMotion })) || { lock() {}, unlock() {}, onMotion() {} };

safeInit('cursor', () => initCursor({ Stage, FocalPlane, isCoarsePointer, prefersReducedMotion }));
safeInit('gate', () => initGate({ body, prefersReducedMotion }));

const Archive = safeInit('archive', () => initArchive({ Audio, Stage, prefersReducedMotion, clamp })) || { navigateTo() {} };

safeInit('nod:hotspots', () => initNodHotspots());
safeInit('nod:panel', () => initNodDemoPanel(Audio));
safeInit('interests', () => initInterestFlips(Audio));
safeInit('thread-jumps', () => initThreadJumps(Archive));
safeInit('scroll-spy', () => initScrollSpy());
safeInit('beforeunload', () => initBeforeUnloadFade());

// Keep root imported and referenced for future state vars
void root;
