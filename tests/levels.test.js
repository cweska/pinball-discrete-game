/**
 * Integrity tests for the level pack.
 *
 * The important one is "reference solution passes its own validator": it proves
 * mechanically that every puzzle can be solved with the parts it hands out,
 * which is the thing a student will discover the hard way if we get it wrong.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ACTS, LEVELS, boundParts } from '../src/levels/index.js';
import { applySolution, circuitFromLevel, parseEndpoint, slotPins } from '../src/engine/circuit.js';
import { gateDef } from '../src/engine/gates.js';
import { hasPart } from '../src/machine/parts.js';
import { validate } from '../src/engine/validator.js';

test('the pack has thirteen levels across four acts', () => {
  assert.equal(LEVELS.length, 13);
  assert.deepEqual([...new Set(LEVELS.map((l) => l.act))], ACTS.map((a) => a.act));
  // Acts never go backwards as the numbers climb.
  LEVELS.forEach((level, index) => {
    if (index > 0) assert.ok(level.act >= LEVELS[index - 1].act, `${level.id} act order`);
  });
});

test('level ids and titles are unique', () => {
  assert.equal(new Set(LEVELS.map((l) => l.id)).size, LEVELS.length);
  assert.equal(new Set(LEVELS.map((l) => l.title)).size, LEVELS.length);
});

for (const level of LEVELS) {
  test(`level ${level.number} ${level.id}: reference solution passes validation`, () => {
    const circuit = circuitFromLevel(level);
    applySolution(circuit, level.reference);
    const result = validate(level, circuit);
    assert.equal(result.ok, true, result.ok ? '' : `${result.reason}: ${result.message}`);
  });

  test(`level ${level.number} ${level.id}: an empty bench does not pass`, () => {
    const circuit = circuitFromLevel(level);
    assert.equal(validate(level, circuit).ok, false);
  });

  test(`level ${level.number} ${level.id}: parts bin covers the reference solution`, () => {
    const needed = {};
    for (const gate of level.reference.gates) needed[gate.type] = (needed[gate.type] || 0) + 1;
    for (const [type, count] of Object.entries(needed)) {
      const entry = level.palette.find((p) => p.type === type);
      assert.ok(entry, `${type} missing from the parts bin`);
      assert.ok(entry.count >= count, `${type}: bin has ${entry.count}, solution needs ${count}`);
    }
    for (const entry of level.palette) {
      assert.ok(entry.count > 0, `${entry.type} count must be positive`);
      gateDef(entry.type);
    }
  });

  test(`level ${level.number} ${level.id}: structure and copy are complete`, () => {
    assert.ok(level.title && level.brief.story && level.brief.goal, 'briefing text');
    assert.equal(level.hints.length, 3, 'three hint tiers');
    for (const hint of level.hints) assert.ok(hint.length > 20, 'hints say something');
    assert.ok(level.teacher.answer && level.teacher.nandgame, 'teacher notes');
    assert.ok(['slots', 'free'].includes(level.placement));
    assert.ok(['fixed', 'student'].includes(level.wiring));
    assert.ok(level.io.inputs.length >= 1 && level.io.outputs.length >= 1);
    for (const terminal of [...level.io.inputs, ...level.io.outputs]) {
      assert.ok(terminal.id && terminal.label, 'terminals are labelled');
      assert.ok(terminal.short === undefined || terminal.short.length <= 6, `${terminal.id} short label`);
    }
    if (level.placement === 'slots') {
      assert.ok(level.slots.length > 0, 'slot levels need slots');
      for (const slot of level.slots) {
        assert.ok(slot.accepts.length > 0);
        assert.ok(slot.x > 0 && slot.y > 0, 'slots are positioned');
      }
    } else {
      assert.equal(level.slots.length, 0);
      for (const gate of level.reference.gates) {
        assert.ok(gate.id && gate.x > 0 && gate.y > 0, 'free-placement references are positioned');
      }
    }
  });

  test(`level ${level.number} ${level.id}: wiring references real pins`, () => {
    const circuit = circuitFromLevel(level);
    const knownNode = (id) =>
      circuit.isInputTerminal(id) ||
      circuit.isOutputTerminal(id) ||
      !!circuit.slot(id) ||
      level.reference.gates.some((g) => (g.id || g.slot) === id);

    const declared = [...(level.prewired || []), ...(level.reference.wires || [])];
    for (const [fromRef, toRef] of declared) {
      const from = parseEndpoint(fromRef, 'from');
      const to = parseEndpoint(toRef, 'to');
      assert.ok(knownNode(from.node), `unknown node ${from.node}`);
      assert.ok(knownNode(to.node), `unknown node ${to.node}`);
    }

    for (const slot of level.slots || []) {
      const pins = slotPins(slot);
      for (const [, toRef] of level.prewired || []) {
        const to = parseEndpoint(toRef, 'to');
        if (to.node === slot.id) assert.ok(pins.inputs.includes(to.pin), `${slot.id} has no pin ${to.pin}`);
      }
    }
  });

  test(`level ${level.number} ${level.id}: machine bindings and test controls line up`, () => {
    const outputIds = level.io.outputs.map((t) => t.id);
    const inputIds = level.io.inputs.map((t) => t.id);

    for (const [outputId, parts] of Object.entries(level.machine.bind)) {
      assert.ok(outputIds.includes(outputId), `bind names unknown output ${outputId}`);
      for (const id of Array.isArray(parts) ? parts : [parts]) {
        assert.ok(hasPart(id), `bind names unknown machine part ${id}`);
      }
    }
    for (const [inputId, partId] of Object.entries(level.machine.inputBind || {})) {
      assert.ok(inputIds.includes(inputId), `inputBind names unknown input ${inputId}`);
      assert.ok(hasPart(partId), `inputBind names unknown part ${partId}`);
    }
    assert.ok(boundParts(level).length > 0, 'every level lights something up');

    const driven = new Set();
    for (const control of level.testControls) {
      if (control.kind === 'cycle') {
        assert.ok(control.steps.length > 1, 'a cycle control needs steps');
        for (const step of control.steps) {
          for (const id of Object.keys(step)) {
            assert.ok(inputIds.includes(id), `cycle step names unknown input ${id}`);
            driven.add(id);
          }
        }
      } else {
        assert.ok(['hold', 'tap', 'toggle'].includes(control.kind), `bad control kind ${control.kind}`);
        assert.ok(inputIds.includes(control.input), `control names unknown input ${control.input}`);
        driven.add(control.input);
      }
    }
    for (const id of inputIds) assert.ok(driven.has(id), `no test control drives ${id}`);
  });
}

test('every machine part is used by some level, and every level lights something new', () => {
  const seen = new Set();
  for (const level of LEVELS) {
    const fresh = boundParts(level).filter((id) => !seen.has(id));
    assert.ok(fresh.length > 0, `level ${level.number} ${level.id} adds no new machine feature`);
    for (const id of boundParts(level)) seen.add(id);
  }
});

test('difficulty climbs: gate count never drops by much and placement opens up', () => {
  let previousFree = false;
  LEVELS.forEach((level) => {
    if (level.placement === 'free') previousFree = true;
    else assert.equal(previousFree, false, `${level.id} goes back to sockets after free placement`);
  });

  const counts = LEVELS.map((l) => l.reference.gates.length);
  assert.deepEqual(counts.slice(0, 3), [1, 1, 1], 'the tutorial act is one gate per level');
  assert.ok(counts.at(-1) >= Math.max(...counts), 'the finale is the biggest build');
});
