import { test } from 'node:test';
import assert from 'node:assert/strict';

import { GATES, GATE_ORDER, gateDef } from '../src/engine/gates.js';
import { Circuit, applySolution, circuitFromLevel, parseEndpoint } from '../src/engine/circuit.js';
import { createState, evaluate, settle } from '../src/engine/simulate.js';
import { checkWiring, goalTable, normalizeRows, validate } from '../src/engine/validator.js';

test('gate truth tables', () => {
  const table = {
    NAND: [1, 1, 1, 0],
    AND: [0, 0, 0, 1],
    OR: [0, 1, 1, 1],
    XOR: [0, 1, 1, 0],
  };
  for (const [type, expected] of Object.entries(table)) {
    const def = gateDef(type);
    const got = [
      def.eval({ a: 0, b: 0 }),
      def.eval({ a: 0, b: 1 }),
      def.eval({ a: 1, b: 0 }),
      def.eval({ a: 1, b: 1 }),
    ];
    assert.deepEqual(got, expected, `${type} truth table`);
  }
  assert.equal(GATES.INV.eval({ a: 0 }), 1);
  assert.equal(GATES.INV.eval({ a: 1 }), 0);
  assert.deepEqual(GATE_ORDER.slice().sort(), Object.keys(GATES).sort());
});

test('endpoint parsing takes the right default pin per side', () => {
  assert.deepEqual(parseEndpoint('btn', 'from'), { node: 'btn', pin: 'out' });
  assert.deepEqual(parseEndpoint('coil', 'to'), { node: 'coil', pin: 'in' });
  assert.deepEqual(parseEndpoint('s1.b', 'to'), { node: 's1', pin: 'b' });
});

function twoInputCircuit(type) {
  const circuit = new Circuit({
    inputs: [{ id: 'x', label: 'X' }, { id: 'y', label: 'Y' }],
    outputs: [{ id: 'z', label: 'Z' }],
  });
  circuit.addGate({ id: 'g1', type });
  circuit.connect('x', 'g1.a');
  circuit.connect('y', 'g1.b');
  circuit.connect('g1.out', 'z');
  return circuit;
}

test('simulator evaluates a single gate', () => {
  const circuit = twoInputCircuit('AND');
  assert.equal(evaluate(circuit, { x: 1, y: 1 }).outputs.z, 1);
  assert.equal(evaluate(circuit, { x: 1, y: 0 }).outputs.z, 0);
});

test('simulator settles a chain regardless of gate insertion order', () => {
  const circuit = new Circuit({
    inputs: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    outputs: [{ id: 'out' }],
  });
  // Deliberately added output-end first so a single naive pass would be wrong.
  circuit.addGate({ id: 'last', type: 'AND' });
  circuit.addGate({ id: 'first', type: 'AND' });
  circuit.connect('a', 'first.a');
  circuit.connect('b', 'first.b');
  circuit.connect('first.out', 'last.a');
  circuit.connect('c', 'last.b');
  circuit.connect('last.out', 'out');

  assert.equal(evaluate(circuit, { a: 1, b: 1, c: 1 }).outputs.out, 1);
  assert.equal(evaluate(circuit, { a: 1, b: 0, c: 1 }).outputs.out, 0);
});

test('an empty socket reads as undriven rather than zero', () => {
  const level = {
    io: { inputs: [{ id: 'btn' }], outputs: [{ id: 'coil' }] },
    slots: [{ id: 's1', accepts: ['INV'] }],
    prewired: [['btn', 's1.a'], ['s1.out', 'coil']],
  };
  const circuit = circuitFromLevel(level);
  const result = evaluate(circuit, { btn: 1 });
  assert.equal(result.outputsDriven.coil, false);
  assert.ok(result.undriven.includes('coil.in'));

  circuit.addGate({ slot: 's1', type: 'INV' });
  const wired = evaluate(circuit, { btn: 1 });
  assert.equal(wired.outputsDriven.coil, true);
  assert.equal(wired.outputs.coil, 0);
});

