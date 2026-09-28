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
    blurb: 'Output is 0 only when both inputs are 1',
    eval: ({ a, b }) => (a && b ? 0 : 1),
  },
  AND: {
    type: 'AND',
    label: 'AND',
    inputs: ['a', 'b'],
    blurb: 'Output is 1 only when both inputs are 1',
    eval: ({ a, b }) => (a && b ? 1 : 0),
  },
  OR: {
    type: 'OR',
    label: 'OR',
    inputs: ['a', 'b'],
    blurb: 'Output is 1 when at least one input is 1',
    eval: ({ a, b }) => (a || b ? 1 : 0),
  },
  INV: {
    type: 'INV',
    label: 'INVERT',
    inputs: ['a'],
    blurb: 'Turns 1 into 0, and 0 into 1',
    eval: ({ a }) => (a ? 0 : 1),
  },
  XOR: {
    type: 'XOR',
    label: 'XOR',
    inputs: ['a', 'b'],
    blurb: 'Output is 1 when the inputs are different',
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
