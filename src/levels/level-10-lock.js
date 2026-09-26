export default {
  id: 'lock-one',
  act: 4,
  title: 'Lock 1',
  subtitle: 'The machine learns to remember.',
  brief: {
    story:
      'Behind the left ramp is a captive ball. Hit it and the LOCK 1 lamp should light and stay lit - the ball rolls off the switch a quarter second later, and the player still expects credit for it. Every circuit you have built so far forgets the instant the switch opens.',
    goal: 'LOCK 1 lights when the lock switch closes, stays lit after it opens, and goes out only when the machine sends its reset.',
    note: 'Both lines rest at 1 and dip to 0 when they act. Two NANDs can hold a value if each one watches the other.',
  },
  placement: 'free',
  wiring: 'student',
  palette: [{ type: 'NAND', count: 2 }],
  io: {
    inputs: [
      { id: 'lockSwitch', label: 'LOCK SWITCH', short: 'LOCK', rest: 1, note: 'ball hit = 0' },
      { id: 'resetLine', label: 'RESET LINE', short: 'RESET', rest: 1, note: 'new ball = 0' },
    ],
    outputs: [{ id: 'lampLock', label: 'LOCK 1 LAMP', short: 'LOCK1' }],
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
          { set: { resetLine: 0 }, expect: { lampLock: 0 }, note: 'the machine resets at the start of the ball' },
          { set: { resetLine: 1 }, expect: { lampLock: 0 }, note: 'the reset line lets go' },
          { set: { lockSwitch: 0 }, expect: { lampLock: 1 }, note: 'the ball hits the lock switch' },
          { set: { lockSwitch: 1 }, expect: { lampLock: 1 }, note: 'the ball rolls off the switch' },
          { set: { lockSwitch: 0 }, expect: { lampLock: 1 }, note: 'a second hit on the same switch' },
          { set: { lockSwitch: 1 }, expect: { lampLock: 1 }, note: 'and off again' },
          { set: { resetLine: 0 }, expect: { lampLock: 0 }, note: 'the next ball starts' },
          { set: { resetLine: 1 }, expect: { lampLock: 0 }, note: 'and the lamp stays out' },
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
    { kind: 'tap', input: 'lockSwitch', label: 'Ball: Lock Switch' },
    { kind: 'tap', input: 'resetLine', label: 'Machine: Reset' },
  ],
  hints: [
    'A signal cannot be remembered by a gate that only looks forward. What if a gate could see its own answer coming back around?',
    'Take the output of one NAND into an input of the other, and that second output back into the first. The lock switch feeds the first gate\'s free pin, the reset line feeds the second.',
    'g1 = NAND(lock switch, g2 output). g2 = NAND(reset line, g1 output). The lamp hangs off g1. Pulse reset first to start the lamp off.',
  ],
  teacher: {
    answer: 'Cross-coupled NAND latch. Q = g1 = NAND(set-bar, Qbar); Qbar = g2 = NAND(reset-bar, Q). Lamp on Q.',
    nandgame: 'Latch (the unit after logic gates)',
    vocab: ['feedback', 'latch', 'set/reset', 'state'],
  },
};
