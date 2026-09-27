/**
 * The demo clock.
 *
 * When nobody is pressing anything, the bench keeps cycling example signals so
 * the circuit is never a still picture. Combinational levels walk their truth
 * table; stateful levels walk the story in their first scenario, which is a far
 * better demonstration than random bits.
 */

import { normalizeRows } from '../engine/validator.js';

const VECTOR_MS = 1600;
const DOT_MS = 1300;

export function demoVectors(level) {
  if (level.demo) return level.demo;
  const inputIds = level.io.inputs.map((t) => t.id);
  const rest = {};
  for (const terminal of level.io.inputs) rest[terminal.id] = terminal.rest ? 1 : 0;

  if ((level.spec.kind || 'truthTable') === 'truthTable') {
    return normalizeRows(level.spec, inputIds).map((row) => {
      const vector = { ...rest };
      for (const id of inputIds) vector[id] = row.in[id] ? 1 : 0;
      return vector;
    });
  }

  const scenario = level.spec.scenarios[0];
  const running = { ...rest, ...(scenario.initial || {}) };
  const vectors = [{ ...running }];
  for (const step of scenario.steps) {
    Object.assign(running, step.set || {});
    vectors.push({ ...running, __note: step.note });
  }
  return vectors;
}

export function createPulse(level) {
  const vectors = demoVectors(level);
  return {
    vectors,
    /** Which example pattern is on the bench right now. */
    vectorAt(time) {
      const index = Math.floor(time / VECTOR_MS) % vectors.length;
      return { vector: vectors[index], index, note: vectors[index].__note || null };
    },
    /** 0..1 position of the travelling dots. */
    dotPhase(time) {
      return (time % DOT_MS) / DOT_MS;
    },
    /** 0..1 progress through the current pattern, for the little countdown bar. */
    vectorProgress(time) {
      return (time % VECTOR_MS) / VECTOR_MS;
    },
  };
}