test('removing a gate keeps the level wiring but drops student wires', () => {
  const level = {
    io: { inputs: [{ id: 'btn' }], outputs: [{ id: 'coil' }] },
    slots: [{ id: 's1', accepts: ['INV'] }],
    prewired: [['btn', 's1.a']],
  };
  const circuit = circuitFromLevel(level);
  circuit.addGate({ slot: 's1', type: 'INV' });
  circuit.connect('s1.out', 'coil');
  assert.equal(circuit.wires.length, 2);
  circuit.removeGate('s1');
  assert.equal(circuit.wires.length, 1);
  assert.equal(circuit.wires[0].fixed, true);
});

test('an input pin only keeps its most recent driver', () => {
  const circuit = twoInputCircuit('OR');
  circuit.addGate({ id: 'g2', type: 'INV' });
  circuit.connect('x', 'g2.a');
  circuit.connect('g2.out', 'g1.a');
  assert.equal(circuit.wiresFrom({ node: 'x', pin: 'out' }).length, 1);
  assert.equal(evaluate(circuit, { x: 0, y: 0 }).outputs.z, 1);
});

test('wires have to run from an output pin to an input pin', () => {
  const circuit = twoInputCircuit('AND');
  assert.equal(circuit.connect('g1.a', 'z').ok, false);
  assert.equal(circuit.connect('g1.out', 'g1.a').ok, false);
  assert.equal(circuit.connect('z', 'g1.a').ok, false);
});

function nandLatch() {
  const circuit = new Circuit({
    inputs: [{ id: 'setBar' }, { id: 'resetBar' }],
    outputs: [{ id: 'q' }, { id: 'qbar' }],
  });
  circuit.addGate({ id: 'n1', type: 'NAND' });
  circuit.addGate({ id: 'n2', type: 'NAND' });
  circuit.connect('setBar', 'n1.a');
  circuit.connect('n2.out', 'n1.b');
  circuit.connect('resetBar', 'n2.a');
  circuit.connect('n1.out', 'n2.b');
  circuit.connect('n1.out', 'q');
  circuit.connect('n2.out', 'qbar');
  return circuit;
}

test('a cross-coupled NAND latch sets, resets and holds', () => {
  const circuit = nandLatch();
  const state = createState(0);

  settle(circuit, { setBar: 1, resetBar: 0 }, state);
  assert.equal(settle(circuit, { setBar: 1, resetBar: 1 }, state).outputs.q, 0, 'holds low after reset');

  assert.equal(settle(circuit, { setBar: 0, resetBar: 1 }, state).outputs.q, 1, 'sets');
  const held = settle(circuit, { setBar: 1, resetBar: 1 }, state);
  assert.equal(held.outputs.q, 1, 'holds high after the set line lets go');
  assert.equal(held.outputs.qbar, 0, 'outputs stay complementary');
  assert.equal(held.oscillating, false);

  assert.equal(settle(circuit, { setBar: 1, resetBar: 0 }, state).outputs.q, 0, 'resets again');
});

test('a latch reaches the same state from either power-up seed', () => {
  for (const fill of [0, 1]) {
    const circuit = nandLatch();
    const state = createState(fill);
    settle(circuit, { setBar: 0, resetBar: 1 }, state);
    assert.equal(settle(circuit, { setBar: 1, resetBar: 1 }, state).outputs.q, 1);
  }
});

test('a ring of inverters is reported as never settling', () => {
  const circuit = new Circuit({ inputs: [], outputs: [{ id: 'out' }] });
  for (const id of ['i1', 'i2', 'i3']) circuit.addGate({ id, type: 'INV' });
  circuit.connect('i3.out', 'i1.a');
  circuit.connect('i1.out', 'i2.a');
  circuit.connect('i2.out', 'i3.a');
  circuit.connect('i1.out', 'out');
  const result = evaluate(circuit, {});
  assert.equal(result.oscillating, true);
});

