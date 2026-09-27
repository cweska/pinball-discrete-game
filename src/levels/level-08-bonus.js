export default {
  id: 'bonus-multiplier',
  act: 3,
  title: 'Bonus Multiplier',
  subtitle: 'One lamp at a time.',
  brief: {
    story:
      'Under the playfield sits a stepper unit: a little motor-driven wheel that clicks round one notch each time you collect a lane. Two switches read its position as a two-digit binary number. Three lamps on the playfield are waiting to be told which position that is.',
    goal: 'Light 2X at position 01, 3X at position 10, 4X at position 11. At 00 all three stay dark.',
    note: 'P1 is the twos digit, P0 is the ones digit. Each lamp gets its own gate, and both position lines will need to feed several gates at once.',
  },
  placement: 'free',
  wiring: 'student',
  palette: [
    { type: 'INV', count: 2 },
    { type: 'AND', count: 3 },
  ],
  io: {
    inputs: [
      { id: 'p1', label: 'STEPPER P1', short: 'P1', rest: 0, note: 'twos digit' },
      { id: 'p0', label: 'STEPPER P0', short: 'P0', rest: 0, note: 'ones digit' },
    ],
    outputs: [
      { id: 'lamp2x', label: '2X LAMP', short: '2X' },
      { id: 'lamp3x', label: '3X LAMP', short: '3X' },
      { id: 'lamp4x', label: '4X LAMP', short: '4X' },
    ],
  },
  slots: [],
  prewired: [],
  spec: {
    kind: 'truthTable',
    expect: ({ p1, p0 }) => ({
      lamp2x: !p1 && p0 ? 1 : 0,
      lamp3x: p1 && !p0 ? 1 : 0,
      lamp4x: p1 && p0 ? 1 : 0,
    }),
  },
  reference: {
    gates: [
      { id: 'g1', type: 'INV', x: 290, y: 120 },
      { id: 'g2', type: 'INV', x: 290, y: 320 },
      { id: 'g3', type: 'AND', x: 470, y: 130 },
      { id: 'g4', type: 'AND', x: 470, y: 230 },
      { id: 'g5', type: 'AND', x: 470, y: 330 },
    ],
    wires: [
      ['p1', 'g1.a'],
      ['p0', 'g2.a'],
      ['g1.out', 'g3.a'],
      ['p0', 'g3.b'],
      ['p1', 'g4.a'],
      ['g2.out', 'g4.b'],
      ['p1', 'g5.a'],
      ['p0', 'g5.b'],
      ['g3.out', 'lamp2x'],
      ['g4.out', 'lamp3x'],
      ['g5.out', 'lamp4x'],
    ],
  },
  machine: {
    bind: { lamp2x: 'lamp.bonus2x', lamp3x: 'lamp.bonus3x', lamp4x: 'lamp.bonus4x' },
    celebrate: 'bonusSweep',
  },
  testControls: [
    { kind: 'cycle', id: 'step', label: 'Click the stepper on', steps: [
      { p1: 0, p0: 0 },
      { p1: 0, p0: 1 },
      { p1: 1, p0: 0 },
      { p1: 1, p0: 1 },
    ] },
    { kind: 'toggle', input: 'p1', label: 'P1' },
    { kind: 'toggle', input: 'p0', label: 'P0' },
  ],
  hints: [
    'Take one lamp at a time. For 2X, write down what P1 and P0 are doing: one of them is 1, the other is 0.',
    '4X is the easy one - both digits are 1. For 2X you need "P0 is 1 and P1 is NOT", and 3X is that idea mirrored.',
    'Invert P1 and invert P0 once each, then feed the three ANDs: (NOT P1, P0) for 2X, (P1, NOT P0) for 3X, (P1, P0) for 4X.',
  ],
  teacher: {
    answer: '2X = NOT P1 AND P0; 3X = P1 AND NOT P0; 4X = P1 AND P0. A 1-of-n decoder built from minterms.',
    nandgame: 'And / Invert (composition)',
    vocab: ['decoder', 'minterm', 'binary position'],
  },
};
