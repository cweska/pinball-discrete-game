export default {
  id: 'pop-bumper',
  act: 1,
  title: 'Pop Bumper',
  subtitle: 'Both inputs must be 1.',
  brief: {
    story: 'The center pop bumper kicks even when nobody is playing.',
    goal: 'Fire the pop bumper only when a ball hits it during a game.',
    note:
      'GAME ON is 1 while a game is running, and 0 between games. The coil should turn on only when the skirt is hit and the game is on. Both inputs have to be 1.',
  },
  placement: 'slots',
  wiring: 'fixed',
  palette: [{ type: 'AND', count: 1 }],
  io: {
    inputs: [
      { id: 'skirt', label: 'BUMPER SKIRT', short: 'SKIRT', rest: 0, note: 'hit = 1' },
      { id: 'gameOn', label: 'GAME ON', short: 'GAME', rest: 1, note: 'game on = 1' },
    ],
    outputs: [{ id: 'popCoil', label: 'POP BUMPER COIL', short: 'COIL', note: 'on = 1' }],
  },
  slots: [{ id: 's1', x: 392, y: 220, accepts: ['AND'] }],
  prewired: [
    ['skirt', 's1.a'],
    ['gameOn', 's1.b'],
    ['s1.out', 'popCoil'],
  ],
  spec: {
    kind: 'truthTable',
    expect: ({ skirt, gameOn }) => ({ popCoil: skirt && gameOn ? 1 : 0 }),
  },
  reference: { gates: [{ slot: 's1', type: 'AND' }], wires: [] },
  machine: { bind: { popCoil: 'bumper.pop' }, inputBind: { gameOn: 'lamp.gameOn' }, celebrate: 'chimeRun' },
  testControls: [
    { kind: 'tap', input: 'skirt', label: 'Tap bumper' },
    { kind: 'toggle', input: 'gameOn', label: 'Game' },
  ],
  hints: [
    'Tap the bumper with the Game button on. Then turn Game off and tap the bumper again. The coil should fire only the first time.',
    'The coil turns on only when both inputs are 1: the skirt is hit, and the game is running.',
    'Put the AND gate in the socket. The wires to its two inputs are already connected.',
  ],
  teacher: {
    answer: 'One AND gate. The coil is 1 only when the skirt is 1 and GAME ON is 1.',
    nandgame: 'And',
    vocab: ['AND', 'conjunction'],
  },
};