test('validator rejects incomplete wiring with a readable message', () => {
  const level = {
    io: { inputs: [{ id: 'x', label: 'X' }], outputs: [{ id: 'z', label: 'Z LAMP' }] },
    palette: [{ type: 'INV', count: 1 }],
    spec: { kind: 'truthTable', rows: [[{ x: 0 }, { z: 1 }]] },
  };
  const circuit = new Circuit({ inputs: level.io.inputs, outputs: level.io.outputs });
  const empty = validate(level, circuit);
  assert.equal(empty.ok, false);
  assert.equal(empty.reason, 'incomplete');
  assert.match(empty.message, /Z LAMP/);

  circuit.addGate({ id: 'g1', type: 'INV' });
  circuit.connect('g1.out', 'z');
  const dangling = checkWiring(level, circuit);
  assert.equal(dangling.ok, false);
  assert.match(dangling.message, /input pin/);
});

test('an empty socket is reported as incomplete, not a wrong answer', () => {
  const level = {
    io: { inputs: [{ id: 'btn', label: 'BTN' }], outputs: [{ id: 'coil', label: 'COIL' }] },
    palette: [{ type: 'INV', count: 1 }],
    slots: [{ id: 's1', accepts: ['INV'] }],
    prewired: [
      ['btn', 's1.a'],
      ['s1.out', 'coil'],
    ],
    spec: { kind: 'truthTable', rows: [[{ btn: 0 }, { coil: 1 }]] },
  };
  const circuit = circuitFromLevel(level);
  const result = validate(level, circuit);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'incomplete');
  assert.match(result.message, /socket is empty/i);
});

test('validator reports the failing row for a wrong gate', () => {
  const level = {
    io: { inputs: [{ id: 'x', label: 'X' }, { id: 'y', label: 'Y' }], outputs: [{ id: 'z', label: 'Z' }] },
    palette: [{ type: 'AND', count: 1 }, { type: 'OR', count: 1 }],
    spec: { kind: 'truthTable', expect: ({ x, y }) => ({ z: x && y ? 1 : 0 }) },
  };
  assert.equal(validate(level, twoInputCircuit('AND')).ok, true);
  const wrong = validate(level, twoInputCircuit('OR'));
  assert.equal(wrong.ok, false);
  assert.equal(wrong.reason, 'mismatch');
  assert.match(wrong.message, /X=0, Y=1/);
});

test('validator refuses memory in a combinational level', () => {
  const level = {
    io: { inputs: [{ id: 'setBar', label: 'SET' }, { id: 'resetBar', label: 'RESET' }], outputs: [{ id: 'q', label: 'Q' }] },
    palette: [{ type: 'NAND', count: 2 }],
    spec: { kind: 'truthTable', expect: ({ setBar }) => ({ q: setBar ? 0 : 1 }) },
  };
  const circuit = nandLatch();
  circuit.outputs = circuit.outputs.filter((t) => t.id === 'q');
  const result = validate(level, circuit);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'unstable');
});

test('validator enforces the parts bin', () => {
  const level = {
    io: { inputs: [{ id: 'x' }, { id: 'y' }], outputs: [{ id: 'z' }] },
    palette: [{ type: 'AND', count: 1 }],
    spec: { kind: 'truthTable', expect: () => ({ z: 0 }) },
  };
  const tooMany = twoInputCircuit('AND');
  tooMany.addGate({ id: 'g2', type: 'AND' });
  assert.equal(validate(level, tooMany).reason, 'budget');
  assert.equal(validate(level, twoInputCircuit('XOR')).reason, 'budget');
});

test('normalizeRows expands an expect function over every input combination', () => {
  const rows = normalizeRows({ expect: ({ a, b }) => ({ z: a && b ? 1 : 0 }) }, ['a', 'b']);
  assert.equal(rows.length, 4);
  assert.deepEqual(rows.at(-1).out, { z: 1 });
});

test('goalTable is shaped for display', () => {
  const level = {
    io: { inputs: [{ id: 'a', label: 'A' }], outputs: [{ id: 'z', label: 'Z' }] },
    spec: { kind: 'truthTable', rows: [[{ a: 0 }, { z: 1 }], [{ a: 1 }, { z: 0 }]] },
  };
  const table = goalTable(level);
  assert.deepEqual(table.rows, [{ in: [0], out: [1] }, { in: [1], out: [0] }]);
  assert.equal(goalTable({ io: level.io, spec: { kind: 'sequence', scenarios: [] } }), null);
});
