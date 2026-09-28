export default {
  id: 'lock-one',
  act: 4,
  title: 'Lock 1',
  subtitle: 'The circuit has to remember.',
  brief: {
    story: 'A ball hits the lock switch for only a moment. The LOCK 1 lamp should stay on after the ball rolls away.',
    goal: 'Turn LOCK 1 on when the lock switch closes. Keep it on after the switch opens. Turn it off only when reset happens.',
    note:
      'Both wires rest at 1. They drop to 0 when they act. The lock switch drops to 0 when the ball hits. Reset drops to 0 for a new ball. Two NAND gates can remember a value if each output connects to an input on the other gate.',
  },
  placement: 'free',
  wiring: 'student',
  palette: [{ type: 'NAND', count: 2 }],
  io: {
    inputs: [
      { id: 'lockSwitch', label: 'LOCK SWITCH', short: 'LOCK', rest: 1, note: 'hit = 0' },
      { id: 'resetLine', label: 'RESET', short: 'RESET', rest: 1, note: 'reset = 0' },
    ],
    outputs: [{ id: 'lampLock', label: 'LOCK 1 LAMP', short: 'LOCK1', note: 'on = 1' }],
  },
  slots: [],
  prewired: [],
  spec: {
    kind: 'sequence',
    scenarios: [
      {
        name: 'a ball gets locked and stays locked',
        initial: { lockSwitch: 1, resetLine: 1 },
        steps: [
          { set: { resetLine: 0 }, expect: { lampLock: 0 }, note: 'Reset at the start of the ball' },
          { set: { resetLine: 1 }, expect: { lampLock: 0 }, note: 'Reset turns off again' },
          { set: { lockSwitch: 0 }, expect: { lampLock: 1 }, note: 'The ball hits the lock switch' },
          { set: { lockSwitch: 1 }, expect: { lampLock: 1 }, note: 'The ball rolls off the switch' },
          { set: { lockSwitch: 0 }, expect: { lampLock: 1 }, note: 'The ball hits the same switch again' },
          { set: { lockSwitch: 1 }, expect: { lampLock: 1 }, note: 'The switch opens again' },
          { set: { resetLine: 0 }, expect: { lampLock: 0 }, note: 'The next ball starts' },
          { set: { resetLine: 1 }, expect: { lampLock: 0 }, note: 'Reset turns off, and the lamp stays off' },
        ],
      },
    ],
  },
  reference: {
    gates: [
      { id: 'g1', type: 'NAND', x: 430, y: 180 },
      { id: 'g2', type: 'NAND', x: 430, y: 300 },
    ],
    wires: [
      ['lockSwitch', 'g1.a'],
      ['g2.out', 'g1.b'],
      ['resetLine', 'g2.a'],
      ['g1.out', 'g2.b'],
      ['g1.out', 'lampLock'],
    ],
  },
  machine: { bind: { lampLock: 'lamp.lockA' }, celebrate: 'lockUp' },
  testControls: [
    { kind: 'tap', input: 'lockSwitch', label: 'Tap lock' },
    { kind: 'tap', input: 'resetLine', label: 'Tap reset' },
  ],
  hints: [
    'A gate that only watches the switch will forget as soon as the switch goes back to 1. To remember, a gate has to see an output coming back in.',
    'Cross the wires. Connect the first NAND output to an input of the second NAND, and the second output back to an input of the first. The lock switch goes to the first gate. Reset goes to the second gate.',
    'Connect the lamp to the NAND that also gets the lock switch. Tap Reset first so the lamp starts off. Then tap the lock switch. The lamp should stay on after the switch opens.',
  ],
  teacher: {
    answer:
      'Two NAND gates wired to each other. The lock switch goes into the first NAND, and the lamp connects to that output. Reset goes into the second NAND. Each output feeds the other gate, so the lamp stays on after the switch opens.',
    nandgame: 'Latch (the unit after logic gates)',
    vocab: ['feedback', 'latch', 'set/reset', 'state'],
  },
};
