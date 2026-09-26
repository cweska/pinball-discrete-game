/**
 * Simulator.
 *
 * Gate outputs are relaxed in place, repeatedly, until nothing changes. That
 * single loop covers plain combinational chains and the cross-coupled NAND
 * latches of Act 4, and it gives us somewhere to notice a circuit that never
 * settles (a ring of inverters) instead of spinning forever.
 */

import { gateDef, OUT } from './gates.js';
import { pinKey } from './circuit.js';

export const MAX_PASSES = 64;

export function createState(fill = 0) {
  return { gateOut: new Map(), fill };
}

/**
 * @param {import('./circuit.js').Circuit} circuit
 * @param {Record<string, 0|1>} inputValues
 * @param {{gateOut: Map<string, 0|1>, fill: 0|1}} state carried between calls so latches remember
 */
export function settle(circuit, inputValues = {}, state = createState(), { maxPasses = MAX_PASSES } = {}) {
  const gates = circuit.gateList();
  const undriven = new Set();

  const sourceValue = (from) => {
    if (circuit.isInputTerminal(from.node)) {
      return inputValues[from.node] ? 1 : 0;
    }
    if (circuit.gates.has(from.node)) {
      const stored = state.gateOut.get(from.node);
      return stored === undefined ? state.fill : stored;
    }
    return undefined; // empty socket: the lead is there but nothing drives it
  };

  const pinInput = (nodeId, pin) => {
    const wire = circuit.wireInto({ node: nodeId, pin });
    if (!wire) {
      undriven.add(pinKey(nodeId, pin));
      return 0;
    }
    const value = sourceValue(wire.from);
    if (value === undefined) {
      undriven.add(pinKey(nodeId, pin));
      return 0;
    }
    return value;
  };

  let passes = 0;
  let oscillating = false;
  while (true) {
    undriven.clear();
    let changed = false;
    for (const gate of gates) {
      const def = gateDef(gate.type);
      const args = {};
      for (const pin of def.inputs) args[pin] = pinInput(gate.id, pin);
      const next = def.eval(args) ? 1 : 0;
      if (state.gateOut.get(gate.id) !== next) {
        state.gateOut.set(gate.id, next);
        changed = true;
      }
    }
    passes++;
    if (!changed) break;
    if (passes >= maxPasses) {
      oscillating = true;
      break;
    }
  }

  const pins = new Map();
  for (const terminal of circuit.inputs) {
    pins.set(pinKey(terminal.id, OUT), inputValues[terminal.id] ? 1 : 0);
  }
  for (const gate of gates) {
    pins.set(pinKey(gate.id, OUT), state.gateOut.get(gate.id) ?? state.fill);
  }

  const wires = new Map();
  for (const wire of circuit.wires) {
    const value = sourceValue(wire.from);
    wires.set(wire.id, { value: value === undefined ? 0 : value, driven: value !== undefined });
  }

  const outputs = {};
  const outputsDriven = {};
  for (const terminal of circuit.outputs) {
    const wire = circuit.wireInto({ node: terminal.id, pin: 'in' });
    const value = wire ? sourceValue(wire.from) : undefined;
    outputs[terminal.id] = value === undefined ? 0 : value;
    outputsDriven[terminal.id] = value !== undefined;
    if (value === undefined) undriven.add(pinKey(terminal.id, 'in'));
    pins.set(pinKey(terminal.id, 'in'), outputs[terminal.id]);
  }

  return {
    pins,
    wires,
    outputs,
    outputsDriven,
    undriven: [...undriven],
    oscillating,
    passes,
    state,
  };
}

/** One-shot evaluation from a clean slate. */
export function evaluate(circuit, inputValues, options) {
  return settle(circuit, inputValues, createState(options?.fill ?? 0), options);
}
