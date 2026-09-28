export default {
  id: 'drop-targets',
  act: 2,
  title: 'Drop Target Bank',
  subtitle: 'Connect the wires yourself.',
  brief: {
    story: 'Four targets spell G, A, T, and E. Nothing happens when a player knocks all four down.',
    goal: 'Open the diverter and light the jackpot only when all four targets are down.',
    note:
      'A target sends 1 when it is down, and 0 when it is still up. The wires into the two left sockets are already connected. You draw the wires between sockets, and the wires to the coil and the lamp. One output can connect to more than one input.',
  },
  placement: 'slots',
  wiring: 'student',
  palette: [{ type: 'AND', count: 3 }],
  io: {
    inputs: [
      { id: 't1', label: 'TARGET G', short: 'G', rest: 0, note: 'down = 1' },
      { id: 't2', label: 'TARGET A', short: 'A', rest: 0, note: 'down = 1' },
      { id: 't3', label: 'TARGET T', short: 'T', rest: 0, note: 'down = 1' },
      { id: 't4', label: 'TARGET E', short: 'E', rest: 0, note: 'down = 1' },
    ],
    outputs: [
      { id: 'gateCoil', label: 'DIVERTER COIL', short: 'GATE', note: 'on = 1' },
      { id: 'jackpotLamp', label: 'JACKPOT LAMP', short: 'JACK', note: 'on = 1' },
    ],
  },
  slots: [
    { id: 's1', x: 348, y: 148, accepts: ['AND'] },
    { id: 's2', x: 348, y: 332, accepts: ['AND'] },
    { id: 's3', x: 548, y: 240, accepts: ['AND'] },
  ],
  prewired: [
    ['t1', 's1.a'],
    ['t2', 's1.b'],
    ['t3', 's2.a'],
    ['t4', 's2.b'],
  ],
  spec: {
    kind: 'truthTable',
    expect: ({ t1, t2, t3, t4 }) => {
      const all = t1 && t2 && t3 && t4 ? 1 : 0;
      return { gateCoil: all, jackpotLamp: all };
    },
  },
  reference: {
    gates: [
      { slot: 's1', type: 'AND' },
      { slot: 's2', type: 'AND' },
      { slot: 's3', type: 'AND' },
    ],
    wires: [
      ['s1.out', 's3.a'],
      ['s2.out', 's3.b'],
      ['s3.out', 'gateCoil'],
      ['s3.out', 'jackpotLamp'],
    ],
  },
  machine: {
    bind: { gateCoil: 'coil.gate', jackpotLamp: 'lamp.jackpot' },
    watch: ['target.1', 'target.2', 'target.3', 'target.4'],
    targetInputs: { t1: 'target.1', t2: 'target.2', t3: 'target.3', t4: 'target.4' },
    celebrate: 'targetReset',
  },
  testControls: [
    { kind: 'toggle', input: 't1', label: 'Target G' },
    { kind: 'toggle', input: 't2', label: 'Target A' },
    { kind: 'toggle', input: 't3', label: 'Target T' },
    { kind: 'toggle', input: 't4', label: 'Target E' },
  ],
  hints: [
    'An AND gate has only two inputs, and you have four targets. Each left socket checks one pair: G with A, and T with E. You still need to check that both pairs are down.',
    'Put an AND gate in the empty socket. Connect the G-and-A output to one of its inputs, and the T-and-E output to the other. That output is 1 only when all four targets are down.',
    'Connect that last AND output to both DIVERTER COIL and JACKPOT LAMP. One output pin can have two wires.',
  ],
  teacher: {
    answer:
      'AND targets G and A. AND targets T and E. AND those two results, and connect that output to both the diverter coil and the jackpot lamp.',
    nandgame: 'And (chained)',
    vocab: ['fan-out', 'chaining gates'],
  },
};
