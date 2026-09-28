export default {
  id: 'lane-change',
  act: 4,
  title: 'Lane Change',
  subtitle: 'Remember the choice, and block it during tilt.',
  brief: {
    story: 'Two top lanes should never both be lit. The flipper buttons choose which one stays on.',
    goal: 'Light lane A when the left button is pressed, and lane B when the right button is pressed. Keep that choice after the button is released. Ignore both buttons while the machine is tilted.',
    note:
      'Exactly one lamp should be on. The memory circuit from Lock 1 already has two outputs, and one is always the opposite of the other. These buttons send 1 when pressed. That memory circuit changes when an input drops to 0.',
  },
  placement: 'free',
  wiring: 'student',
  palette: [
    { type: 'NAND', count: 4 },
    { type: 'INV', count: 1 },
  ],
  io: {
    inputs: [
      { id: 'btnLeft', label: 'LEFT BUTTON', short: 'LEFT', rest: 0, note: 'press = 1' },
      { id: 'btnRight', label: 'RIGHT BUTTON', short: 'RIGHT', rest: 0, note: 'press = 1' },
      { id: 'tilt', label: 'TILT', short: 'TILT', rest: 0, note: 'tilted = 1' },
    ],
    outputs: [
      { id: 'lampLaneA', label: 'LANE A LAMP', short: 'LANE A', note: 'on = 1' },
      { id: 'lampLaneB', label: 'LANE B LAMP', short: 'LANE B', note: 'on = 1' },
    ],
  },
  slots: [],
  prewired: [],
  spec: {
    kind: 'sequence',
    scenarios: [
      {
        name: 'the player changes lanes',
        initial: { btnLeft: 0, btnRight: 0, tilt: 0 },
        steps: [
          { set: { btnLeft: 1 }, expect: { lampLaneA: 1, lampLaneB: 0 }, note: 'The player presses the left button' },
          { set: { btnLeft: 0 }, expect: { lampLaneA: 1, lampLaneB: 0 }, note: 'The left button is released, and lane A stays on' },
          { set: { btnRight: 1 }, expect: { lampLaneA: 0, lampLaneB: 1 }, note: 'The player presses the right button' },
          { set: { btnRight: 0 }, expect: { lampLaneA: 0, lampLaneB: 1 }, note: 'The right button is released, and lane B stays on' },
          { set: { tilt: 1 }, expect: { lampLaneA: 0, lampLaneB: 1 }, note: 'The machine is tilted' },
          { set: { btnLeft: 1 }, expect: { lampLaneA: 0, lampLaneB: 1 }, note: 'The left button is pressed while tilted, so nothing changes' },
          { set: { btnLeft: 0, tilt: 0 }, expect: { lampLaneA: 0, lampLaneB: 1 }, note: 'Tilt turns off' },
          { set: { btnLeft: 1 }, expect: { lampLaneA: 1, lampLaneB: 0 }, note: 'The left button works again' },
          { set: { btnLeft: 0 }, expect: { lampLaneA: 1, lampLaneB: 0 }, note: 'The left button is released, and lane A stays on' },
        ],
      },
    ],
  },
  reference: {
    gates: [
      { id: 'g1', type: 'INV', x: 250, y: 355 },
      { id: 'g2', type: 'NAND', x: 410, y: 120 },
      { id: 'g3', type: 'NAND', x: 410, y: 280 },
      { id: 'g4', type: 'NAND', x: 580, y: 150 },
      { id: 'g5', type: 'NAND', x: 580, y: 260 },
    ],
    wires: [
      ['tilt', 'g1.a'],
      ['btnLeft', 'g2.a'],
      ['g1.out', 'g2.b'],
      ['btnRight', 'g3.a'],
      ['g1.out', 'g3.b'],
      ['g2.out', 'g4.a'],
      ['g5.out', 'g4.b'],
      ['g3.out', 'g5.a'],
      ['g4.out', 'g5.b'],
      ['g4.out', 'lampLaneA'],
      ['g5.out', 'lampLaneB'],
    ],
  },
  machine: {
    bind: { lampLaneA: 'lane.left', lampLaneB: 'lane.right' },
    inputBind: { tilt: 'lamp.tilt' },
    celebrate: 'laneFlash',
  },
  testControls: [
    { kind: 'tap', input: 'btnLeft', label: 'Tap left button' },
    { kind: 'tap', input: 'btnRight', label: 'Tap right button' },
    { kind: 'toggle', input: 'tilt', label: 'Tilt' },
  ],
  hints: [
    'The buttons send 1 when pressed. The memory circuit from Lock 1 changes when an input drops to 0. You also have to block both buttons while tilt is 1.',
    'Put a NAND in front of each side of the memory circuit. One NAND gets the left button. The other gets the right button. Both also get "not tilted." While the machine is tilted, those NAND outputs stay at 1, so the memory cannot change.',
    'INVERT tilt once, and connect that output to both front NAND gates. The left NAND output goes into one side of the memory. The right NAND output goes into the other side. Lane A connects to the memory gate fed by the left button. Lane B connects to the other memory gate.',
  ],
  teacher: {
    answer:
      'INVERT tilt once. Each button goes through a NAND with "not tilted," so tilt blocks both buttons. Those two outputs feed a memory pair, like Lock 1. Lane A connects to one memory output. Lane B connects to the other, which is always the opposite.',
    nandgame: 'Latch (set/reset inputs)',
    vocab: ['complementary outputs', 'Q and Q-bar', 'illegal state'],
  },
};
