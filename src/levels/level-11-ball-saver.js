export default {
  id: 'ball-saver',
  act: 4,
  title: 'Ball Saver',
  subtitle: 'A stored bit that does something.',
  brief: {
    story:
      'A modern machine gives you your first ball back if it drains right away. Ours has the coil for it and a BALL SAVE lamp on the backglass. What it does not have is any idea whether the save is still live.',
    goal: 'Arm the save when the ball leaves the shooter lane. Hold it until end of ball. While it is armed, a drain should fire the auto-launch coil.',
    note: 'All three lines rest at 1 and dip to 0 when they act. The coil should only fire while the ball is actually in the outhole.',
  },
  placement: 'free',
  wiring: 'student',
  palette: [
    { type: 'NAND', count: 2 },
    { type: 'INV', count: 1 },
    { type: 'AND', count: 1 },
  ],
  io: {
    inputs: [
      { id: 'launch', label: 'SHOOTER LANE', short: 'LAUNCH', rest: 1, note: 'ball leaves = 0' },
      { id: 'endOfBall', label: 'END OF BALL', short: 'EOB', rest: 1, note: 'ball over = 0' },
      { id: 'drain', label: 'OUTHOLE', short: 'DRAIN', rest: 1, note: 'ball in outhole = 0' },
    ],
    outputs: [
      { id: 'lampSave', label: 'BALL SAVE LAMP', short: 'SAVE' },
      { id: 'coilAuto', label: 'AUTO LAUNCH COIL', short: 'AUTO' },
    ],
  },
  slots: [],
  prewired: [],
  spec: {
    kind: 'sequence',
    scenarios: [
      {
        name: 'an early drain gets saved',
        initial: { launch: 1, endOfBall: 1, drain: 1 },
        steps: [
          { set: { endOfBall: 0 }, expect: { lampSave: 0, coilAuto: 0 }, note: 'the machine sets up for a new ball' },
          { set: { endOfBall: 1 }, expect: { lampSave: 0, coilAuto: 0 }, note: 'the reset lets go' },
          { set: { launch: 0 }, expect: { lampSave: 1 }, note: 'the ball rolls out of the shooter lane' },
          { set: { launch: 1 }, expect: { lampSave: 1 }, note: 'the shooter lane switch opens again' },
          { set: { drain: 0 }, expect: { lampSave: 1, coilAuto: 1 }, note: 'the ball drains almost immediately' },
          { set: { drain: 1 }, expect: { lampSave: 1, coilAuto: 0 }, note: 'the outhole clears' },
        ],
      },
      {
        name: 'a drain with no save armed',
        initial: { launch: 1, endOfBall: 1, drain: 1 },
        steps: [
          { set: { endOfBall: 0 }, expect: { lampSave: 0 }, note: 'new ball' },
          { set: { endOfBall: 1 }, expect: { lampSave: 0 } },
          { set: { launch: 0 }, expect: { lampSave: 1 }, note: 'ball launched' },
          { set: { launch: 1 }, expect: { lampSave: 1 } },
          { set: { endOfBall: 0 }, expect: { lampSave: 0 }, note: 'the save time runs out and the ball ends' },
          { set: { endOfBall: 1 }, expect: { lampSave: 0 } },
          { set: { drain: 0 }, expect: { lampSave: 0, coilAuto: 0 }, note: 'a later drain, with nothing armed' },
          { set: { drain: 1 }, expect: { coilAuto: 0 } },
        ],
      },
    ],
  },
  reference: {
    gates: [
      { id: 'g1', type: 'NAND', x: 380, y: 130 },
      { id: 'g2', type: 'NAND', x: 380, y: 240 },
      { id: 'g3', type: 'INV', x: 420, y: 350 },
      { id: 'g4', type: 'AND', x: 600, y: 290 },
    ],
    wires: [
      ['launch', 'g1.a'],
      ['g2.out', 'g1.b'],
      ['endOfBall', 'g2.a'],
      ['g1.out', 'g2.b'],
      ['g1.out', 'lampSave'],
      ['drain', 'g3.a'],
      ['g1.out', 'g4.a'],
      ['g3.out', 'g4.b'],
      ['g4.out', 'coilAuto'],
    ],
  },
  machine: { bind: { lampSave: 'lamp.ballsave', coilAuto: 'coil.autoLaunch' }, celebrate: 'kickSave' },
  testControls: [
    { kind: 'tap', input: 'launch', label: 'Ball: Leaves Shooter Lane' },
    { kind: 'tap', input: 'drain', label: 'Ball: Drains' },
    { kind: 'tap', input: 'endOfBall', label: 'Machine: End Of Ball' },
  ],
  hints: [
    'You already know how to build the memory. Which line should set it, and which should clear it?',
    'The latch goes between the shooter lane switch and the end of ball line. The lamp comes straight off it.',
    'The coil is an AND: the stored bit, and "is the ball in the outhole right now". The outhole line reads 0 when the ball is there, so it needs inverting first.',
  ],
  teacher: {
    answer: 'Latch set by launch, reset by endOfBall. lampSave = Q. coilAuto = AND(Q, INV(drain)).',
    nandgame: 'Latch + And',
    vocab: ['state', 'gated output', 'active low'],
  },
};
