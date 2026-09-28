export default {
  id: 'ball-saver',
  act: 4,
  title: 'Ball Saver',
  subtitle: 'Remember a value, then use it.',
  brief: {
    story:
      'If the ball drains right away, the machine should launch it again. The coil and the BALL SAVE lamp are installed, but nothing remembers whether the save is still on.',
    goal: 'Turn the save on when the ball leaves the shooter lane. Keep it on until the ball ends. While it is on, a drain fires the auto-launch coil.',
    note:
      'All three input wires rest at 1 and drop to 0 when they act. The lamp shows the saved value. The coil should turn on only while the ball is in the outhole.',
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
      { id: 'launch', label: 'SHOOTER LANE', short: 'LAUNCH', rest: 1, note: 'leaves = 0' },
      { id: 'endOfBall', label: 'END OF BALL', short: 'EOB', rest: 1, note: 'ends = 0' },
      { id: 'drain', label: 'OUTHOLE', short: 'DRAIN', rest: 1, note: 'ball in = 0' },
    ],
    outputs: [
      { id: 'lampSave', label: 'BALL SAVE LAMP', short: 'SAVE', note: 'on = 1' },
      { id: 'coilAuto', label: 'AUTO LAUNCH', short: 'AUTO', note: 'on = 1' },
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
          { set: { endOfBall: 0 }, expect: { lampSave: 0, coilAuto: 0 }, note: 'The machine sets up a new ball' },
          { set: { endOfBall: 1 }, expect: { lampSave: 0, coilAuto: 0 }, note: 'End of ball turns off again' },
          { set: { launch: 0 }, expect: { lampSave: 1 }, note: 'The ball leaves the shooter lane' },
          { set: { launch: 1 }, expect: { lampSave: 1 }, note: 'The shooter lane switch opens again' },
          { set: { drain: 0 }, expect: { lampSave: 1, coilAuto: 1 }, note: 'The ball drains right away' },
          { set: { drain: 1 }, expect: { lampSave: 1, coilAuto: 0 }, note: 'The outhole is empty again' },
        ],
      },
      {
        name: 'a drain with no save armed',
        initial: { launch: 1, endOfBall: 1, drain: 1 },
        steps: [
          { set: { endOfBall: 0 }, expect: { lampSave: 0 }, note: 'A new ball starts' },
          { set: { endOfBall: 1 }, expect: { lampSave: 0 }, note: 'End of ball turns off again' },
          { set: { launch: 0 }, expect: { lampSave: 1 }, note: 'The ball is launched' },
          { set: { launch: 1 }, expect: { lampSave: 1 }, note: 'The shooter lane switch opens' },
          { set: { endOfBall: 0 }, expect: { lampSave: 0 }, note: 'The save time runs out and the ball ends' },
          { set: { endOfBall: 1 }, expect: { lampSave: 0 }, note: 'End of ball turns off, and the lamp stays off' },
          { set: { drain: 0 }, expect: { lampSave: 0, coilAuto: 0 }, note: 'A later drain, with the save off' },
          { set: { drain: 1 }, expect: { coilAuto: 0 }, note: 'The outhole is empty, and the coil stays off' },
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
    { kind: 'tap', input: 'launch', label: 'Ball leaves lane' },
    { kind: 'tap', input: 'drain', label: 'Ball drains' },
    { kind: 'tap', input: 'endOfBall', label: 'End the ball' },
  ],
  hints: [
    'Start with the same memory circuit as Lock 1. Decide which input turns the memory on, and which input turns it off.',
    'The shooter lane turns the memory on. End of ball turns it off. Connect BALL SAVE LAMP to the memory output.',
    'The coil is an AND of two things: the saved value, and "the ball is in the outhole right now." The outhole wire is 0 when the ball is there, so put an INVERT on it before the AND gate.',
  ],
  teacher: {
    answer:
      'Same two-NAND memory as Lock 1. The shooter lane sets it, and end of ball clears it. The lamp connects to that memory. The coil is the memory AND NOT the outhole wire, because the outhole is 0 when the ball is in it.',
    nandgame: 'Latch + And',
    vocab: ['state', 'gated output', 'active low'],
  },
};
