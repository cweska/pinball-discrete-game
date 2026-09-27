/**
 * Level validation.
 *
 * Combinational levels are swept exhaustively: every input combination is run
 * twice, once with gate memory seeded LOW and once HIGH, so a circuit only
 * passes if its answer depends on the inputs alone. Act 4's stateful levels are
 * driven through scripted input sequences instead, since holding a value is the
 * whole point there.
 */

import { gateDef, OUT } from './gates.js';
import { createState, settle } from './simulate.js';

/**
 * Every 0/1 combination of these inputs. The last input toggles fastest, so the
 * list reads like binary counting (and like the goal table).
 */
export function enumerateInputs(inputIds) {
  const bits = inputIds.length;
  const total = 1 << bits;
  const rows = [];
  for (let mask = 0; mask < total; mask++) {
    const inputs = {};
    inputIds.forEach((id, index) => {
      inputs[id] = (mask >> (bits - 1 - index)) & 1;
    });
    rows.push(inputs);
  }
  return rows;
}

export function normalizeRows(spec, inputIds) {
  if (spec.rows) {
    return spec.rows.map((row) =>
      Array.isArray(row) ? { in: row[0], out: row[1] } : { in: row.in, out: row.out }
    );
  }
  if (typeof spec.expect === 'function') {
    return enumerateInputs(inputIds).map((inputs) => ({ in: inputs, out: spec.expect(inputs) }));
  }
  throw new Error('A truthTable spec needs either rows or an expect function.');
}

function label(level, id) {
  const terminal =
    level.io.inputs.find((t) => t.id === id) || level.io.outputs.find((t) => t.id === id);
  return terminal ? terminal.label : id;
}

function describeInputs(level, inputs) {
  return Object.entries(inputs)
    .map(([id, value]) => `${label(level, id)}=${value}`)
    .join(', ');
}

/** Wiring problems worth reporting before we bother simulating. */
export function checkWiring(level, circuit) {
  for (const slot of circuit.slots || []) {
    if (!circuit.slotIsFree(slot.id)) continue;
    if (circuit.wiresFrom({ node: slot.id, pin: OUT }).length) {
      return {
        ok: false,
        reason: 'incomplete',
        message: 'The socket is empty. Drop a gate in first.',
        highlight: { node: slot.id },
      };
    }
  }
  for (const terminal of circuit.outputs) {
    if (!circuit.wireInto({ node: terminal.id, pin: 'in' })) {
      return { ok: false, reason: 'incomplete', message: `${terminal.label} has no wire running to it yet.` };
    }
  }
  for (const gate of circuit.gateList()) {
    for (const pin of gateDef(gate.type).inputs) {
      if (!circuit.wireInto({ node: gate.id, pin })) {
        return {
          ok: false,
          reason: 'incomplete',
          message: `The ${gateDef(gate.type).label} gate has an input pin with nothing wired to it.`,
          highlight: { node: gate.id, pin },
        };
      }
    }
  }
  return { ok: true };
}

export function checkBudget(level, circuit) {
  const counts = circuit.countByType();
  for (const entry of level.palette || []) {
    const used = counts[entry.type] || 0;
    if (entry.count != null && used > entry.count) {
      return {
        ok: false,
        reason: 'budget',
        message: `Only ${entry.count} ${gateDef(entry.type).label} gate${entry.count === 1 ? '' : 's'} available on this one.`,
      };
    }
  }
  const allowed = new Set((level.palette || []).map((entry) => entry.type));
  for (const gate of circuit.gateList()) {
    if (!gate.fixed && !allowed.has(gate.type)) {
      return { ok: false, reason: 'budget', message: `${gateDef(gate.type).label} is not in the parts bin for this build.` };
    }
  }
  return { ok: true };
}

function compare(expected, actual) {
  for (const [id, want] of Object.entries(expected)) {
    if ((actual[id] ? 1 : 0) !== (want ? 1 : 0)) return id;
  }
  return null;
}

