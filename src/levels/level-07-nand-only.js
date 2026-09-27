export default {
  id: 'nand-only',
  act: 3,
  title: 'Parts Shortage',
  subtitle: 'The bin is all NANDs.',
  brief: {
    story:
      'The upper pop bumper needs the same guard the flippers got: fire on the ball, stay dead when the machine is tilted. The crate that showed up has nothing in it but NAND gates. Distributor says three weeks.',
    goal: 'Fire the upper pop bumper when its skirt is hit, unless the machine is tilted - using only NANDs.',
    note: 'A NAND with the same signal on both pins behaves like something you have used before. Try it.',
  },
  placement: 'free',
  wiring: 'student',
  palette: [{ type: 'NAND', count: 3 }],
  io: {
    inputs: [
      { id: 'skirt2', label: 'UPPER SKIRT', short: 'SKIRT', rest: 0, note: 'ball hit = 1' },
      { id: 'tilt', label: 'TILT BOB', short: 'TILT', rest: 0, note: 'tilted = 1' },
    ],
    outputs: [{ id: 'upperCoil', label: 'UPPER POP COIL', short: 'COIL' }],
  },
  slots: [],
  prewired: [],
  spec: {
    kind: 'truthTable',
    expect: ({ skirt2, tilt }) => ({ upperCoil: skirt2 && !tilt ? 1 : 0 }),
  },
  reference: {
    gates: [
      { id: 'g1', type: 'NAND', x: 330, y: 300 },
      { id: 'g2', type: 'NAND', x: 480, y: 200 },
      { id: 'g3', type: 'NAND', x: 610, y: 200 },
    ],
    wires: [
      ['tilt', 'g1.a'],
      ['tilt', 'g1.b'],
      ['skirt2', 'g2.a'],
      ['g1.out', 'g2.b'],
      ['g2.out', 'g3.a'],
      ['g2.out', 'g3.b'],
      ['g3.out', 'upperCoil'],
    ],
  },
  machine: { bind: { upperCoil: 'bumper.upper' }, inputBind: { tilt: 'lamp.tilt' }, celebrate: 'chimeRun' },
  testControls: [
    { kind: 'tap', input: 'skirt2', label: 'Hit: Upper Skirt' },
    { kind: 'toggle', input: 'tilt', label: 'Tilt Bob' },
  ],
  hints: [
    'Feed the same signal into both pins of one NAND and watch what comes out. That is one of your missing parts, for free.',
    'NAND is AND with its answer flipped. So build the NAND of what you want, then flip it back with a second NAND wired as an inverter.',
    'Three gates: NAND(tilt, tilt) makes NOT tilt. NAND(skirt, NOT tilt) is almost the answer but upside down. A third NAND with that signal on both pins turns it the right way up.',
  ],
  teacher: {
    answer: 'g1 = NAND(tilt,tilt) = NOT tilt. g2 = NAND(skirt, g1). g3 = NAND(g2,g2) = skirt AND NOT tilt.',
    nandgame: 'Invert / And built from NAND',
    vocab: ['universal gate', 'De Morgan'],
  },
};
