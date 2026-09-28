export default {
  id: 'drop-targets',
  act: 2,
  title: 'Drop Target Bank',
  subtitle: 'Four inputs, two outputs, your wiring.',
  brief: {
    story:
      'G - A - T - E. Four drop targets across the middle of the playfield. Knock all four down and the diverter should swing open and the JACKPOT lamp should light. Leave any one standing and nothing should happen at all.',
    goal: 'Open the diverter and light the jackpot only when all four targets are down.',
    note: 'The leads into the two pair sockets are already done. The wires between sockets, and the wires out to the coil and the lamp, are yours.',
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
      { id: 'gateCoil', label: 'DIVERTER COIL', short: 'GATE' },
      { id: 'jackpotLamp', label: 'JACKPOT LAMP', short: 'JACK' },
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
    { kind: 'toggle', input: 't1', label: 'Target G down' },
    { kind: 'toggle', input: 't2', label: 'Target A down' },
    { kind: 'toggle', input: 't3', label: 'Target T down' },
    { kind: 'toggle', input: 't4', label: 'Target E down' },
  ],
  hints: [
    'An AND gate only takes two inputs, and you have four targets. Two sockets already have a pair wired in. Each of those answers "are both of mine down?" What do you do with the two answers?',
    'The empty socket is the last AND. Feed it the output of the G-and-A gate and the output of the T-and-E gate. That answer is "are all four down?"',
    'Wire s1 output to one pin on s3, and s2 output to the other pin. Then run s3 output to BOTH the diverter coil and the jackpot lamp.',
  ],
  teacher: {
    answer: 'AND(AND(G, A), AND(T, E)), fanned out to both outputs. Pair the targets, then AND the pairs.',
    nandgame: 'And (chained)',
    vocab: ['fan-out', 'chaining gates'],
  },
};
