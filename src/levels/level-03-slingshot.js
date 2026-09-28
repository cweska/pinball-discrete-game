export default {
  id: 'slingshot',
  act: 1,
  title: 'Slingshot',
  subtitle: 'Either input can be 1.',
  brief: {
    story: 'The right slingshot has two switches. The kicker behind them never moves.',
    goal: 'Kick the ball when it touches the upper switch or the lower switch.',
    note:
      'The coil should turn on if either switch is 1. It should also turn on if both switches are 1. It stays off only when both switches are 0.',
  },
  placement: 'slots',
  wiring: 'fixed',
  palette: [{ type: 'OR', count: 1 }],
  io: {
    inputs: [
      { id: 'bladeUpper', label: 'UPPER SWITCH', short: 'UP', rest: 0, note: 'hit = 1' },
      { id: 'bladeLower', label: 'LOWER SWITCH', short: 'LWR', rest: 0, note: 'hit = 1' },
    ],
    outputs: [{ id: 'slingCoil', label: 'SLINGSHOT COIL', short: 'COIL', note: 'on = 1' }],
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
    { kind: 'tap', input: 'bladeUpper', label: 'Tap upper switch' },
    { kind: 'tap', input: 'bladeLower', label: 'Tap lower switch' },
  ],
  hints: [
    'On the last level, both inputs had to be 1. Here, either input is enough.',
    'The upper switch alone should kick. The lower switch alone should kick. Both switches at once should still kick.',
    'Put the OR gate in the socket. OR outputs 1 when at least one input is 1.',
  ],
  teacher: {
    answer: 'One OR gate. The coil is 1 when either switch is 1. It is 0 only when both switches are 0.',
    nandgame: 'Or',
    vocab: ['OR', 'disjunction'],
  },
};
