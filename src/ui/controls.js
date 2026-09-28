/**
 * Test controls.
 *
 * These drive the real input terminals, so the machine does whatever the
 * student's circuit actually says - including nothing. Hold buttons stay down
 * while pressed, taps fire a short pulse like a real switch closure, toggles
 * latch, and a cycle control steps a stepper unit round its positions.
 */

import { clear, h, setClass } from '../util/dom.js';

const TAP_MS = 300;
const LIVE_TAIL_MS = 2600;

export function createTestControls(root, { onChange, onSound } = {}) {
  let level = null;
  let values = {};
  let rest = {};
  let liveUntil = 0;
  const buttons = [];
  const timers = new Set();
  let cycleIndex = new Map();

  function changed() {
    liveUntil = performance.now() + LIVE_TAIL_MS;
    onChange?.({ ...values });
    paint();
  }

  function set(inputId, value) {
    values[inputId] = value ? 1 : 0;
    changed();
  }

  function paint() {
    for (const button of buttons) {
      if (button.control.kind === 'toggle') {
        const on = values[button.control.input] !== rest[button.control.input];
        setClass(button.el, 'is-on', on);
        button.el.setAttribute('aria-pressed', on ? 'true' : 'false');
        button.state.textContent = on ? 'ON' : 'OFF';
      } else if (button.control.kind === 'cycle') {
        const index = cycleIndex.get(button.control.id) || 0;
        const step = button.control.steps[index];
        button.state.textContent = Object.entries(step)
          .map(([id, value]) => `${idShort(id)}${value}`)
          .join(' ');
      } else {
        const down = values[button.control.input] !== rest[button.control.input];
        setClass(button.el, 'is-on', down);
      }
    }
  }

  function idShort(id) {
    const terminal = level.io.inputs.find((t) => t.id === id);
    return terminal ? `${terminal.short || terminal.label}=` : `${id}=`;
  }

  function build(control) {
    const pressed = control.input != null ? 1 - rest[control.input] : null;
    const state = h('span', { class: 'tc__state', text: '' });
    const el = h(
      'button',
      { class: `tc tc--${control.kind}`, type: 'button' },
      h('span', { class: 'tc__label', text: control.label }),
      state
    );

    if (control.kind === 'hold') {
      const down = (event) => {
        event.preventDefault();
        el.setPointerCapture?.(event.pointerId);
        onSound?.('relay');
        set(control.input, pressed);
      };
      const up = () => set(control.input, rest[control.input]);
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('pointerleave', (event) => {
        if (event.buttons) up();
      });
      el.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          set(control.input, pressed);
        }
      });
      el.addEventListener('keyup', (event) => {
        if (event.key === 'Enter' || event.key === ' ') up();
      });
      el.title = 'Press and hold';
    } else if (control.kind === 'tap') {
      el.addEventListener('click', () => {
        onSound?.('relay');
        set(control.input, pressed);
        const timer = setTimeout(() => {
          timers.delete(timer);
          set(control.input, rest[control.input]);
        }, TAP_MS);
        timers.add(timer);
      });
      el.title = 'Tap once';
    } else if (control.kind === 'toggle') {
      el.addEventListener('click', () => {
        onSound?.('relay');
        const on = values[control.input] !== rest[control.input];
        set(control.input, on ? rest[control.input] : pressed);
      });
      el.setAttribute('aria-pressed', 'false');
      el.title = 'Click to turn it on or off. It stays that way.';
    } else if (control.kind === 'cycle') {
      cycleIndex.set(control.id, 0);
      el.addEventListener('click', () => {
        onSound?.('relay');
        const next = ((cycleIndex.get(control.id) || 0) + 1) % control.steps.length;
        cycleIndex.set(control.id, next);
        Object.assign(values, control.steps[next]);
        changed();
      });
      el.title = 'Click to go to the next position.';
    }

    buttons.push({ el, control, state });
    return el;
  }

  return {
    setLevel(nextLevel) {
      level = nextLevel;
      buttons.length = 0;
      cycleIndex = new Map();
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
      rest = {};
      values = {};
      for (const terminal of level.io.inputs) {
        rest[terminal.id] = terminal.rest ? 1 : 0;
        values[terminal.id] = rest[terminal.id];
      }
      liveUntil = 0;
      clear(root);
      root.append(
        h('h3', { class: 'panel__title', text: 'Test buttons' }),
        h('p', { class: 'panel__note', text: 'These are the machine\'s switches. The machine does only what your circuit says.' }),
        h('div', { class: 'tc-grid' }, level.testControls.map(build))
      );
      paint();
      onChange?.({ ...values });
    },
    get values() {
      return { ...values };
    },
    /** True while the student is driving the machine, which suspends signal testing. */
    isLive(now = performance.now()) {
      if (now < liveUntil) return true;
      return level.io.inputs.some((terminal) => values[terminal.id] !== rest[terminal.id]);
    },
    /**
     * Put every switch back at rest without counting as a student action, so a
     * Signal Testing step is what the bench shows.
     */
    release() {
      values = { ...rest };
      for (const id of cycleIndex.keys()) cycleIndex.set(id, 0);
      liveUntil = 0;
      onChange?.({ ...values });
      paint();
    },
    reset() {
      values = { ...rest };
      for (const id of cycleIndex.keys()) cycleIndex.set(id, 0);
      liveUntil = 0;
      changed();
    },
    /** Put the switches into a given combination - used to replay a failing case. */
    applyVector(vector) {
      values = { ...rest, ...vector };
      liveUntil = performance.now() + 8000;
      onChange?.({ ...values });
      paint();
    },
  };
}
