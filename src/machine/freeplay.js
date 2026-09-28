/**
 * Free Play.
 *
 * A scripted ball runs the playfield and closes the same switches the test
 * controls do. Every circuit the student has finished is simulated at once, so
 * the machine plays itself using their logic. Features they have not wired stay
 * dark, which is the point.
 *
 * Most switches pulse and release. A waypoint can hold an event until a later
 * waypoint releases it, which is how the GATE bank stays down through the
 * jackpot. Lock 3 starts a short two-ball multiball, then the game resets.
 */

import { circuitFromLevel } from '../engine/circuit.js';
import { createState, settle } from '../engine/simulate.js';
import { LEVELS } from '../levels/index.js';
import { loadBench } from '../state/progress.js';

/**
 * Machine events, and the level input each one closes. A single event can reach
 * several levels: the ball hitting a flipper is both a flipper coil and a lane
 * change request.
 */
export const EVENT_INPUTS = {
  launch: [['ball-saver', 'launch']],
  drain: [['ball-saver', 'drain']],
  endOfBall: [['ball-saver', 'endOfBall']],
  leftFlipper: [['flipper-live', 'btnLeft'], ['lane-change', 'btnLeft']],
  rightFlipper: [['tilt-guard', 'btnRight'], ['lane-change', 'btnRight']],
  popBumper: [['pop-bumper', 'skirt']],
  upperBumper: [['nand-only', 'skirt2']],
  sling: [['slingshot', 'bladeUpper'], ['slingshot', 'bladeLower']],
  target1: [['drop-targets', 't1']],
  target2: [['drop-targets', 't2']],
  target3: [['drop-targets', 't3']],
  target4: [['drop-targets', 't4']],
  rampLeft: [['mystery-award', 'rampLeft']],
  rampRight: [['mystery-award', 'rampRight']],
  outlane: [['kickback', 'outlane']],
  lock1: [['lock-one', 'lockSwitch'], ['multiball', 'lock1']],
  lock2: [['multiball', 'lock2']],
  lock3: [['multiball', 'lock3']],
  reset: [['lock-one', 'resetLine'], ['multiball', 'resetLine']],
};

/** Switches that simply sit closed while a game is running. */
export const STANDING = [
  ['kickback', 'armed', 1],
];

const OUTHOLE = { x: 200, y: 686 };
const PLUNGER = { x: 365, y: 660 };
const RELEASE = { x: 200, y: 476 };

/**
 * Ball path. Each waypoint is where the ball goes next, how long it takes, and
 * what it closes. `hold` keeps that switch closed. `release` lets those events
 * return to rest. `ease: 'kick'` leaves fast and slows at the end.
 */
const SCRIPT = [
  { x: PLUNGER.x, y: PLUNGER.y, ms: 600, event: 'reset' },
  { x: 365, y: 620, ms: 400, event: 'launch' },
  { x: 365, y: 300, ms: 800 },
  { x: 346, y: 132, ms: 500 },
  { x: 250, y: 74, ms: 420 },
  { x: 176, y: 62, ms: 380 },
  { x: 150, y: 74, ms: 260 },
  { x: 108, y: 140, ms: 420 },
  { x: 92, y: 168, ms: 260, event: 'upperBumper' },
  { x: 128, y: 196, ms: 300, event: 'upperBumper' },
  { x: 122, y: 248, ms: 340, event: 'target1', hold: true },
  { x: 158, y: 248, ms: 240, event: 'target2', hold: true },
  { x: 194, y: 248, ms: 240, event: 'target3', hold: true },
  { x: 230, y: 248, ms: 240, event: 'target4', hold: true },
  { x: 176, y: 300, ms: 380 },
  { x: 256, y: 300, ms: 320 },
  { x: 308, y: 226, ms: 340, hold: ['rampLeft', 'rampRight'] },
  { x: 308, y: 226, ms: 700 },
  {
    x: 240,
    y: 340,
    ms: 450,
    release: ['target1', 'target2', 'target3', 'target4', 'rampLeft', 'rampRight'],
  },
  { x: 204, y: 348, ms: 280, event: 'popBumper' },
  { x: 176, y: 372, ms: 260, event: 'popBumper' },
  { x: 150, y: 400, ms: 300, event: 'popBumper' },
  { x: 96, y: 442, ms: 420, event: 'lock1' },
  { x: 108, y: 500, ms: 380 },
  { x: 96, y: 560, ms: 300, event: 'sling' },
  { x: 176, y: 606, ms: 420 },
  { x: 272, y: 632, ms: 360, event: 'rightFlipper' },
  { x: 296, y: 500, ms: 520, event: 'rampLeft' },
  { x: 200, y: 442, ms: 480, event: 'lock2' },
  { x: 96, y: 520, ms: 420 },
  { x: 36, y: 618, ms: 400, event: 'outlane' },
  { x: 40, y: 120, ms: 280, ease: 'kick' },
  { x: 150, y: 74, ms: 220, ease: 'kick' },
  { x: 176, y: 200, ms: 400 },
  { x: 220, y: 360, ms: 420 },
  { x: 304, y: 442, ms: 440, event: 'lock3', multiball: true },
];

