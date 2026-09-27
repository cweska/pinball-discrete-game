import { test } from 'node:test';
import assert from 'node:assert/strict';

import { enumerateInputs } from '../src/engine/validator.js';
import { createPulse, SIGNAL_STEP_MS } from '../src/ui/pulse.js';

test('enumerateInputs counts in binary with the last input fastest', () => {
  assert.deepEqual(enumerateInputs(['a', 'b']), [
    { a: 0, b: 0 },
    { a: 0, b: 1 },
    { a: 1, b: 0 },
    { a: 1, b: 1 },
  ]);
  assert.deepEqual(enumerateInputs([]), [{}]);
});

test('signal testing steps backwards and forwards through every combination', () => {
  const level = {
    io: {
      inputs: [
        { id: 't1' },
        { id: 't2' },
        { id: 't3' },
      ],
    },
  };
  const pulse = createPulse(level, { repeat: false });
  assert.equal(pulse.vectors.length, 8);
  assert.deepEqual(pulse.vector(), { t1: 0, t2: 0, t3: 0 });

  pulse.step(1);
  assert.deepEqual(pulse.vector(), { t1: 0, t2: 0, t3: 1 });
  pulse.step(-1);
  assert.equal(pulse.index, 0);
  pulse.step(-1);
  assert.equal(pulse.index, 7);
  assert.deepEqual(pulse.vector(), { t1: 1, t2: 1, t3: 1 });
  pulse.step(1);
  assert.equal(pulse.index, 0);
});

test('repeat walks one combination per interval and pauses without skipping', () => {
  const level = { io: { inputs: [{ id: 'btn' }] } };
  const pulse = createPulse(level, { repeat: true });
  pulse.tick(1000);
  assert.equal(pulse.index, 0);
  pulse.tick(1000 + SIGNAL_STEP_MS - 1);
  assert.equal(pulse.index, 0);
  pulse.tick(1000 + SIGNAL_STEP_MS);
  assert.equal(pulse.index, 1);
  pulse.tick(1000 + SIGNAL_STEP_MS * 2);
  assert.equal(pulse.index, 0);

  const parked = 5000;
  pulse.tick(parked);
  pulse.tick(parked + 20_000, { paused: true });
  assert.equal(pulse.index, 0, 'a held test control does not advance the cycle');
  pulse.tick(parked + 20_000 + SIGNAL_STEP_MS - 1);
  assert.equal(pulse.index, 0, 'releasing the controls starts a fresh dwell');
  pulse.tick(parked + 20_000 + SIGNAL_STEP_MS);
  assert.equal(pulse.index, 1);

  pulse.setRepeat(false);
  pulse.tick(parked + 20_000 + SIGNAL_STEP_MS * 4);
  assert.equal(pulse.index, 1, 'repeat off holds the current combination');
});

test('a long gap advances a single combination', () => {
  const pulse = createPulse({ io: { inputs: [{ id: 'a' }, { id: 'b' }] } });
  pulse.tick(0);
  pulse.tick(SIGNAL_STEP_MS * 5);
  assert.equal(pulse.index, 1);
});
