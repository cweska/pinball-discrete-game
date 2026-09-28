export default {
  id: 'kickback',
  act: 3,
  title: 'Kickback',
  subtitle: 'Use one answer for two outputs.',
  brief: {
    story: 'A ball in the left outlane drains. The kickback should save it, but the coil and the ARMED lamp are not connected.',
    goal: 'Kick the ball back when it rolls through the outlane, but only if the kickback is armed and the machine is not tilted. The ARMED lamp shows when a save is ready.',
    note:
      'The lamp and the coil have to agree about whether a save is ready. You do not need every gate in the bin. One gate output can go to two places.',
  },
  placement: 'free',
  wiring: 'student',
  palette: [
    { type: 'INV', count: 2 },
    { type: 'AND', count: 3 },
  ],
  io: {
    inputs: [
      { id: 'outlane', label: 'LEFT OUTLANE', short: 'LANE', rest: 0, note: 'ball = 1' },
      { id: 'armed', label: 'KICKBACK ARMED', short: 'ARM', rest: 0, note: 'armed = 1' },
      { id: 'tilt', label: 'TILT', short: 'TILT', rest: 0, note: 'tilted = 1' },
    ],
    outputs: [
      { id: 'kickCoil', label: 'KICKBACK COIL', short: 'KICK', note: 'on = 1' },
      { id: 'lampArmed', label: 'ARMED LAMP', short: 'ARMED', note: 'on = 1' },
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
    { kind: 'tap', input: 'outlane', label: 'Tap outlane' },
    { kind: 'toggle', input: 'armed', label: 'Kickback' },
    { kind: 'toggle', input: 'tilt', label: 'Tilt' },
  ],
  hints: [
    'Build the lamp first. It uses only two inputs: kickback armed is 1, and tilt is 0. Test the lamp before you add the coil.',
    'The coil uses the lamp signal plus one more check: is the ball in the outlane right now?',
    'INVERT the tilt signal. AND that with the armed signal, and connect that output to ARMED LAMP. Then AND that same output with the outlane switch, and connect it to KICKBACK COIL.',
  ],
  teacher: {
    answer:
      'The lamp is armed AND NOT tilt. The coil is the outlane switch AND that same lamp signal. Reuse the lamp output so the lamp and the coil cannot disagree.',
    nandgame: 'And / Invert (composition)',
    vocab: ['shared subexpression', 'three-input condition'],
  },
};
