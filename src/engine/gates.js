/**
 * Gate definitions. Pure data plus a truth function per type.
 *
 * The set is deliberately limited to what the students have seen in NANDGAME's
 * logic-gate unit: NAND, INV, AND, OR, XOR.
 */

export const GATES = {
  NAND: {
    type: 'NAND',
    label: 'NAND',
    inputs: ['a', 'b'],
    blurb: 'LOW only when both inputs are HIGH',
    eval: ({ a, b }) => (a && b ? 0 : 1),
  },
  AND: {
    type: 'AND',
    label: 'AND',
    inputs: ['a', 'b'],
    blurb: 'HIGH only when both inputs are HIGH',
    eval: ({ a, b }) => (a && b ? 1 : 0),
  },
  OR: {
    type: 'OR',
    label: 'OR',
    inputs: ['a', 'b'],
    blurb: 'HIGH when either input is HIGH',
    eval: ({ a, b }) => (a || b ? 1 : 0),
  },
  INV: {
    type: 'INV',
    label: 'INVERT',
    inputs: ['a'],
    blurb: 'flips its input',
    eval: ({ a }) => (a ? 0 : 1),
  },
  XOR: {
    type: 'XOR',
    label: 'XOR',
    inputs: ['a', 'b'],
    blurb: 'HIGH when the inputs disagree',
    eval: ({ a, b }) => (a === b ? 0 : 1),
  },
};

export const GATE_ORDER = ['NAND', 'INV', 'AND', 'OR', 'XOR'];

export function gateDef(type) {
  const def = GATES[type];
  if (!def) throw new Error(`Unknown gate type: ${type}`);
  return def;
}

/** Every gate in this game has exactly one output pin. */
export const OUT = 'out';
