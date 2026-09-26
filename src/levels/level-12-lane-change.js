export default {
  id: 'lane-change',
  act: 4,
  title: 'Lane Change',
  subtitle: 'Both answers at once.',
  brief: {
    story:
      'Two rollover lanes across the top arch, one lamp each, and exactly one of them should be lit at any moment. Players choose with the flipper buttons: left button picks lane A, right button picks lane B. And a tilted machine should not let anybody choose anything.',
    goal: 'Lane A lights when the left button is pressed, lane B when the right button is pressed, the choice holds after the button is released, and a tilted machine ignores both buttons.',
    note: 'Exactly one lamp lit, always. Your latch already produces both answers - look at what comes out of its second gate.',
  },
  placement: 'free',
  wiring: 'student',
  palette: [
    { type: 'NAND', count: 4 },
    { type: 'INV', count: 1 },
  ],
  io: {
    inputs: [
      { id: 'btnLeft', label: 'LEFT BUTTON', short: 'LEFT', rest: 0, note: 'held = 1' },
      { id: 'btnRight', label: 'RIGHT BUTTON', short: 'RIGHT', rest: 0, note: 'held = 1' },
      { id: 'tilt', label: 'TILT BOB', short: 'TILT', rest: 0, note: 'tilted = 1' },
    ],
    outputs: [
      { id: 'lampLaneA', label: 'LANE A LAMP', short: 'LANE A' },
      { id: 'lampLaneB', label: 'LANE B LAMP', short: 'LANE B' },
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
          { set: { btnLeft: 1 }, expect: { lampLaneA: 1, lampLaneB: 0 }, note: 'the player taps the left button' },
          { set: { btnLeft: 0 }, expect: { lampLaneA: 1, lampLaneB: 0 }, note: 'released, and lane A stays chosen' },
          { set: { btnRight: 1 }, expect: { lampLaneA: 0, lampLaneB: 1 }, note: 'now the right button' },
          { set: { btnRight: 0 }, expect: { lampLaneA: 0, lampLaneB: 1 }, note: 'released, and lane B stays chosen' },
          { set: { tilt: 1 }, expect: { lampLaneA: 0, lampLaneB: 1 }, note: 'somebody shoves the machine' },
          { set: { btnLeft: 1 }, expect: { lampLaneA: 0, lampLaneB: 1 }, note: 'left button while tilted, which must do nothing' },
          { set: { btnLeft: 0, tilt: 0 }, expect: { lampLaneA: 0, lampLaneB: 1 }, note: 'the tilt clears' },
          { set: { btnLeft: 1 }, expect: { lampLaneA: 1, lampLaneB: 0 }, note: 'and the left button works again' },
          { set: { btnLeft: 0 }, expect: { lampLaneA: 1, lampLaneB: 0 }, note: 'released' },
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
    { kind: 'tap', input: 'btnLeft', label: 'Tap: Left Button' },
    { kind: 'tap', input: 'btnRight', label: 'Tap: Right Button' },
    { kind: 'toggle', input: 'tilt', label: 'Tilt Bob' },
  ],
  hints: [
    'The buttons read 1 when pressed, but the latch you built wants a 0 to set it. What do you have that turns a 1 into a 0 - and can check the tilt at the same time?',
    'Put a NAND in front of each side of the latch: one takes the left button, one takes the right, and both take "the machine is not tilted". While tilted, both of those NANDs sit at 1 and the latch cannot move.',
    'Invert tilt once. g2 = NAND(left button, not-tilt) feeds the latch\'s set side, g3 = NAND(right button, not-tilt) feeds its reset side. Lane A comes off the latch gate fed by g2, lane B off the other one.',
  ],
  teacher: {
    answer: 'INV(tilt) gates both button lines through NANDs into a NAND latch. Lamps take Q and Qbar - the latch already produces both. Pressing both buttons at once drives the illegal state where both lamps light; worth demonstrating.',
    nandgame: 'Latch (set/reset inputs)',
    vocab: ['complementary outputs', 'Q and Q-bar', 'illegal state'],
  },
};
