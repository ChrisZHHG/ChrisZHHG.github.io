export function createAudio() {
  let ctx = null;
  let muted = false;
  let noiseBuffer = null;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const len = Math.floor(ctx.sampleRate * 0.18);
    noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return ctx;
  }

  function click({ centerFreq = 2800, q = 10, duration = 0.07, gain = 0.18 } = {}) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = centerFreq;
    bp.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(gain, c.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
    src.connect(bp).connect(g).connect(c.destination);
    src.start();
    src.stop(c.currentTime + duration + 0.02);
  }

  function tone({ from = 1900, to = 1500, duration = 0.08, gain = 0.06 } = {}) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(from, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(to, c.currentTime + duration);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(gain, c.currentTime + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
    osc.connect(g).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + duration + 0.02);
  }

  function shutter() { click({ centerFreq: 2800, q: 9, duration: 0.08, gain: 0.22 }); }
  function softTick() { click({ centerFreq: 5200, q: 14, duration: 0.04, gain: 0.12 }); }
  function lockChime() { tone({ from: 1900, to: 1500, duration: 0.09, gain: 0.05 }); }

  function toggle() {
    muted = !muted;
    if (!muted) ensure();
    const btn = document.querySelector('.audio-toggle');
    if (btn) {
      const label = btn.querySelector('.audio-label');
      if (label) label.textContent = muted ? 'sound · off' : 'sound · on';
      btn.setAttribute('aria-pressed', String(muted));
    }
  }

  return {
    ensure,
    shutter,
    softTick,
    lockChime,
    toggle,
    get muted() { return muted; }
  };
}

export function initAudioToggle(Audio) {
  const btn = document.querySelector('.audio-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => Audio.toggle());
}