/** How long the two balls stay in play before they drain and the game resets. */
const MULTIBALL_MS = 8000;

const MULTIBALL_A = scalePath([
  { x: 304, y: 560, ms: 450, event: 'sling' },
  { x: 272, y: 632, ms: 400 },
  { x: 176, y: 400, ms: 520, event: 'popBumper' },
  { x: 96, y: 560, ms: 480, event: 'sling' },
  { x: 128, y: 632, ms: 400 },
  { x: 240, y: 460, ms: 520 },
  { x: 304, y: 560, ms: 450, event: 'sling' },
  { x: 200, y: 620, ms: 480 },
  { x: 128, y: 632, ms: 360 },
  { x: 160, y: 420, ms: 560, event: 'popBumper' },
  { x: 272, y: 632, ms: 520 },
  { x: 304, y: 540, ms: 400, event: 'sling' },
  { x: 180, y: 600, ms: 480 },
  { x: 128, y: 632, ms: 360 },
  { x: 220, y: 480, ms: 560 },
  { x: 200, y: 640, ms: 560 },
  { x: OUTHOLE.x, y: OUTHOLE.y, ms: 500 },
]);

const MULTIBALL_B = scalePath([
  { x: 200, y: 380, ms: 320 },
  { x: 110, y: 500, ms: 480 },
  { x: 128, y: 632, ms: 420 },
  { x: 260, y: 440, ms: 520 },
  { x: 304, y: 560, ms: 420, event: 'sling' },
  { x: 272, y: 632, ms: 400 },
  { x: 150, y: 460, ms: 500, event: 'popBumper' },
  { x: 96, y: 560, ms: 440, event: 'sling' },
  { x: 176, y: 632, ms: 420 },
  { x: 272, y: 580, ms: 460 },
  { x: 200, y: 480, ms: 480 },
  { x: 96, y: 600, ms: 500 },
  { x: 140, y: 632, ms: 400 },
  { x: 250, y: 520, ms: 520 },
  { x: 304, y: 620, ms: 460 },
  { x: 220, y: 632, ms: 400 },
  { x: OUTHOLE.x, y: OUTHOLE.y, ms: 860 },
]);

const PULSE_MS = 320;
const FLUTTER_EVERY = 200;
const FLUTTER_ON = 90;
const GATE_TARGETS = ['target.1', 'target.2', 'target.3', 'target.4'];

function easeAmount(t, kind) {
  if (kind === 'kick') return 1 - (1 - t) ** 3;
  return t < 0.5 ? 2 * t * t : 1 - (1 - t) ** 2 * 2;
}

/** Stretch a path so its legs add up to MULTIBALL_MS. */
function scalePath(path) {
  const total = path.reduce((sum, step) => sum + step.ms, 0);
  const scale = MULTIBALL_MS / total;
  const scaled = path.map((step) => ({ ...step, ms: Math.max(1, Math.round(step.ms * scale)) }));
  const drift = MULTIBALL_MS - scaled.reduce((sum, step) => sum + step.ms, 0);
  scaled[scaled.length - 1].ms += drift;
  return scaled;
}

