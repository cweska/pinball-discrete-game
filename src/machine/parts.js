/**
 * The machine manifest.
 *
 * Every feature on GATECRASHER lives here once: its id, what kind of device it
 * is, where it sits, and what it sounds like. Levels bind circuit outputs to
 * these ids, the playfield renderer draws from the same list, and a test checks
 * that no level ever binds to a part that does not exist.
 *
 * Coordinates are in playfield space (400 x 700) or backglass space (400 x 150).
 */

export const PLAYFIELD_VIEW = { width: 400, height: 700 };
export const BACKGLASS_VIEW = { width: 400, height: 150 };

export const PARTS = {
  // --- backglass ----------------------------------------------------------
  'lamp.gameOn': { kind: 'lamp', label: 'GAME ON', zone: 'backglass', x: 46, y: 118, size: 9, color: 'green' },
  'lamp.tilt': { kind: 'lamp', label: 'TILT', zone: 'backglass', x: 110, y: 118, size: 9, color: 'red' },
  'lamp.ballsave': { kind: 'lamp', label: 'BALL SAVE', zone: 'backglass', x: 196, y: 118, size: 9, color: 'cyan' },
  'lamp.multiball': { kind: 'lamp', label: 'MULTIBALL', zone: 'backglass', x: 300, y: 118, size: 11, color: 'magenta' },
  'knocker': { kind: 'coil', label: 'KNOCKER', zone: 'backglass', x: 366, y: 118, sound: 'knocker', pulse: true },

  // --- top arch -----------------------------------------------------------
  'lane.left': { kind: 'lamp', label: 'LANE A', zone: 'playfield', x: 150, y: 74, size: 11, color: 'amber' },
  'lane.right': { kind: 'lamp', label: 'LANE B', zone: 'playfield', x: 250, y: 74, size: 11, color: 'amber' },

  // --- upper playfield ----------------------------------------------------
  'bumper.upper': { kind: 'bumper', label: 'UPPER POP', zone: 'playfield', x: 92, y: 168, r: 24, sound: 'bumper' },
  'lamp.mystery': { kind: 'lamp', label: 'MYSTERY', zone: 'playfield', x: 308, y: 150, size: 13, color: 'violet' },
  'toy.spinner': { kind: 'toy', label: 'GATE WHEEL', zone: 'playfield', x: 308, y: 226, r: 26, sound: 'fx_spinner' },

  'target.1': { kind: 'target', label: 'N', zone: 'playfield', x: 140, y: 252 },
  'target.2': { kind: 'target', label: 'A', zone: 'playfield', x: 176, y: 252 },
  'target.3': { kind: 'target', label: 'D', zone: 'playfield', x: 212, y: 252 },
  'coil.gate': { kind: 'coil', label: 'DIVERTER', zone: 'playfield', x: 256, y: 300, sound: 'gate' },
  'lamp.jackpot': { kind: 'lamp', label: 'JACKPOT', zone: 'playfield', x: 176, y: 300, size: 14, color: 'gold' },

  // --- mid playfield ------------------------------------------------------
  'bumper.pop': { kind: 'bumper', label: 'POP', zone: 'playfield', x: 176, y: 372, r: 27, sound: 'bumper' },
  'lamp.lockA': { kind: 'lamp', label: 'LOCK 1', zone: 'playfield', x: 96, y: 442, size: 12, color: 'cyan' },
  'lamp.lockB': { kind: 'lamp', label: 'LOCK 2', zone: 'playfield', x: 200, y: 442, size: 12, color: 'cyan' },
  'lamp.lockC': { kind: 'lamp', label: 'LOCK 3', zone: 'playfield', x: 304, y: 442, size: 12, color: 'cyan' },
  'coil.release': { kind: 'coil', label: 'BALL RELEASE', zone: 'playfield', x: 200, y: 476, sound: 'ballrelease', pulse: true },

  'lamp.bonus2x': { kind: 'lamp', label: '2X', zone: 'playfield', x: 108, y: 512, size: 12, color: 'lime' },
  'lamp.bonus3x': { kind: 'lamp', label: '3X', zone: 'playfield', x: 200, y: 512, size: 12, color: 'lime' },
  'lamp.bonus4x': { kind: 'lamp', label: '4X', zone: 'playfield', x: 292, y: 512, size: 12, color: 'lime' },

  // --- lower playfield ----------------------------------------------------
  'slingshot.left': { kind: 'sling', label: 'SLING L', zone: 'playfield', x: 96, y: 560, flip: -1, sound: 'left_slingshot' },
  'slingshot.right': { kind: 'sling', label: 'SLING R', zone: 'playfield', x: 304, y: 560, flip: 1, sound: 'right_slingshot' },
  'flipper.left': { kind: 'flipper', label: 'FLIPPER L', zone: 'playfield', x: 128, y: 632, flip: -1, sound: 'fx_Flipperup' },
  'flipper.right': { kind: 'flipper', label: 'FLIPPER R', zone: 'playfield', x: 272, y: 632, flip: 1, sound: 'fx_Flipperup' },
  'coil.kickback': { kind: 'coil', label: 'KICKBACK', zone: 'playfield', x: 52, y: 618, sound: 'popper_ball', pulse: true },
  'lamp.kickbackArmed': { kind: 'lamp', label: 'ARMED', zone: 'playfield', x: 52, y: 582, size: 10, color: 'red' },
  'coil.autoLaunch': { kind: 'coil', label: 'AUTO LAUNCH', zone: 'playfield', x: 348, y: 618, sound: 'plunger', pulse: true },
};

export function part(id) {
  const found = PARTS[id];
  if (!found) throw new Error(`Unknown machine part: ${id}`);
  return { id, ...found };
}

export function partIds() {
  return Object.keys(PARTS);
}

export function hasPart(id) {
  return Object.prototype.hasOwnProperty.call(PARTS, id);
}
