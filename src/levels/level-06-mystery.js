export default {
  id: 'mystery-award',
  act: 2,
  title: 'Mystery Award',
  subtitle: 'Exactly one.',
  brief: {
    story:
      'Two wireform ramps feed the upper playfield. Make just one of them and the MYSTERY lamp is supposed to pulse - the award only exists for players who leave the other ramp alone. Make both and the gate wheel toy spins instead.',
    goal: 'MYSTERY lights when exactly one ramp is made. The gate wheel spins when both are.',
    note: 'No sockets from here on. Drag gates anywhere on the bench and wire every connection yourself.',
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
      { id: 'lampMystery', label: 'MYSTERY LAMP', short: 'MYST' },
      { id: 'motorSpinner', label: 'GATE WHEEL MOTOR', short: 'WHEEL' },
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
    { kind: 'toggle', input: 'rampLeft', label: 'Left ramp made' },
    { kind: 'toggle', input: 'rampRight', label: 'Right ramp made' },
  ],
  hints: [
    '"Exactly one" means the two ramps disagree. Which gate in the bin answers 1 only when its inputs are different?',
    'XOR handles the mystery lamp. The gate wheel is the plain "both of them" question you already solved on the pop bumper.',
    'Both ramp terminals feed both gates: left and right into XOR, left and right into AND. Four wires in, two wires out.',
  ],
  teacher: {
    answer: 'lampMystery = XOR(left, right); motorSpinner = AND(left, right). Both inputs fan out to two gates.',
    nandgame: 'Xor',
    vocab: ['exclusive or', 'fan-out'],
  },
};
