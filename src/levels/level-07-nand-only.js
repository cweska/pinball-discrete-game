export default {
  id: 'nand-only',
  act: 3,
  title: 'Parts Shortage',
  subtitle: 'Use only NAND gates.',
  brief: {
    story: 'The upper pop bumper should ignore hits while the machine is tilted. The parts bin has only NAND gates.',
    goal: 'Fire the upper pop bumper when its skirt is hit, unless the machine is tilted. Use only NAND gates.',
    note:
      'You need the same rule as Tilt Guard: the skirt is 1 and tilt is 0. If you connect the same wire to both inputs of a NAND gate, it works like an INVERT gate. Try that first.',
  },
  placement: 'free',
  wiring: 'student',
  palette: [{ type: 'NAND', count: 3 }],
  io: {
    inputs: [
      { id: 'skirt2', label: 'UPPER SKIRT', short: 'SKIRT', rest: 0, note: 'hit = 1' },
      { id: 'tilt', label: 'TILT', short: 'TILT', rest: 0, note: 'tilted = 1' },
    ],
    outputs: [{ id: 'upperCoil', label: 'UPPER POP COIL', short: 'COIL', note: 'on = 1' }],
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
    { kind: 'tap', input: 'skirt2', label: 'Tap upper bumper' },
    { kind: 'toggle', input: 'tilt', label: 'Tilt' },
  ],
  hints: [
    'Connect the tilt wire to both inputs of one NAND gate. Watch the output. It is the opposite of tilt.',
    'NAND is AND with the answer flipped. Build the condition you want, then flip the answer back with another NAND used as an INVERT.',
    'Use three NAND gates. The first gets tilt on both inputs, so its output is NOT tilt. The second gets the skirt and that NOT tilt. That output is the opposite of what the coil needs. The third gets that output on both inputs, which flips it to the right answer. Connect the third output to the coil.',
  ],
  teacher: {
    answer:
      'Three NAND gates. NAND with tilt on both inputs makes NOT tilt. NAND of the skirt and NOT tilt is the answer flipped. A third NAND with that signal on both inputs flips it back.',
    nandgame: 'Invert / And built from NAND',
    vocab: ['universal gate', 'De Morgan'],
  },
};