function validateTruthTable(level, circuit) {
  const inputIds = level.io.inputs.map((t) => t.id);
  const rows = normalizeRows(level.spec, inputIds);

  for (const row of rows) {
    const inputs = {};
    for (const id of inputIds) inputs[id] = row.in[id] ? 1 : 0;

    // Run the same inputs from a LOW and a HIGH power-up, so an answer that
    // depends on history shows up as a disagreement rather than sneaking past.
    const runs = [0, 1].map((fill) => settle(circuit, inputs, createState(fill)));

    if (runs.some((run) => run.oscillating)) {
      return {
        ok: false,
        reason: 'oscillating',
        message: 'This circuit never settles down - a gate output is feeding back and flip-flopping forever.',
        detail: { inputs },
      };
    }
    if (compare(runs[0].outputs, runs[1].outputs)) {
      return {
        ok: false,
        reason: 'unstable',
        message:
          'This circuit remembers things it should not. The answer depends on what happened before instead of only on the inputs - look for an output wired back into its own chain.',
        detail: { inputs },
      };
    }
    const wrong = compare(row.out, runs[0].outputs);
    if (wrong) {
      return {
        ok: false,
        reason: 'mismatch',
        message: `With ${describeInputs(level, inputs)}, ${label(level, wrong)} should be ${row.out[wrong] ? 1 : 0} but your circuit says ${runs[0].outputs[wrong]}.`,
        detail: { inputs, expected: row.out, actual: runs[0].outputs, output: wrong },
      };
    }
  }
  return { ok: true, rows };
}

function validateSequence(level, circuit) {
  for (const scenario of level.spec.scenarios) {
    const state = createState(0);
    const inputs = {};
    for (const terminal of level.io.inputs) inputs[terminal.id] = scenario.initial?.[terminal.id] ? 1 : 0;

    for (const step of scenario.steps) {
      Object.assign(inputs, Object.fromEntries(Object.entries(step.set || {}).map(([k, v]) => [k, v ? 1 : 0])));
      const result = settle(circuit, inputs, state);
      if (result.oscillating) {
        return {
          ok: false,
          reason: 'oscillating',
          message: `While ${step.note || scenario.name}, the circuit never settled - something is flip-flopping forever.`,
          detail: { inputs, step: step.note, scenario: scenario.name },
        };
      }
      const wrong = step.expect ? compare(step.expect, result.outputs) : null;
      if (wrong) {
        return {
          ok: false,
          reason: 'mismatch',
          message: `${step.note ? `${step.note}: ` : ''}${label(level, wrong)} should be ${step.expect[wrong] ? 1 : 0} but your circuit says ${result.outputs[wrong]}.`,
          detail: {
            inputs: { ...inputs },
            expected: step.expect,
            actual: result.outputs,
            output: wrong,
            step: step.note,
            scenario: scenario.name,
          },
        };
      }
    }
  }
  return { ok: true };
}

/**
 * @returns {{ok: true}|{ok: false, reason: string, message: string, detail?: object}}
 */
export function validate(level, circuit) {
  const budget = checkBudget(level, circuit);
  if (!budget.ok) return budget;
  const wiring = checkWiring(level, circuit);
  if (!wiring.ok) return wiring;
  const kind = level.spec.kind || 'truthTable';
  if (kind === 'sequence') return validateSequence(level, circuit);
  return validateTruthTable(level, circuit);
}

/** The goal table shown in the level briefing. */
export function goalTable(level) {
  if ((level.spec.kind || 'truthTable') !== 'truthTable') return null;
  const inputIds = level.io.inputs.map((t) => t.id);
  const outputIds = level.io.outputs.map((t) => t.id);
  const rows = normalizeRows(level.spec, inputIds);
  return {
    inputs: level.io.inputs.map((t) => ({ id: t.id, label: t.short || t.label })),
    outputs: level.io.outputs.map((t) => ({ id: t.id, label: t.short || t.label })),
    rows: rows.map((row) => ({
      in: inputIds.map((id) => (row.in[id] ? 1 : 0)),
      out: outputIds.map((id) => (row.out[id] == null ? null : row.out[id] ? 1 : 0)),
    })),
  };
}
