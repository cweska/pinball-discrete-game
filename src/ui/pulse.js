/**
 * Signal testing.
 *
 * The bench can walk every input combination on its own, or hold still on one
 * of them. Combinations are the full 2^n set (last input toggles fastest), the
 * same order the goal table uses. Repeat advances one combination at a time;
 * a hitch or a hidden tab does not skip ahead, because a stateful circuit only
 * sees the vector applied on each step.
 */

import { enumerateInputs } from '../engine/validator.js';

export const SIGNAL_STEP_MS = 1600;
const DOT_MS = 1300;

export function createPulse(level, { repeat = true } = {}) {
  const vectors = enumerateInputs(level.io.inputs.map((terminal) => terminal.id));
  let index = 0;
  let repeating = !!repeat;
  let heldSince = null;

  return {
    get vectors() {
      return vectors;
    },
    get index() {
      return index;
    },
    get repeat() {
      return repeating;
    },
    vector() {
      return { ...vectors[index] };
    },
    /** Move by one combination. Negative goes backwards. Wraps at both ends. */
    step(delta) {
      const count = vectors.length || 1;
      index = (index + delta) % count;
      if (index < 0) index += count;
      heldSince = null;
    },
    setRepeat(on) {
      repeating = !!on;
      heldSince = null;
    },
    /**
     * Advance while Repeat is on. `paused` freezes the dwell (the student is
     * holding the test controls) so releasing them does not skip a combination.
     */
    tick(now, { paused = false } = {}) {
      if (heldSince == null) heldSince = now;
      if (paused || !repeating) {
        heldSince = now;
        return;
      }
      if (now - heldSince >= SIGNAL_STEP_MS) {
        index = (index + 1) % vectors.length;
        heldSince = now;
      }
    },
    /** 0..1 position of the travelling dots. */
    dotPhase(time) {
      return (time % DOT_MS) / DOT_MS;
    },
  };
}
