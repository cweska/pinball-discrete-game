/**
 * Every sound in the machine is synthesised. No audio files to ship, license
 * or fail to load on a school network.
 *
 * The palette is deliberately electro-mechanical: struck chime bars, a bell,
 * coil thunks, the slap of a slingshot and the knocker on the back of the
 * cabinet.
 */

let ctx = null;
let master = null;
let muted = false;
let noiseBuffer = null;
let spinTimer = null;

function context() {
  if (ctx) return ctx;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = 0.42;
  master.connect(ctx.destination);
  return ctx;
}

function noise() {
  const ac = context();
  if (!noiseBuffer) {
    noiseBuffer = ac.createBuffer(1, ac.sampleRate * 0.6, ac.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const source = ac.createBufferSource();
  source.buffer = noiseBuffer;
  return source;
}

/** Browsers hold audio until a real gesture; call this from a click handler. */
export function unlockAudio() {
  const ac = context();
  if (ac && ac.state === 'suspended') ac.resume();
}

export function setMuted(value) {
  muted = !!value;
  if (muted) stopSpin();
}

export function isMuted() {
  return muted;
}

function ready() {
  if (muted) return null;
  const ac = context();
  if (!ac || ac.state === 'suspended') return null;
  return ac;
}

function struck(frequency, { decay = 0.9, gain = 0.5, partials = [1, 2.76, 5.4], type = 'sine' } = {}) {
  const ac = ready();
  if (!ac) return;
  const now = ac.currentTime;
  const bus = ac.createGain();
  bus.gain.setValueAtTime(gain, now);
  bus.gain.exponentialRampToValueAtTime(0.0001, now + decay);
  bus.connect(master);
  partials.forEach((ratio, index) => {
    const osc = ac.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency * ratio;
    const partialGain = ac.createGain();
    partialGain.gain.value = 1 / (index + 1.6);
    osc.connect(partialGain).connect(bus);
    osc.start(now);
    osc.stop(now + decay);
  });
}

function thump({ cutoff = 260, decay = 0.16, gain = 0.85, sweepTo = null } = {}) {
  const ac = ready();
  if (!ac) return;
  const now = ac.currentTime;
  const source = noise();
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(cutoff, now);
  if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, now + decay);
  const envelope = ac.createGain();
  envelope.gain.setValueAtTime(gain, now);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + decay);
  source.connect(filter).connect(envelope).connect(master);
  source.start(now);
  source.stop(now + decay + 0.02);
}

function snap({ frequency = 1500, q = 6, decay = 0.07, gain = 0.5 } = {}) {
  const ac = ready();
  if (!ac) return;
  const now = ac.currentTime;
  const source = noise();
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = frequency;
  filter.Q.value = q;
  const envelope = ac.createGain();
  envelope.gain.setValueAtTime(gain, now);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + decay);
  source.connect(filter).connect(envelope).connect(master);
  source.start(now);
  source.stop(now + decay + 0.02);
}

function blip(frequency, { decay = 0.1, gain = 0.22, type = 'square' } = {}) {
  const ac = ready();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  osc.type = type;
  osc.frequency.value = frequency;
  const envelope = ac.createGain();
  envelope.gain.setValueAtTime(gain, now);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + decay);
  osc.connect(envelope).connect(master);
  osc.start(now);
  osc.stop(now + decay + 0.02);
}

const VOICES = {
  chime: () => struck(784, { decay: 1.1, gain: 0.34 }),
  chimeHigh: () => struck(1046, { decay: 0.9, gain: 0.3 }),
  chimeLow: () => struck(523, { decay: 1.3, gain: 0.34 }),
  bell: () => struck(660, { decay: 1.8, gain: 0.4, partials: [1, 2.4, 3.8, 5.9] }),
  coil: () => {
    thump({ cutoff: 300, decay: 0.15, gain: 0.8, sweepTo: 90 });
    snap({ frequency: 2200, gain: 0.2, decay: 0.04 });
  },
  coilSoft: () => thump({ cutoff: 220, decay: 0.12, gain: 0.45, sweepTo: 80 }),
  slap: () => {
    snap({ frequency: 1100, q: 2.5, decay: 0.09, gain: 0.55 });
    thump({ cutoff: 400, decay: 0.07, gain: 0.35 });
  },
  knocker: () => {
    thump({ cutoff: 190, decay: 0.22, gain: 1, sweepTo: 60 });
    snap({ frequency: 900, q: 1.5, decay: 0.08, gain: 0.4 });
  },
  tick: () => snap({ frequency: 2600, q: 9, decay: 0.03, gain: 0.22 }),
  place: () => blip(620, { decay: 0.07, gain: 0.16 }),
  wire: () => blip(880, { decay: 0.05, gain: 0.12, type: 'triangle' }),
  cut: () => blip(300, { decay: 0.07, gain: 0.12, type: 'triangle' }),
  reject: () => {
    blip(240, { decay: 0.1, gain: 0.16, type: 'triangle' });
    setTimeout(() => blip(190, { decay: 0.14, gain: 0.16, type: 'triangle' }), 110);
  },
  solved: () => {
    [523, 659, 784, 1046].forEach((frequency, index) => {
      setTimeout(() => struck(frequency, { decay: 0.8, gain: 0.3 }), index * 110);
    });
  },
  relay: () => snap({ frequency: 700, q: 4, decay: 0.05, gain: 0.3 }),
};

export function play(name) {
  const voice = VOICES[name];
  if (voice) voice();
}

/** The spinner rattles for as long as it turns. */
export function startSpin() {
  if (spinTimer || muted) return;
  let interval = 70;
  const step = () => {
    play('tick');
    interval = Math.min(150, interval * 1.06);
    spinTimer = setTimeout(step, interval);
  };
  step();
}

export function stopSpin() {
  if (spinTimer) clearTimeout(spinTimer);
  spinTimer = null;
}

export function hasVoice(name) {
  return Object.prototype.hasOwnProperty.call(VOICES, name);
}
