export default {
  id: 'slingshot',
  act: 1,
  title: 'Slingshot',
  subtitle: 'Either one will do.',
  brief: {
    story:
      'The right slingshot has two long blade switches behind its rubber, one high and one low. A ball can brush either one. The kicker behind them has never moved.',
    goal: 'Kick the ball back when the ball touches either blade switch.',
  },
  placement: 'slots',
  wiring: 'fixed',
  palette: [{ type: 'OR', count: 1 }],
  io: {
    inputs: [
      { id: 'bladeUpper', label: 'UPPER BLADE', short: 'UP', rest: 0, note: 'touched = 1' },
      { id: 'bladeLower', label: 'LOWER BLADE', short: 'LOW', rest: 0, note: 'touched = 1' },
    ],
    outputs: [{ id: 'slingCoil', label: 'SLINGSHOT COIL', short: 'COIL' }],
  },
  slots: [{ id: 's1', x: 392, y: 220, accepts: ['OR'] }],
  prewired: [
    ['bladeUpper', 's1.a'],
    ['bladeLower', 's1.b'],
    ['s1.out', 'slingCoil'],
  ],
  spec: {
    kind: 'truthTable',
    expect: ({ bladeUpper, bladeLower }) => ({ slingCoil: bladeUpper || bladeLower ? 1 : 0 }),
  },
  reference: { gates: [{ slot: 's1', type: 'OR' }], wires: [] },
  machine: { bind: { slingCoil: 'slingshot.right' }, celebrate: 'slapBack' },
  testControls: [
    { kind: 'tap', input: 'bladeUpper', label: 'Hit: Upper Blade' },
    { kind: 'tap', input: 'bladeLower', label: 'Hit: Lower Blade' },
  ],
  hints: [
    'Last level needed both inputs to be 1. This one is the other way round.',
    'Upper blade on its own should kick. Lower blade on its own should kick. Both at once should still kick.',
    'The OR gate is the one that answers 1 when either input is 1. Drop it in the socket.',
  ],
  teacher: {
    answer: 'One OR. Only blade=0,0 leaves the coil off.',
    nandgame: 'Or',
    vocab: ['OR', 'disjunction'],
  },
};
