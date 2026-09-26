/**
 * Free Play.
 *
 * A scripted ball runs the playfield and closes the same switches the test
 * controls do. Every circuit the student has finished is simulated at once, so
 * the machine plays itself using their logic. Features they have not wired stay
 * dark, which is the point.
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

/** Ball path. Each waypoint is where the ball goes next, how long it takes, and what it closes. */
const SCRIPT = [
  { x: 352, y: 660, ms: 600, event: 'reset' },
  { x: 352, y: 620, ms: 400, event: 'launch' },
  { x: 348, y: 300, ms: 800 },
  { x: 318, y: 132, ms: 500 },
  { x: 250, y: 74, ms: 420 },
  { x: 176, y: 62, ms: 380 },
  { x: 150, y: 74, ms: 260 },
  { x: 108, y: 140, ms: 420 },
  { x: 92, y: 168, ms: 260, event: 'upperBumper' },
  { x: 128, y: 196, ms: 300, event: 'upperBumper' },
  { x: 140, y: 240, ms: 340, event: 'target1' },
  { x: 176, y: 240, ms: 300, event: 'target2' },
  { x: 212, y: 240, ms: 300, event: 'target3' },
  { x: 268, y: 262, ms: 360 },
  { x: 308, y: 226, ms: 320, event: 'rampRight' },
  { x: 300, y: 320, ms: 460 },
  { x: 204, y: 348, ms: 420, event: 'popBumper' },
  { x: 176, y: 372, ms: 260, event: 'popBumper' },
  { x: 150, y: 400, ms: 300, event: 'popBumper' },
  { x: 96, y: 442, ms: 420, event: 'lock1' },
  { x: 108, y: 500, ms: 380 },
  { x: 96, y: 560, ms: 300, event: 'sling' },
  { x: 176, y: 606, ms: 420 },
  { x: 272, y: 632, ms: 360, event: 'rightFlipper' },
  { x: 296, y: 500, ms: 520, event: 'rampLeft' },
  { x: 200, y: 442, ms: 480, event: 'lock2' },
  { x: 304, y: 442, ms: 440, event: 'lock3' },
  { x: 304, y: 560, ms: 420, event: 'sling' },
  { x: 200, y: 620, ms: 420 },
  { x: 128, y: 632, ms: 320, event: 'leftFlipper' },
  { x: 108, y: 512, ms: 460 },
  { x: 176, y: 300, ms: 620 },
  { x: 176, y: 372, ms: 280, event: 'popBumper' },
  { x: 96, y: 520, ms: 520 },
  { x: 52, y: 618, ms: 420, event: 'outlane' },
  { x: 60, y: 480, ms: 460 },
  { x: 150, y: 600, ms: 520 },
  { x: 200, y: 686, ms: 460, event: 'drain' },
  { x: 200, y: 686, ms: 700, event: 'endOfBall' },
];

const PULSE_MS = 320;

export function createFreePlay({ machine, onEvent } = {}) {
  /** @type {Map<string, {level: object, circuit: object, state: object, inputs: object}>} */
  const runtimes = new Map();
  let running = false;
  let clock = 0;
  let index = 0;
  let legTime = 0;
  let position = { x: SCRIPT[0].x, y: SCRIPT[0].y };
  const pulses = [];

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

  function fire(eventName) {
    const targets = EVENT_INPUTS[eventName];
    if (!targets) return;
    for (const [levelId, inputId] of targets) {
      const runtime = runtimes.get(levelId);
      if (!runtime) continue;
      const terminal = runtime.level.io.inputs.find((t) => t.id === inputId);
      if (!terminal) continue;
      const rest = terminal.rest ? 1 : 0;
      runtime.inputs[inputId] = 1 - rest;
      pulses.push({ runtime, inputId, rest, until: clock + PULSE_MS });
    }
    onEvent?.(eventName);
  }

  function releasePulses() {
    for (let i = pulses.length - 1; i >= 0; i--) {
      if (clock >= pulses[i].until) {
        pulses[i].runtime.inputs[pulses[i].inputId] = pulses[i].rest;
        pulses.splice(i, 1);
      }
    }
  }

  function advance(deltaMs) {
    legTime += deltaMs;
    const from = index === 0 ? SCRIPT.at(-1) : SCRIPT[index - 1];
    const to = SCRIPT[index];
    const t = Math.min(1, legTime / to.ms);
    const eased = t < 0.5 ? 2 * t * t : 1 - (1 - t) ** 2 * 2;
    position = { x: from.x + (to.x - from.x) * eased, y: from.y + (to.y - from.y) * eased };
    if (t >= 1) {
      if (to.event) fire(to.event);
      legTime = 0;
      index = (index + 1) % SCRIPT.length;
    }
  }

  /** @returns {Map<string, {value: number}>} part values from every wired circuit */
  function evaluateAll() {
    const values = new Map();
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
      }
    }
    return values;
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
      running = true;
      clock = 0;
      index = 0;
      legTime = 0;
      machine.resetEdges();
      machine.showBall(true);
      machine.setScore(0);
      return runtimes.size;
    },
    stop() {
      running = false;
      machine.showBall(false);
      for (const pulse of pulses) pulse.runtime.inputs[pulse.inputId] = pulse.rest;
      pulses.length = 0;
    },
    tick(deltaMs) {
      if (!running) return;
      clock += deltaMs;
      releasePulses();
      advance(deltaMs);
      machine.moveBall(position.x, position.y);
      const values = evaluateAll();
      const states = new Map();
      for (const [partId, value] of values) states.set(partId, { value, live: true, target: false, driven: true });
      machine.applyState(states, { sound: true, scoring: true });
    },
  };
}
