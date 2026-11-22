// audio.js: every sound is synthesized with WebAudio — no audio files,
// no network. A soft blip for loot, a clink for coins, a hush for smoke,
// a rising alarm tone, a sting for being caught, a chime for the getaway.

export function createAudio() {
  let ctx = null;
  let muted = false;
  let alarmOsc = null;
  let alarmGain = null;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = null) {
    const c = ensure();
    if (!c || muted) return;
    try {
      const t0 = c.currentTime + when;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(c.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
    } catch { /* sound is garnish; never break the game */ }
  }

  function noise(dur, vol, lowpass) {
    const c = ensure();
    if (!c || muted) return;
    try {
      const len = Math.floor(c.sampleRate * dur);
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = c.createBufferSource();
      src.buffer = buf;
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = lowpass;
      const g = c.createGain();
      g.gain.value = vol;
      src.connect(f).connect(g).connect(c.destination);
      src.start();
    } catch { /* ignore */ }
  }

  return {
    unlock() { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {}); },
    toggleMute() { muted = !muted; if (muted) this.stopAlarm(); return muted; },
    get muted() { return muted; },
    pickup() { tone(880, 0.12, 'sine', 0.16); tone(1320, 0.18, 'sine', 0.14, 0.07); },
    mainLoot() { tone(660, 0.14, 'triangle', 0.18); tone(880, 0.14, 'triangle', 0.18, 0.1); tone(1320, 0.3, 'triangle', 0.18, 0.2); },
    coin() { tone(1900, 0.07, 'square', 0.07); tone(1500, 0.09, 'square', 0.06, 0.06); },
    smoke() { noise(0.5, 0.12, 900); },
    laser() { tone(220, 0.25, 'sawtooth', 0.12, 0, 110); },
    spotted() { tone(520, 0.16, 'square', 0.08); tone(520, 0.16, 'square', 0.08, 0.2); },
    caught() { tone(392, 0.22, 'sawtooth', 0.16); tone(311, 0.22, 'sawtooth', 0.16, 0.2); tone(233, 0.5, 'sawtooth', 0.16, 0.4); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, i * 0.11)); },
    levelClear() { tone(784, 0.15, 'triangle', 0.15); tone(1047, 0.25, 'triangle', 0.15, 0.12); },
    startAlarm() {
      const c = ensure();
      if (!c || muted || alarmOsc) return;
      try {
        alarmOsc = c.createOscillator();
        alarmGain = c.createGain();
        alarmOsc.type = 'sine';
        alarmOsc.frequency.value = 660;
        alarmGain.gain.value = 0.045;
        alarmOsc.connect(alarmGain).connect(c.destination);
        alarmOsc.start();
      } catch { alarmOsc = null; }
    },
    setAlarmLevel(level) {
      if (alarmOsc && alarmGain) {
        try { alarmOsc.frequency.setTargetAtTime(520 + level * 5, ctx.currentTime, 0.1); } catch { /* ignore */ }
      }
    },
    stopAlarm() {
      if (alarmOsc) {
        try { alarmOsc.stop(); } catch { /* ignore */ }
        alarmOsc = null;
        alarmGain = null;
      }
    },
  };
}
