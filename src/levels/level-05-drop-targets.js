export default {
  id: 'drop-targets',
  act: 2,
  title: 'Drop Target Bank',
  subtitle: 'Three inputs, two outputs, your wiring.',
  brief: {
    story:
      'N - A - D. Three drop targets across the middle of the playfield. Knock all three down and the diverter should swing open and the JACKPOT lamp should light. Knock two down and nothing should happen at all.',
    goal: 'Open the diverter and light the jackpot only when all three targets are down.',
    note: 'New job: the input leads are done, but the wires out of the sockets are yours. Drag from an output pin to an input pin to make a wire.',
  },
  placement: 'slots',
  wiring: 'student',
  palette: [{ type: 'AND', count: 2 }],
  io: {
    inputs: [
      { id: 't1', label: 'TARGET N', short: 'N', rest: 0, note: 'down = 1' },
      { id: 't2', label: 'TARGET A', short: 'A', rest: 0, note: 'down = 1' },
      { id: 't3', label: 'TARGET D', short: 'D', rest: 0, note: 'down = 1' },
    ],
    outputs: [
      { id: 'gateCoil', label: 'DIVERTER COIL', short: 'GATE' },
      { id: 'jackpotLamp', label: 'JACKPOT LAMP', short: 'JACK' },
    ],
  },
  slots: [
    { id: 's1', x: 348, y: 170, accepts: ['AND'] },
    { id: 's2', x: 540, y: 258, accepts: ['AND'] },
  ],
  prewired: [
    ['t1', 's1.a'],
    ['t2', 's1.b'],
    ['t3', 's2.b'],
  ],
  spec: {
    kind: 'truthTable',
    expect: ({ t1, t2, t3 }) => {
      const all = t1 && t2 && t3 ? 1 : 0;
      return { gateCoil: all, jackpotLamp: all };
    },
  },
  reference: {
    gates: [
      { slot: 's1', type: 'AND' },
      { slot: 's2', type: 'AND' },
    ],
    wires: [
      ['s1.out', 's2.a'],
      ['s2.out', 'gateCoil'],
      ['s2.out', 'jackpotLamp'],
    ],
  },
  machine: {
    bind: { gateCoil: 'coil.gate', jackpotLamp: 'lamp.jackpot' },
    watch: ['target.1', 'target.2', 'target.3'],
    targetInputs: { 't1': 'target.1', 't2': 'target.2', 't3': 'target.3' },
    celebrate: 'targetReset',
  },
  testControls: [
    { kind: 'toggle', input: 't1', label: 'Target N down' },
    { kind: 'toggle', input: 't2', label: 'Target A down' },
    { kind: 'toggle', input: 't3', label: 'Target D down' },
  ],
  hints: [
    'An AND gate only takes two inputs, and you have three targets. Can one AND gate answer about the first two, and the second AND gate take that answer along with the third target?',
    'The first AND already has N and A running into it. Its output is the answer to "are N and A both down?" - feed that answer into the free input pin of the second AND.',
    'Wire s1 output to the empty pin on s2, then run s2 output to BOTH the diverter coil and the jackpot lamp. One output pin can feed as many wires as you like.',
  ],
  teacher: {
    answer: 'AND(AND(N, A), D), fanned out to both outputs. First look at fan-out.',
    nandgame: 'And (chained)',
    vocab: ['fan-out', 'chaining gates'],
  },
};
