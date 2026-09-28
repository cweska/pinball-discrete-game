export default {
  id: 'tilt-guard',
  act: 2,
  title: 'Tilt Guard',
  subtitle: 'Use both gates.',
  brief: {
    story: 'Players shove the machine to cheat. The tilt light comes on, but the right flipper still works.',
    goal: 'The right flipper works when its button is held, unless the machine is tilted.',
    note:
      'The button is 1 while you hold it. TILT is 1 when the machine is tilted. The coil should be 1 only when the button is 1 and TILT is 0. Two sockets are already wired. Count the wires going into each socket before you pick a gate.',
  },
  placement: 'slots',
  wiring: 'fixed',
  palette: [
    { type: 'INV', count: 1 },
    { type: 'AND', count: 1 },
  ],
  io: {
    inputs: [
      { id: 'btnRight', label: 'RIGHT BUTTON', short: 'BTN', rest: 0, note: 'hold = 1' },
      { id: 'tilt', label: 'TILT', short: 'TILT', rest: 0, note: 'tilted = 1' },
    ],
    outputs: [{ id: 'coilRight', label: 'RIGHT FLIPPER COIL', short: 'COIL', note: 'on = 1' }],
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
    { kind: 'hold', input: 'btnRight', label: 'Hold right button' },
    { kind: 'toggle', input: 'tilt', label: 'Tilt' },
  ],
  hints: [
    'The coil should be 1 when the button is 1 and TILT is 0. Only one of your two gates can turn a 0 into a 1.',
    'Turn the tilt signal into its opposite before it reaches the AND gate. Then AND can check "button is on" and "tilt is off" together.',
    'Put INVERT in the socket with one wire coming in. Put AND in the socket with two wires coming in.',
  ],
  teacher: {
    answer: 'INVERT the tilt wire, then AND that result with the button. The coil is 1 only when the button is 1 and tilt is 0.',
    nandgame: 'And / Invert',
    vocab: ['negation', 'guard condition'],
  },
};
