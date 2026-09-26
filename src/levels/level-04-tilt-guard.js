export default {
  id: 'tilt-guard',
  act: 2,
  title: 'Tilt Guard',
  subtitle: 'Two sockets. Pick carefully.',
  brief: {
    story:
      'Players shove this machine. The tilt bob swings, the TILT lamp comes on, and the right flipper keeps working anyway - so shoving still pays. Not on our machine.',
    goal: 'The right flipper fires when the button is held, unless the machine is tilted.',
    note: 'Two sockets are wired in already. Look at how many leads run into each one before you choose what goes where.',
  },
  placement: 'slots',
  wiring: 'fixed',
  palette: [
    { type: 'INV', count: 1 },
    { type: 'AND', count: 1 },
  ],
  io: {
    inputs: [
      { id: 'btnRight', label: 'RIGHT BUTTON', short: 'BTN', rest: 0, note: 'held = 1' },
      { id: 'tilt', label: 'TILT BOB', short: 'TILT', rest: 0, note: 'tilted = 1' },
    ],
    outputs: [{ id: 'coilRight', label: 'RIGHT FLIPPER COIL', short: 'COIL' }],
  },
  slots: [
    { id: 's1', x: 348, y: 300, accepts: ['INV', 'AND'] },
    { id: 's2', x: 548, y: 205, accepts: ['INV', 'AND'] },
  ],
  prewired: [
    ['tilt', 's1.a'],
    ['btnRight', 's2.a'],
    ['s1.out', 's2.b'],
    ['s2.out', 'coilRight'],
  ],
  spec: {
    kind: 'truthTable',
    expect: ({ btnRight, tilt }) => ({ coilRight: btnRight && !tilt ? 1 : 0 }),
  },
  reference: {
    gates: [
      { slot: 's1', type: 'INV' },
      { slot: 's2', type: 'AND' },
    ],
    wires: [],
  },
  machine: { bind: { coilRight: 'flipper.right' }, inputBind: { tilt: 'lamp.tilt' }, celebrate: 'flipperFlutter' },
  testControls: [
    { kind: 'hold', input: 'btnRight', label: 'Hold: Right Button' },
    { kind: 'toggle', input: 'tilt', label: 'Tilt Bob' },
  ],
  hints: [
    'The coil wants 1 when the button is 1 and the tilt line is 0. Only one of your two gates can change a 0 into a 1.',
    'The tilt line has to be turned upside down before it is any use to an AND gate.',
    'INVERT goes in the socket with a single lead coming in. AND goes in the socket with two.',
  ],
  teacher: {
    answer: 'INV on the tilt line, then AND with the button. coil = button AND (NOT tilt).',
    nandgame: 'And / Invert',
    vocab: ['negation', 'guard condition'],
  },
};
