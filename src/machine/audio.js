/**
 * Table parts play samples taken from the Visual Pinball example table
 * (see assets/sounds/SOURCES.txt). Bench cues stay synthesized: placing a
 * gate, drawing a wire, and the short tones for a solved level.
 *
 * The context is created on the first gesture. Safari stays suspended until
 * resume() settles, so sounds from that gesture wait in a short queue instead
 * of being dropped. A clip Safari cannot decode is loaded as 16-bit PCM.
 */

const GESTURE_QUEUE_MS = 500;
const QUEUE_CAP = 12;
const DECODE_TIMEOUT_MS = 1500;
const GESTURE_EVENTS = ['pointerdown', 'mousedown', 'keydown', 'touchend', 'click'];

let ctx = null;
let master = null;
let muted = false;
let noiseBuffer = null;
let spinTimer = null;
let contextAllowed = false;
let gestureAt = -Infinity;
let gesturesBound = false;
const queue = [];

function nowMs() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function asArrayBuffer(bytes) {
  if (bytes instanceof ArrayBuffer) return bytes;
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function fourcc(view, offset) {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3)
  );
}

/**
 * Read a 16-bit PCM WAV. Returns one Float32Array per channel, interleaved
 * frames already split apart. Throws if the file is not that format.
 */
export function parsePcmWav(bytes) {
  const buffer = asArrayBuffer(bytes);
  const view = new DataView(buffer);
  if (view.byteLength < 12 || fourcc(view, 0) !== 'RIFF' || fourcc(view, 8) !== 'WAVE') {
    throw new Error('Not a WAV file');
  }

  let format = null;
  let dataOffset = -1;
  let dataSize = 0;
  let offset = 12;
  while (offset + 8 <= view.byteLength) {
    const id = fourcc(view, offset);
    const size = view.getUint32(offset + 4, true);
    const start = offset + 8;
    if (size < 0 || start + size > view.byteLength) break;
    if (id === 'fmt ') {
      if (size < 16) throw new Error('WAV fmt chunk is too short');
      format = {
        audioFormat: view.getUint16(start, true),
        channels: view.getUint16(start + 2, true),
        sampleRate: view.getUint32(start + 4, true),
        bitsPerSample: view.getUint16(start + 14, true),
      };
    } else if (id === 'data') {
      dataOffset = start;
      dataSize = size;
    }
    const next = start + size + (size % 2);
    if (next <= offset) break;
    offset = next;
  }

  if (!format || format.audioFormat !== 1 || format.bitsPerSample !== 16) {
    throw new Error('WAV is not 16-bit PCM');
  }
  if (format.channels < 1 || format.sampleRate < 1 || dataOffset < 0) {
    throw new Error('WAV is missing PCM data');
  }

  const channels = format.channels;
  const frames = Math.floor(dataSize / (channels * 2));
  const samples = Array.from({ length: channels }, () => new Float32Array(frames));
  for (let frame = 0; frame < frames; frame++) {
    for (let channel = 0; channel < channels; channel++) {
      const sample = view.getInt16(dataOffset + (frame * channels + channel) * 2, true);
      samples[channel][frame] = sample / 32768;
    }
  }
  return { sampleRate: format.sampleRate, channels, frames, samples };
}

