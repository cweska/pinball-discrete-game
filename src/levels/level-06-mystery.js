export default {
  id: 'mystery-award',
  act: 2,
  title: 'Mystery Award',
  subtitle: 'One gate for "different," one for "both."',
  brief: {
    story: 'Two ramps lead to the upper playfield. The mystery light and the gate wheel are both off.',
    goal: 'Light MYSTERY when exactly one ramp is made. Spin the gate wheel when both ramps are made.',
    note:
      'There are no sockets on this level. Drag gates onto the bench and connect every wire yourself. "Exactly one" means the two inputs are different: 1 and 0, or 0 and 1.',
  },
  placement: 'free',
  wiring: 'student',
  palette: [
    { type: 'XOR', count: 1 },
    { type: 'AND', count: 1 },
  ],
  io: {
    inputs: [
      { id: 'rampLeft', label: 'LEFT RAMP', short: 'LEFT', rest: 0, note: 'made = 1' },
      { id: 'rampRight', label: 'RIGHT RAMP', short: 'RIGHT', rest: 0, note: 'made = 1' },
    ],
    outputs: [
      { id: 'lampMystery', label: 'MYSTERY LAMP', short: 'MYST', note: 'on = 1' },
      { id: 'motorSpinner', label: 'GATE WHEEL', short: 'WHEEL', note: 'on = 1' },
    ],
  },
  slots: [],
  prewired: [],
  spec: {
    kind: 'truthTable',
    expect: ({ rampLeft, rampRight }) => ({
      lampMystery: rampLeft !== rampRight ? 1 : 0,
      motorSpinner: rampLeft && rampRight ? 1 : 0,
    }),
  },
  reference: {
    gates: [
      { id: 'g1', type: 'XOR', x: 380, y: 170 },
      { id: 'g2', type: 'AND', x: 380, y: 270 },
    ],
    wires: [
      ['rampLeft', 'g1.a'],
      ['rampRight', 'g1.b'],
      ['rampLeft', 'g2.a'],
      ['rampRight', 'g2.b'],
      ['g1.out', 'lampMystery'],
      ['g2.out', 'motorSpinner'],
    ],
  },
  machine: { bind: { lampMystery: 'lamp.mystery', motorSpinner: 'toy.spinner' }, celebrate: 'spinUp' },
  testControls: [
    { kind: 'toggle', input: 'rampLeft', label: 'Left ramp' },
    { kind: 'toggle', input: 'rampRight', label: 'Right ramp' },
  ],
  hints: [
    'Look at the two outputs separately. MYSTERY is on when the ramps are different. The wheel is on when both ramps are 1.',
    'XOR outputs 1 only when its two inputs are different. Use XOR for the mystery lamp. Use AND for the wheel. AND is the same "both must be 1" rule as the pop bumper.',
    'Connect both ramp inputs to the XOR gate, and both ramp inputs to the AND gate. Then connect XOR to MYSTERY LAMP and AND to GATE WHEEL.',
  ],
  teacher: {
    answer:
      'XOR of the two ramps goes to the mystery lamp. AND of the two ramps goes to the gate wheel. Both ramp wires connect to both gates.',
    nandgame: 'Xor',
    vocab: ['exclusive or', 'fan-out'],
  },
};
