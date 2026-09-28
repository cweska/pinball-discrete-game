export default {
  id: 'bonus-multiplier',
  act: 3,
  title: 'Bonus Multiplier',
  subtitle: 'Light one lamp for each position.',
  brief: {
    story: 'A wheel under the playfield clicks ahead once for each lane a player collects. Three lamps should show where it stopped, but they stay off.',
    goal: 'Light 2X at position 01, 3X at position 10, and 4X at position 11. At 00, all three lamps stay off.',
    note:
      'P1 is the 2s place. P0 is the 1s place. Position 01 means P1 is 0 and P0 is 1. Each lamp needs its own AND gate. You will connect each position wire to more than one gate.',
  },
  placement: 'free',
  wiring: 'student',
  palette: [
    { type: 'INV', count: 2 },
    { type: 'AND', count: 3 },
  ],
  io: {
    inputs: [
      { id: 'p1', label: 'POSITION P1', short: 'P1', rest: 0, note: '2s place' },
      { id: 'p0', label: 'POSITION P0', short: 'P0', rest: 0, note: '1s place' },
    ],
    outputs: [
      { id: 'lamp2x', label: '2X LAMP', short: '2X', note: 'on = 1' },
      { id: 'lamp3x', label: '3X LAMP', short: '3X', note: 'on = 1' },
      { id: 'lamp4x', label: '4X LAMP', short: '4X', note: 'on = 1' },
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
    {
      kind: 'cycle',
      id: 'step',
      label: 'Next position',
      steps: [
        { p1: 0, p0: 0 },
        { p1: 0, p0: 1 },
        { p1: 1, p0: 0 },
        { p1: 1, p0: 1 },
      ],
    },
    { kind: 'toggle', input: 'p1', label: 'P1' },
    { kind: 'toggle', input: 'p0', label: 'P0' },
  ],
  hints: [
    'Do one lamp at a time. For 2X, write down P1 and P0. One of them is 1, and the other is 0.',
    '4X is the easy lamp: both digits are 1, so one AND gate is enough. 2X needs P0 = 1 and P1 = 0. 3X needs P1 = 1 and P0 = 0.',
    'Use one INVERT on P1 and one INVERT on P0. Then three AND gates: NOT P1 with P0 goes to 2X, P1 with NOT P0 goes to 3X, and P1 with P0 goes to 4X.',
  ],
  teacher: {
    answer: '2X is NOT P1 AND P0. 3X is P1 AND NOT P0. 4X is P1 AND P0. Invert each digit once, then use three AND gates.',
    nandgame: 'And / Invert (composition)',
    vocab: ['decoder', 'minterm', 'binary position'],
  },
};