function context() {
  if (ctx) return ctx;
  if (!contextAllowed || typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = 0.42;
  master.connect(ctx.destination);
  ctx.addEventListener('statechange', () => {
    if (ctx.state === 'running') {
      flushQueue();
      unbindUnlockGestures();
    } else {
      bindUnlockGestures();
    }
  });
  return ctx;
}

/** One silent sample started inside the gesture, which is what Safari requires. */
function prime(ac) {
  try {
    const buffer = ac.createBuffer(1, 1, ac.sampleRate);
    const source = ac.createBufferSource();
    source.buffer = buffer;
    source.connect(ac.destination);
    source.start();
  } catch {
    // resume() still runs when the buffer itself is refused.
  }
}

function enqueue(name) {
  if (nowMs() - gestureAt > GESTURE_QUEUE_MS) return;
  queue.push(name);
  if (queue.length > QUEUE_CAP) queue.shift();
}

function flushQueue() {
  if (!ready()) return;
  const pending = queue.splice(0, queue.length);
  for (const name of pending) playNow(name);
}

function onGesture() {
  unlockAudio();
}

export function bindUnlockGestures() {
  if (gesturesBound || typeof window === 'undefined') return;
  gesturesBound = true;
  for (const type of GESTURE_EVENTS) window.addEventListener(type, onGesture, true);
}

function unbindUnlockGestures() {
  if (!gesturesBound || typeof window === 'undefined') return;
  gesturesBound = false;
  for (const type of GESTURE_EVENTS) window.removeEventListener(type, onGesture, true);
}

/** Browsers hold audio until a real gesture; call this from a click handler. */
export function unlockAudio() {
  contextAllowed = true;
  gestureAt = nowMs();
  const ac = context();
  if (!ac) return;
  if (ac.state !== 'running') {
    prime(ac);
    const pending = ac.resume();
    if (pending && typeof pending.then === 'function') {
      pending.then(() => {
        if (ac.state === 'running') {
          flushQueue();
          unbindUnlockGestures();
        }
      }).catch(() => {});
    }
  } else {
    flushQueue();
    unbindUnlockGestures();
  }
  ensureSamples();
}

export function setMuted(value) {
  muted = !!value;
  if (muted) {
    queue.length = 0;
    stopSpin();
  }
}

export function isMuted() {
  return muted;
}

function ready() {
  if (muted || !ctx || ctx.state !== 'running') return null;
  return ctx;
}

/** Safari throws if an exponential ramp starts from an implicit 0. */
function rampDown(param, gain, decay, now) {
  const start = Math.max(gain, 0.0001);
  const end = now + Math.max(decay, 0.01);
  try {
    param.setValueAtTime(start, now);
    param.exponentialRampToValueAtTime(0.0001, end);
    return;
  } catch {
    // Fall through to a linear ramp.
  }
  try {
    param.cancelScheduledValues(now);
    param.setValueAtTime(start, now);
    param.linearRampToValueAtTime(0.0001, end);
  } catch {
    param.value = start;
  }
}

function noise() {
  const ac = context();
  if (!ac) return null;
  if (!noiseBuffer) {
    noiseBuffer = ac.createBuffer(1, ac.sampleRate * 0.6, ac.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const source = ac.createBufferSource();
  source.buffer = noiseBuffer;
  return source;
}

function struck(frequency, { decay = 0.9, gain = 0.5, partials = [1, 2.76, 5.4], type = 'sine' } = {}) {
  const ac = ready();
  if (!ac) return;
  const now = ac.currentTime;
  const bus = ac.createGain();
  rampDown(bus.gain, gain, decay, now);
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
  if (!source) return;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = frequency;
  filter.Q.value = q;
  const envelope = ac.createGain();
  rampDown(envelope.gain, gain, decay, now);
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
  rampDown(envelope.gain, gain, decay, now);
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
const loads = new Map();
let bumperAt = 0;

function sampleUrl(name) {
  return new URL(`../../assets/sounds/${name}.wav`, import.meta.url);
}

function audioBufferFromPcm(ac, bytes) {
  const pcm = parsePcmWav(bytes);
  const buffer = ac.createBuffer(pcm.channels, pcm.frames, pcm.sampleRate);
  pcm.samples.forEach((channel, index) => buffer.copyToChannel(channel, index));
  return buffer;
}

function decodeClip(ac, bytes) {
  const copy = bytes.slice(0);
  const decoded = Promise.resolve()
    .then(() => ac.decodeAudioData(copy))
    .catch(() => null);
  const expired = new Promise((resolve) => {
    setTimeout(() => resolve(null), DECODE_TIMEOUT_MS);
  });
  return Promise.race([decoded, expired]).then((buffer) => buffer || audioBufferFromPcm(ac, bytes));
}

function ensureSample(name) {
  if (buffers.has(name)) return Promise.resolve(buffers.get(name));
  const pending = loads.get(name);
  if (pending) return pending;
  const job = (async () => {
    const ac = context();
    if (!ac) return null;
    const response = await fetch(sampleUrl(name));
    if (!response.ok) throw new Error(`Missing sound ${name}`);
    const bytes = await response.arrayBuffer();
    const buffer = await decodeClip(ac, bytes);
    buffers.set(name, buffer);
    return buffer;
  })().then(
    (buffer) => {
      if (!buffer) loads.delete(name);
      return buffer;
    },
    () => {
      loads.delete(name);
      return null;
    }
  );
  loads.set(name, job);
  return job;
}

function ensureSamples() {
  if (!context()) return Promise.resolve();
  return Promise.all(SAMPLES.map((name) => ensureSample(name)));
}

function playSample(name) {
  const ac = ready();
  if (!ac) return;
  const buffer = buffers.get(name);
  if (!buffer) {
    ensureSample(name).then((decoded) => {
      if (decoded && !muted) playSample(name);
    });
    return;
  }
  try {
    const source = ac.createBufferSource();
    source.buffer = buffer;
    source.connect(master);
    source.start();
  } catch {
    // A refused buffer source should not escape into the frame loop.
  }
}

function playNow(name) {
  try {
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
  } catch {
    // A throw from Safari's audio params must not stop the animation loop.
  }
}

export function play(name) {
  if (muted) return;
  if (!ready()) {
    enqueue(name);
    return;
  }
  playNow(name);
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
  for (let index = queue.length - 1; index >= 0; index--) {
    if (queue[index] === 'fx_spinner') queue.splice(index, 1);
  }
}

export function hasVoice(name) {
  return name === 'bumper' || SAMPLES.includes(name) || Object.prototype.hasOwnProperty.call(VOICES, name);
}
