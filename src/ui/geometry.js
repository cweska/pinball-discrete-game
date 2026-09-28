/**
 * Bench geometry. Everything that has to agree about where a pin sits - the
 * renderer, the drag handlers, the wire paths and the pulse dots - reads it
 * from here.
 */

import { gateDef, OUT } from '../engine/gates.js';
import { IN_PIN, slotPins } from '../engine/circuit.js';

export const BENCH_VIEW = { width: 900, height: 480 };

export const GATE = { w: 84, h: 50, pinGap: 13 };

export const RAIL = {
  inputX: 14,
  inputWidth: 140,
  outputX: 746,
  outputWidth: 140,
  top: 44,
  bottom: 436,
};

export const WORK_AREA = { x: 186, y: 34, width: 530, height: 412 };

export function railSpots(count, { top = RAIL.top, bottom = RAIL.bottom } = {}) {
  if (count === 1) return [(top + bottom) / 2];
  const span = bottom - top;
  const step = Math.min(96, span / (count - 1));
  const height = step * (count - 1);
  const start = (top + bottom) / 2 - height / 2;
  return Array.from({ length: count }, (_, index) => start + index * step);
}

export function terminalBox(kind, index, count) {
  const y = railSpots(count)[index];
  const isInput = kind === 'input';
  return {
    x: isInput ? RAIL.inputX : RAIL.outputX,
    y: y - 19,
    width: isInput ? RAIL.inputWidth : RAIL.outputWidth,
    height: 38,
    centerY: y,
    pin: {
      x: isInput ? RAIL.inputX + RAIL.inputWidth + 10 : RAIL.outputX - 10,
      y,
    },
  };
}

/** Pin offsets relative to the center of a gate box. */
export function pinOffsets(inputs) {
  const offsets = { [OUT]: { x: GATE.w / 2, y: 0 } };
  if (inputs.length === 1) {
    offsets[inputs[0]] = { x: -GATE.w / 2, y: 0 };
  } else {
    inputs.forEach((pin, index) => {
      offsets[pin] = { x: -GATE.w / 2, y: index === 0 ? -GATE.pinGap : GATE.pinGap };
    });
  }
  return offsets;
}

export function gatePinPositions(node) {
  const inputs = node.type ? gateDef(node.type).inputs : slotPins(node).inputs;
  const offsets = pinOffsets(inputs);
  const positions = {};
  for (const [pin, offset] of Object.entries(offsets)) {
    positions[pin] = { x: node.x + offset.x, y: node.y + offset.y };
  }
  return positions;
}

/**
 * Where a given node.pin lives on the bench, for any node kind.
 */
export function pinPosition(circuit, level, node, pin) {
  const inputIndex = circuit.inputs.findIndex((t) => t.id === node);
  if (inputIndex !== -1) return terminalBox('input', inputIndex, circuit.inputs.length).pin;

  const outputIndex = circuit.outputs.findIndex((t) => t.id === node);
  if (outputIndex !== -1) return terminalBox('output', outputIndex, circuit.outputs.length).pin;

  const gate = circuit.gate(node);
  if (gate) return gatePinPositions(gate)[pin] || { x: gate.x, y: gate.y };

  const slot = circuit.slot(node);
  if (slot) return gatePinPositions(slot)[pin] || { x: slot.x, y: slot.y };

  return { x: BENCH_VIEW.width / 2, y: BENCH_VIEW.height / 2 };
}

/**
 * Wire path. Forward wires get a gentle S-curve; wires that run backwards -
 * the cross-coupling in a latch - swing out sideways so both legs stay visible.
 */
export function wirePath(from, to) {
  const dx = to.x - from.x;
  if (dx > 24) {
    const bend = Math.max(30, Math.min(120, dx * 0.5));
    return `M ${from.x} ${from.y} C ${from.x + bend} ${from.y}, ${to.x - bend} ${to.y}, ${to.x} ${to.y}`;
  }
  const reach = 46 + Math.min(70, Math.abs(dx) * 0.5);
  const lift = to.y >= from.y ? 1 : -1;
  const midY = (from.y + to.y) / 2 + lift * 26;
  return [
    `M ${from.x} ${from.y}`,
    `C ${from.x + reach} ${from.y}, ${from.x + reach} ${midY}, ${(from.x + to.x) / 2} ${midY}`,
    `C ${to.x - reach} ${midY}, ${to.x - reach} ${to.y}, ${to.x} ${to.y}`,
  ].join(' ');
}

export function clampToWorkArea(x, y) {
  const pad = 6;
  return {
    x: Math.min(Math.max(x, WORK_AREA.x + GATE.w / 2 + pad), WORK_AREA.x + WORK_AREA.width - GATE.w / 2 - pad),
    y: Math.min(Math.max(y, WORK_AREA.y + GATE.h / 2 + pad), WORK_AREA.y + WORK_AREA.height - GATE.h / 2 - pad),
  };
}

/** Evenly spread parking spots used by keyboard placement on free-form levels. */
export function keyboardSpots() {
  const cols = [0.2, 0.5, 0.8];
  const rows = [0.18, 0.42, 0.66, 0.9];
  const spots = [];
  rows.forEach((ry, rowIndex) => {
    cols.forEach((rx, colIndex) => {
      spots.push({
        id: `spot-${rowIndex}-${colIndex}`,
        label: `row ${rowIndex + 1}, column ${colIndex + 1}`,
        x: Math.round(WORK_AREA.x + WORK_AREA.width * rx),
        y: Math.round(WORK_AREA.y + WORK_AREA.height * ry),
      });
    });
  });
  return spots;
}

export const PIN_HIT_RADIUS = 22;
export { IN_PIN, OUT };
