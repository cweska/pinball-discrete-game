export default {
  id: 'pop-bumper',
  act: 1,
  title: 'Pop Bumper',
  subtitle: 'Two things have to be true.',
  brief: {
    story:
      'The centre pop bumper has a ring, a skirt switch and a hungry coil. Right now it fires whenever anything touches it - including the cleaning rag, at 2am, with nobody playing.',
    goal: 'Fire the pop bumper only when the ball hits it during a game.',
    note: 'The GAME ON relay holds 1 for as long as a game is running. Between games it drops to 0.',
  },
  placement: 'slots',
  wiring: 'fixed',
  palette: [{ type: 'AND', count: 1 }],
  io: {
    inputs: [
      { id: 'skirt', label: 'BUMPER SKIRT', short: 'SKIRT', rest: 0, note: 'ball hit = 1' },
      { id: 'gameOn', label: 'GAME ON RELAY', short: 'GAME', rest: 1, note: 'game running = 1' },
    ],
    outputs: [{ id: 'popCoil', label: 'POP BUMPER COIL', short: 'COIL' }],
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
    { kind: 'tap', input: 'skirt', label: 'Hit: Bumper Skirt' },
    { kind: 'toggle', input: 'gameOn', label: 'Game On Relay' },
  ],
  hints: [
    'Try the skirt with the game relay on, then switch the relay off and hit it again. What should be different?',
    'The coil should fire when the skirt is hit AND the game is running - not for either one on its own.',
    'Drop the AND gate into the socket. Both leads already run to its input pins.',
  ],
  teacher: {
    answer: 'One AND. Output 1 only for skirt=1 and gameOn=1.',
    nandgame: 'And',
    vocab: ['AND', 'conjunction'],
  },
};
