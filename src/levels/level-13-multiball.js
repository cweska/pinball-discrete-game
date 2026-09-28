export default {
  id: 'multiball',
  act: 4,
  title: 'Multiball',
  subtitle: 'Three memories, then one AND.',
  brief: {
    story: 'The last unwired parts in the castle machine are three lock lamps and one ball-release coil.',
    goal: 'Each lock lamp turns on from its own switch and stays on. When all three lamps are on, fire the ball release. Reset turns all three lamps off.',
    note:
      'Build the Lock 1 circuit three times. The same reset wire goes to all three. Then combine the three saved values with AND gates, the same way you combined the drop targets. One output pin can connect to as many inputs as you need.',
  },
  placement: 'free',
  wiring: 'student',
  palette: [
    { type: 'NAND', count: 6 },
    { type: 'AND', count: 2 },
  ],
  io: {
    inputs: [
      { id: 'lock1', label: 'LOCK 1 SWITCH', short: 'L1', rest: 1, note: 'hit = 0' },
      { id: 'lock2', label: 'LOCK 2 SWITCH', short: 'L2', rest: 1, note: 'hit = 0' },
      { id: 'lock3', label: 'LOCK 3 SWITCH', short: 'L3', rest: 1, note: 'hit = 0' },
      { id: 'resetLine', label: 'RESET', short: 'RESET', rest: 1, note: 'reset = 0' },
    ],
    outputs: [
      { id: 'lampLock1', label: 'LOCK 1 LAMP', short: 'LOCK1', note: 'on = 1' },
      { id: 'lampLock2', label: 'LOCK 2 LAMP', short: 'LOCK2', note: 'on = 1' },
      { id: 'lampLock3', label: 'LOCK 3 LAMP', short: 'LOCK3', note: 'on = 1' },
      { id: 'coilRelease', label: 'BALL RELEASE', short: 'REL', note: 'on = 1' },
    ],
  },
  slots: [],
  prewired: [],
  spec: {
    kind: 'sequence',
    scenarios: [
      {
        name: 'three locks and a release',
        initial: { lock1: 1, lock2: 1, lock3: 1, resetLine: 1 },
        steps: [
          {
            set: { resetLine: 0 },
            expect: { lampLock1: 0, lampLock2: 0, lampLock3: 0, coilRelease: 0 },
            note: 'Reset for a new game',
          },
          {
            set: { resetLine: 1 },
            expect: { lampLock1: 0, lampLock2: 0, lampLock3: 0, coilRelease: 0 },
            note: 'Reset turns off again',
          },
          {
            set: { lock1: 0 },
            expect: { lampLock1: 1, lampLock2: 0, lampLock3: 0, coilRelease: 0 },
            note: 'The first ball is locked',
          },
          { set: { lock1: 1 }, expect: { lampLock1: 1, coilRelease: 0 }, note: 'Lock 1 opens, and the lamp stays on' },
          {
            set: { lock3: 0 },
            expect: { lampLock1: 1, lampLock2: 0, lampLock3: 1, coilRelease: 0 },
            note: 'Lock 3 is hit before lock 2',
          },
          { set: { lock3: 1 }, expect: { lampLock3: 1, coilRelease: 0 }, note: 'Lock 3 opens, and that lamp stays on' },
          {
            set: { lock2: 0 },
            expect: { lampLock1: 1, lampLock2: 1, lampLock3: 1, coilRelease: 1 },
            note: 'All three locks are on, so the balls release',
          },
          { set: { lock2: 1 }, expect: { coilRelease: 1 }, note: 'Lock 2 opens, and the release stays on' },
          {
            set: { resetLine: 0 },
            expect: { lampLock1: 0, lampLock2: 0, lampLock3: 0, coilRelease: 0 },
            note: 'The game ends, and everything turns off',
          },
          { set: { resetLine: 1 }, expect: { coilRelease: 0 }, note: 'Reset turns off, and the release stays off' },
        ],
      },
    ],
  },
  reference: {
    gates: [
      { id: 'a1', type: 'NAND', x: 300, y: 80 },
      { id: 'a2', type: 'NAND', x: 300, y: 150 },
      { id: 'b1', type: 'NAND', x: 300, y: 230 },
      { id: 'b2', type: 'NAND', x: 300, y: 300 },
      { id: 'c1', type: 'NAND', x: 300, y: 380 },
      { id: 'c2', type: 'NAND', x: 300, y: 450 },
      { id: 'd1', type: 'AND', x: 500, y: 160 },
      { id: 'd2', type: 'AND', x: 620, y: 280 },
    ],
    wires: [
      ['lock1', 'a1.a'],
      ['a2.out', 'a1.b'],
      ['resetLine', 'a2.a'],
      ['a1.out', 'a2.b'],
      ['lock2', 'b1.a'],
      ['b2.out', 'b1.b'],
      ['resetLine', 'b2.a'],
      ['b1.out', 'b2.b'],
      ['lock3', 'c1.a'],
      ['c2.out', 'c1.b'],
      ['resetLine', 'c2.a'],
      ['c1.out', 'c2.b'],
      ['a1.out', 'lampLock1'],
      ['b1.out', 'lampLock2'],
      ['c1.out', 'lampLock3'],
      ['a1.out', 'd1.a'],
      ['b1.out', 'd1.b'],
      ['d1.out', 'd2.a'],
      ['c1.out', 'd2.b'],
      ['d2.out', 'coilRelease'],
    ],
  },
  machine: {
    bind: {
      lampLock1: 'lamp.lockA',
      lampLock2: 'lamp.lockB',
      lampLock3: 'lamp.lockC',
      coilRelease: ['coil.release', 'knocker', 'lamp.multiball'],
    },
    celebrate: 'lightShow',
  },
  testControls: [
    { kind: 'tap', input: 'lock1', label: 'Tap lock 1' },
    { kind: 'tap', input: 'lock2', label: 'Tap lock 2' },
    { kind: 'tap', input: 'lock3', label: 'Tap lock 3' },
    { kind: 'tap', input: 'resetLine', label: 'Tap reset' },
  ],
  hints: [
    'Build one lock and test it before you add the other two. Then copy that circuit two more times.',
    'All three memory circuits use the same reset wire. Connect that one reset pin to each circuit. You already connected one output to two places on the drop-target level.',
    'Each lock is two NAND gates, like Lock 1. Then AND the first two lamp signals together. AND that result with the third lamp signal. Connect that last output to BALL RELEASE.',
  ],
  teacher: {
    answer:
      'Three copies of the Lock 1 memory, all using the same reset wire. AND the first two lamp signals, then AND that result with the third. That output goes to the ball release.',
    nandgame: 'Latch (x3) + And',
    vocab: ['register', 'shared reset', 'composition'],
  },
};
