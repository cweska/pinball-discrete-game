export default {
  id: 'kickback',
  act: 3,
  title: 'Kickback',
  subtitle: 'Reuse what you already worked out.',
  brief: {
    story:
      'The left outlane is a death sentence without a kickback. Ours has a coil, a lane switch, and an ARMED lamp on the apron that is supposed to tell the player whether the save is live. The lamp and the coil must never disagree.',
    goal: 'Kick the ball back when it rolls through the outlane while the kickback is armed and the machine is not tilted. The ARMED lamp shows whether a save is live right now.',
    note: 'There are spare gates in the bin. The tidiest answer does not use all of them - one gate\'s output can answer two questions.',
  },
  placement: 'free',
  wiring: 'student',
  palette: [
    { type: 'INV', count: 2 },
    { type: 'AND', count: 3 },
  ],
  io: {
    inputs: [
      { id: 'outlane', label: 'LEFT OUTLANE', short: 'LANE', rest: 0, note: 'ball through = 1' },
      { id: 'armed', label: 'KICKBACK RELAY', short: 'ARM', rest: 0, note: 'armed = 1' },
      { id: 'tilt', label: 'TILT BOB', short: 'TILT', rest: 0, note: 'tilted = 1' },
    ],
    outputs: [
      { id: 'kickCoil', label: 'KICKBACK COIL', short: 'KICK' },
      { id: 'lampArmed', label: 'ARMED LAMP', short: 'ARMED' },
    ],
  },
  slots: [],
  prewired: [],
  spec: {
    kind: 'truthTable',
    expect: ({ outlane, armed, tilt }) => ({
      kickCoil: outlane && armed && !tilt ? 1 : 0,
      lampArmed: armed && !tilt ? 1 : 0,
    }),
  },
  reference: {
    gates: [
      { id: 'g1', type: 'INV', x: 300, y: 330 },
      { id: 'g2', type: 'AND', x: 470, y: 260 },
      { id: 'g3', type: 'AND', x: 620, y: 160 },
    ],
    wires: [
      ['tilt', 'g1.a'],
      ['armed', 'g2.a'],
      ['g1.out', 'g2.b'],
      ['outlane', 'g3.a'],
      ['g2.out', 'g3.b'],
      ['g2.out', 'lampArmed'],
      ['g3.out', 'kickCoil'],
    ],
  },
  machine: {
    bind: { kickCoil: 'coil.kickback', lampArmed: 'lamp.kickbackArmed' },
    inputBind: { tilt: 'lamp.tilt' },
    celebrate: 'kickSave',
  },
  testControls: [
    { kind: 'tap', input: 'outlane', label: 'Ball: Left Outlane' },
    { kind: 'toggle', input: 'armed', label: 'Kickback Relay' },
    { kind: 'toggle', input: 'tilt', label: 'Tilt Bob' },
  ],
  hints: [
    'Start with the lamp - it only cares about two of the three inputs. Build that first and test it.',
    'The coil is the lamp\'s question plus one more: is the ball in the outlane right now?',
    'Invert tilt. AND that with armed and send it to the ARMED lamp. Then AND that same signal with the outlane switch for the coil.',
  ],
  teacher: {
    answer: 'lampArmed = AND(armed, NOT tilt); kickCoil = AND(outlane, lampArmed). Three gates; the shared term is the point.',
    nandgame: 'And / Invert (composition)',
    vocab: ['shared subexpression', 'three-input condition'],
  },
};
