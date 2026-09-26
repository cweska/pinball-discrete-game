export default {
  id: 'flipper-live',
  act: 1,
  title: 'Flipper Live',
  subtitle: 'One gate. One socket.',
  brief: {
    story:
      'GATECRASHER came off the truck almost finished. The left flipper is bolted in, the coil is good, the button works. Press it and nothing happens.',
    goal: 'Make the left flipper coil fire while the button is held.',
    note:
      'Pinball switches close to ground, so the LEFT BUTTON line sits at 1 and drops to 0 when you press it. The coil needs a 1 to fire.',
  },
  placement: 'slots',
  wiring: 'fixed',
  palette: [{ type: 'INV', count: 1 }],
  io: {
    inputs: [{ id: 'btnLeft', label: 'LEFT BUTTON', short: 'BTN', rest: 1, note: 'pressed = 0' }],
    outputs: [{ id: 'coilLeft', label: 'LEFT FLIPPER COIL', short: 'COIL', note: 'fires on 1' }],
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
  testControls: [{ kind: 'hold', input: 'btnLeft', label: 'Hold: Left Button' }],
  hints: [
    'Hold the test button and watch the number leaving the LEFT BUTTON terminal. Is that what the coil wants?',
    'Pressing sends 0. The coil fires on 1. You need a part that flips a signal to its opposite.',
    'Drag the INVERT gate out of the parts bin and drop it into the empty socket.',
  ],
  teacher: {
    answer: 'One INV between the button and the coil. The switch is active-low, so the signal has to be flipped.',
    nandgame: 'Invert',
    vocab: ['active low', 'inverter'],
  },
};
