export default {
  id: 'flipper-live',
  act: 1,
  title: 'Flipper Live',
  subtitle: 'Place one INVERT gate.',
  brief: {
    story:
      'The castle pinball machine is almost finished. The left flipper is installed, but its button does nothing.',
    goal: 'Make the left flipper move while the left button is held down.',
    note:
      'The LEFT BUTTON wire starts at 1. Pressing the button changes it to 0. The coil turns on only when it gets a 1. Place a gate that turns 0 into 1.',
  },
  placement: 'slots',
  wiring: 'fixed',
  palette: [{ type: 'INV', count: 1 }],
  io: {
    inputs: [{ id: 'btnLeft', label: 'LEFT BUTTON', short: 'BTN', rest: 1, note: 'press = 0' }],
    outputs: [{ id: 'coilLeft', label: 'LEFT FLIPPER COIL', short: 'COIL', note: 'on = 1' }],
  },
  slots: [{ id: 's1', x: 392, y: 220, accepts: ['INV'] }],
  prewired: [
    ['btnLeft', 's1.a'],
    ['s1.out', 'coilLeft'],
  ],
  spec: {
    kind: 'truthTable',
    rows: [
      [{ btnLeft: 0 }, { coilLeft: 1 }],
      [{ btnLeft: 1 }, { coilLeft: 0 }],
    ],
  },
  reference: { gates: [{ slot: 's1', type: 'INV' }], wires: [] },
  machine: { bind: { coilLeft: 'flipper.left' }, celebrate: 'flipperFlutter' },
  testControls: [{ kind: 'hold', input: 'btnLeft', label: 'Hold left button' }],
  hints: [
    'Hold the test button. Watch the number on LEFT BUTTON. Then look at what LEFT FLIPPER COIL needs in order to turn on.',
    'Pressing the button sends 0. The coil turns on when it gets 1. You need a gate that swaps 0 and 1.',
    'Drag the INVERT gate from the parts bin into the empty socket.',
  ],
  teacher: {
    answer:
      'One INVERT gate sits between the button and the coil. Pressing the button sends 0, and INVERT turns that 0 into 1, so the coil turns on.',
    nandgame: 'Invert',
    vocab: ['active low', 'inverter'],
  },
};
