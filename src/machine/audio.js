/**
 * Table parts play samples taken from the Visual Pinball example table
 * (see assets/sounds/SOURCES.txt). Bench cues stay synthesized: placing a
 * gate, drawing a wire, and the short tones for a solved level.
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
  ensureSamples();
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

/** Sound-manager names from the example table, kept as the filenames. */
const SAMPLES = [
  'knocker',
  'fx_bumper1',
  'fx_bumper2',
  'fx_bumper3',
  'fx_bumper4',
  'left_slingshot',
  'right_slingshot',
  'ballrelease',
  'gate',
  'popper_ball',
  'plunger',
  'fx_Flipperup',
  'fx_Flipperdown',
  'fx_spinner',
  'target',
];

const BUMPERS = ['fx_bumper1', 'fx_bumper2', 'fx_bumper3', 'fx_bumper4'];
const buffers = new Map();
let loading = null;
let bumperAt = 0;

function sampleUrl(name) {
  return new URL(`../../assets/sounds/${name}.wav`, import.meta.url);
}

function ensureSamples() {
  const ac = context();
  if (!ac) return Promise.resolve();
  if (loading) return loading;
  loading = Promise.all(
    SAMPLES.map(async (name) => {
      const response = await fetch(sampleUrl(name));
      if (!response.ok) throw new Error(`Missing sound ${name}`);
      const bytes = await response.arrayBuffer();
      buffers.set(name, await ac.decodeAudioData(bytes));
    })
  ).catch(() => {
    loading = null;
  });
  return loading;
}

function playSample(name) {
  const ac = ready();
  if (!ac) return;
  const buffer = buffers.get(name);
  if (!buffer) {
    ensureSamples().then(() => {
      if (!muted && buffers.get(name)) playSample(name);
    });
    return;
  }
  const source = ac.createBufferSource();
  source.buffer = buffer;
  source.connect(master);
  source.start();
}

export function play(name) {
  if (name === 'bumper') {
    const clip = BUMPERS[bumperAt % BUMPERS.length];
    bumperAt += 1;
    playSample(clip);
    return;
  }
  if (SAMPLES.includes(name)) {
    playSample(name);
    return;
  }
  const voice = VOICES[name];
  if (voice) voice();
}

/** The spinner rattles for as long as it turns. */
export function startSpin() {
  if (spinTimer || muted) return;
  let interval = 70;
  const step = () => {
    play('fx_spinner');
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
  return name === 'bumper' || SAMPLES.includes(name) || Object.prototype.hasOwnProperty.call(VOICES, name);
}