export function createFreePlay({ machine, onEvent } = {}) {
  /** @type {Map<string, {level: object, circuit: object, state: object, inputs: object}>} */
  const runtimes = new Map();
  let running = false;
  let clock = 0;
  let phase = 'tour';
  let index = 0;
  let legTime = 0;
  let position = { ...PLUNGER };
  /** Where the current tour leg started, when it is not the previous waypoint. */
  let fromOverride = null;
  const pulses = [];
  const holds = [];
  const liveTargets = new Set();

  let ballA = null;
  let ballB = null;
  let flutterTime = 0;
  let flutterStep = 0;

  function buildRuntimes() {
    runtimes.clear();
    for (const level of LEVELS) {
      const bench = loadBench(level.id);
      if (!bench || !bench.gates?.length) continue;
      const circuit = circuitFromLevel(level);
      try {
        circuit.restore(bench);
      } catch {
        continue;
      }
      const inputs = {};
      for (const terminal of level.io.inputs) inputs[terminal.id] = terminal.rest ? 1 : 0;
      runtimes.set(level.id, { level, circuit, state: createState(0), inputs });
    }
    for (const [levelId, inputId, value] of STANDING) {
      const runtime = runtimes.get(levelId);
      if (runtime) runtime.inputs[inputId] = value;
    }
  }

  function dropPulse(runtime, inputId) {
    for (let i = pulses.length - 1; i >= 0; i--) {
      if (pulses[i].runtime === runtime && pulses[i].inputId === inputId) pulses.splice(i, 1);
    }
  }

  function assertInput(levelId, inputId, { hold = false, eventName = '', pulseMs = PULSE_MS } = {}) {
    const runtime = runtimes.get(levelId);
    if (!runtime) return;
    const terminal = runtime.level.io.inputs.find((t) => t.id === inputId);
    if (!terminal) return;
    const rest = terminal.rest ? 1 : 0;
    const already = holds.find((held) => held.runtime === runtime && held.inputId === inputId);
    runtime.inputs[inputId] = 1 - rest;
    if (hold) {
      dropPulse(runtime, inputId);
      if (!already) holds.push({ eventName, runtime, inputId, rest });
      return;
    }
    if (already) return;
    dropPulse(runtime, inputId);
    pulses.push({ runtime, inputId, rest, until: clock + pulseMs });
  }

  function fire(eventName, { hold = false, pulseMs = PULSE_MS, log = true } = {}) {
    const targets = EVENT_INPUTS[eventName];
    if (!targets) return;
    for (const [levelId, inputId] of targets) {
      assertInput(levelId, inputId, { hold, eventName, pulseMs });
    }
    if (log) onEvent?.(eventName);
  }

  function releaseEvents(names) {
    const wanted = new Set(names);
    for (let i = holds.length - 1; i >= 0; i--) {
      if (!wanted.has(holds[i].eventName)) continue;
      const held = holds[i];
      held.runtime.inputs[held.inputId] = held.rest;
      dropPulse(held.runtime, held.inputId);
      holds.splice(i, 1);
    }
  }

  function clearSignals() {
    for (const pulse of pulses) pulse.runtime.inputs[pulse.inputId] = pulse.rest;
    pulses.length = 0;
    for (const held of holds) held.runtime.inputs[held.inputId] = held.rest;
    holds.length = 0;
  }

  function releasePulses() {
    for (let i = pulses.length - 1; i >= 0; i--) {
      if (clock < pulses[i].until) continue;
      const held = holds.some(
        (item) => item.runtime === pulses[i].runtime && item.inputId === pulses[i].inputId
      );
      if (!held) pulses[i].runtime.inputs[pulses[i].inputId] = pulses[i].rest;
      pulses.splice(i, 1);
    }
  }

  function raiseTargets() {
    for (const id of GATE_TARGETS) machine.setTargetDown?.(id, false, { sound: false });
  }

  function arrive(step) {
    if (Array.isArray(step.hold)) {
      for (const name of step.hold) fire(name, { hold: true });
    } else if (step.event) {
      fire(step.event, { hold: step.hold === true });
    }
    if (step.release) releaseEvents(step.release);
  }

  function advanceTour(deltaMs) {
    legTime += deltaMs;
    const from = fromOverride || (index === 0 ? OUTHOLE : SCRIPT[index - 1]);
    const to = SCRIPT[index];
    const t = Math.min(1, legTime / to.ms);
    const eased = easeAmount(t, to.ease);
    position = { x: from.x + (to.x - from.x) * eased, y: from.y + (to.y - from.y) * eased };
    if (t < 1) return;
    arrive(to);
    legTime = 0;
    fromOverride = null;
    if (to.multiball) {
      beginMultiball(to);
      return;
    }
    index += 1;
  }

  function beginMultiball(at) {
    phase = 'multiball';
    ballA = { origin: { x: at.x, y: at.y }, x: at.x, y: at.y, index: 0, leg: 0, done: false };
    ballB = { origin: { ...RELEASE }, x: RELEASE.x, y: RELEASE.y, index: 0, leg: 0, done: false };
    flutterTime = 0;
    flutterStep = 0;
  }

  function stepPath(state, path, deltaMs) {
    if (state.done) return;
    state.leg += deltaMs;
    while (state.index < path.length) {
      const from = state.index === 0 ? state.origin : path[state.index - 1];
      const to = path[state.index];
      if (state.leg < to.ms) {
        const eased = easeAmount(state.leg / to.ms, to.ease);
        state.x = from.x + (to.x - from.x) * eased;
        state.y = from.y + (to.y - from.y) * eased;
        return;
      }
      state.leg -= to.ms;
      state.x = to.x;
      state.y = to.y;
      if (to.event) fire(to.event);
      state.index += 1;
    }
    state.leg = 0;
    state.done = true;
  }

  function flutterFlippers(deltaMs) {
    flutterTime += deltaMs;
    if (flutterTime < FLUTTER_EVERY) return;
    flutterTime -= FLUTTER_EVERY;
    const both = flutterStep % 5 === 4;
    const sides = both ? [0, 1] : [flutterStep % 2];
    flutterStep += 1;
    if (sides.includes(0)) assertInput('flipper-live', 'btnLeft', { pulseMs: FLUTTER_ON });
    if (sides.includes(1)) assertInput('tilt-guard', 'btnRight', { pulseMs: FLUTTER_ON });
  }

  function finishMultiball() {
    fire('endOfBall');
    fire('drain');
    fire('reset');
    machine.setScore?.(0);
    machine.resetEdges?.();
    phase = 'tour';
    index = 0;
    legTime = 0;
    fromOverride = { ...OUTHOLE };
    position = { ...OUTHOLE };
    ballA = null;
    ballB = null;
    flutterTime = 0;
  }

  function advanceMultiball(deltaMs) {
    stepPath(ballA, MULTIBALL_A, deltaMs);
    stepPath(ballB, MULTIBALL_B, deltaMs);
    if (ballA.done && ballB.done) finishMultiball();
    else flutterFlippers(deltaMs);
  }

  /** @returns {Map<string, {value: number}>} part values from every wired circuit */
  function evaluateAll() {
    const values = new Map();
    liveTargets.clear();
    for (const runtime of runtimes.values()) {
      const result = settle(runtime.circuit, runtime.inputs, runtime.state);
      for (const [outputId, parts] of Object.entries(runtime.level.machine.bind || {})) {
        const value = result.outputs[outputId] ? 1 : 0;
        for (const partId of Array.isArray(parts) ? parts : [parts]) {
          values.set(partId, Math.max(values.get(partId) || 0, value));
        }
      }
      for (const [inputId, partId] of Object.entries(runtime.level.machine.inputBind || {})) {
        values.set(partId, Math.max(values.get(partId) || 0, runtime.inputs[inputId] ? 1 : 0));
      }
      const targetInputs = runtime.level.machine.targetInputs || {};
      for (const [inputId, partId] of Object.entries(targetInputs)) {
        machine.setTargetDown(partId, runtime.inputs[inputId] === 1);
        liveTargets.add(partId);
      }
    }
    return values;
  }

  function paintBalls() {
    if (phase === 'multiball' && ballA && ballB) {
      machine.showBalls?.([
        { x: ballA.x, y: ballA.y },
        { x: ballB.x, y: ballB.y },
      ]);
      return;
    }
    machine.moveBall(position.x, position.y);
  }

  function apply(values) {
    const states = new Map();
    for (const [partId, value] of values) states.set(partId, { value, live: true, target: false, driven: true });
    for (const partId of liveTargets) {
      if (!states.has(partId)) states.set(partId, { value: 0, live: true, target: false, driven: true });
    }
    machine.applyState(states, { sound: true, scoring: true });
  }

  return {
    get running() {
      return running;
    },
    get wiredCount() {
      return runtimes.size;
    },
    start() {
      buildRuntimes();
      pulses.length = 0;
      holds.length = 0;
      running = true;
      clock = 0;
      phase = 'tour';
      index = 0;
      legTime = 0;
      position = { ...PLUNGER };
      fromOverride = { ...PLUNGER };
      ballA = null;
      ballB = null;
      flutterTime = 0;
      machine.resetEdges();
      machine.moveBall(position.x, position.y);
      machine.setScore(0);
      return runtimes.size;
    },
    stop() {
      running = false;
      phase = 'tour';
      clearSignals();
      ballA = null;
      ballB = null;
      raiseTargets();
      machine.showBall(false);
    },
    tick(deltaMs) {
      if (!running) return;
      clock += deltaMs;
      releasePulses();
      if (phase === 'multiball') advanceMultiball(deltaMs);
      else advanceTour(deltaMs);
      paintBalls();
      apply(evaluateAll());
    },
  };
}
