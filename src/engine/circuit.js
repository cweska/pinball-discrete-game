/**
 * Circuit graph model.
 *
 * A circuit holds three kinds of node:
 *   - input terminals  (one output pin, driven from outside the circuit)
 *   - output terminals (one input pin, read by the machine)
 *   - gates            (1-2 input pins, one output pin)
 *
 * Slot levels declare their wiring up front in `level.prewired`, referencing
 * slot ids that hold no gate yet. Those wires live in the circuit from the
 * start and simply read as undriven until a gate lands in the slot, which is
 * what lets the bench draw a half-finished machine.
 */

import { gateDef, OUT } from './gates.js';

export const IN_PIN = 'in';

/**
 * Parse a wire endpoint. `'s1.a'` is explicit; a bare `'btnL'` takes the
 * default pin for that end of the wire (source pins are outputs, sink pins
 * are inputs).
 */
export function parseEndpoint(ref, side) {
  if (ref && typeof ref === 'object') return { node: ref.node, pin: ref.pin };
  const dot = String(ref).indexOf('.');
  if (dot === -1) return { node: String(ref), pin: side === 'from' ? OUT : IN_PIN };
  return { node: String(ref).slice(0, dot), pin: String(ref).slice(dot + 1) };
}

export function pinKey(node, pin) {
  return `${node}.${pin}`;
}

export function endpointKey(endpoint) {
  return pinKey(endpoint.node, endpoint.pin);
}

let wireSeq = 0;

/** Wire ids have to stay unique across restores, so they come from one counter. */
function nextWireId() {
  return `w${++wireSeq}`;
}

export class Circuit {
  constructor({ inputs = [], outputs = [], slots = [] } = {}) {
    this.inputs = inputs.map((t) => ({ ...t }));
    this.outputs = outputs.map((t) => ({ ...t }));
    this.slots = slots.map((s) => ({ ...s }));
    /** @type {Map<string, {id: string, type: string, x: number, y: number, slot: string|null, fixed: boolean}>} */
    this.gates = new Map();
    /** @type {Array<{id: string, from: {node: string, pin: string}, to: {node: string, pin: string}, fixed: boolean}>} */
    this.wires = [];
    this.gateSeq = 0;
  }

  // --- terminals -----------------------------------------------------------

  inputIds() {
    return this.inputs.map((t) => t.id);
  }

  outputIds() {
    return this.outputs.map((t) => t.id);
  }

  isInputTerminal(id) {
    return this.inputs.some((t) => t.id === id);
  }

  isOutputTerminal(id) {
    return this.outputs.some((t) => t.id === id);
  }

  // --- gates ---------------------------------------------------------------

  slot(id) {
    return this.slots.find((s) => s.id === id) || null;
  }

  /** Slots accept one gate each; the gate takes the slot's id as its node id. */
  slotIsFree(slotId) {
    return !this.gates.has(slotId);
  }

  nextGateId() {
    let id;
    do {
      id = `g${++this.gateSeq}`;
    } while (this.gates.has(id));
    return id;
  }

  addGate({ id, type, x = 0, y = 0, slot = null, fixed = false }) {
    gateDef(type);
    const gateId = id || slot || this.nextGateId();
    if (this.gates.has(gateId)) throw new Error(`Node id already in use: ${gateId}`);
    if (this.isInputTerminal(gateId) || this.isOutputTerminal(gateId)) {
      throw new Error(`Node id collides with a terminal: ${gateId}`);
    }
    const gate = { id: gateId, type, x, y, slot, fixed };
    this.gates.set(gateId, gate);
    return gate;
  }

  removeGate(id) {
    const gate = this.gates.get(id);
    if (!gate || gate.fixed) return false;
    this.gates.delete(id);
    // Student wires touching the gate go with it; declared level wiring stays
    // so the socket keeps its pre-drawn leads.
    this.wires = this.wires.filter(
      (w) => w.fixed || (w.from.node !== id && w.to.node !== id)
    );
    return true;
  }

  gate(id) {
    return this.gates.get(id) || null;
  }

  gateList() {
    return [...this.gates.values()];
  }

  countByType() {
    const counts = {};
    for (const gate of this.gates.values()) {
      if (gate.fixed) continue;
      counts[gate.type] = (counts[gate.type] || 0) + 1;
    }
    return counts;
  }

  // --- pins ----------------------------------------------------------------

  /** Input pins of a node, or [] for things that only emit. */
  inputPins(nodeId) {
    if (this.isOutputTerminal(nodeId)) return [IN_PIN];
    if (this.isInputTerminal(nodeId)) return [];
    const gate = this.gates.get(nodeId);
    if (gate) return gateDef(gate.type).inputs;
    const slot = this.slot(nodeId);
    if (slot) return slotPins(slot).inputs;
    return [];
  }

  hasOutputPin(nodeId) {
    if (this.isInputTerminal(nodeId)) return true;
    if (this.isOutputTerminal(nodeId)) return false;
    return this.gates.has(nodeId) || !!this.slot(nodeId);
  }

  // --- wires ---------------------------------------------------------------

  wireInto(endpoint) {
    const key = endpointKey(endpoint);
    return this.wires.find((w) => endpointKey(w.to) === key) || null;
  }

  wiresFrom(endpoint) {
    const key = endpointKey(endpoint);
    return this.wires.filter((w) => endpointKey(w.from) === key);
  }

  /**
   * @returns {{ok: true, wire: object}|{ok: false, reason: string}}
   */
  connect(fromRef, toRef, { fixed = false } = {}) {
    const from = parseEndpoint(fromRef, 'from');
    const to = parseEndpoint(toRef, 'to');

    if (!fixed) {
      if (!this.hasOutputPin(from.node) || from.pin !== OUT) {
        return { ok: false, reason: 'A wire has to start at an output pin.' };
      }
      if (!this.inputPins(to.node).includes(to.pin)) {
        return { ok: false, reason: 'A wire has to end at an input pin.' };
      }
      if (from.node === to.node) {
        return { ok: false, reason: 'A gate cannot connect directly to itself.' };
      }
      const existing = this.wires.find(
        (w) => endpointKey(w.from) === endpointKey(from) && endpointKey(w.to) === endpointKey(to)
      );
      if (existing) return { ok: false, reason: 'Those two pins are already connected.' };
    }

    // One driver per input pin: a new wire replaces whatever was there.
    const occupied = this.wireInto(to);
    if (occupied) {
      if (occupied.fixed && !fixed) {
        return { ok: false, reason: 'That input already has a wire from the machine. You cannot replace it.' };
      }
      this.wires = this.wires.filter((w) => w !== occupied);
    }

    const wire = { id: nextWireId(), from, to, fixed };
    this.wires.push(wire);
    return { ok: true, wire };
  }

  disconnect(wireId) {
    const wire = this.wires.find((w) => w.id === wireId);
    if (!wire || wire.fixed) return false;
    this.wires = this.wires.filter((w) => w !== wire);
    return true;
  }

  /** Everything the student added, as a restorable snapshot. */
  snapshot() {
    return {
      gates: this.gateList()
        .filter((g) => !g.fixed)
        .map((g) => ({ ...g })),
      wires: this.wires.filter((w) => !w.fixed).map((w) => ({ ...w, from: { ...w.from }, to: { ...w.to } })),
      gateSeq: this.gateSeq,
    };
  }

  restore(snapshot) {
    for (const gate of this.gateList()) if (!gate.fixed) this.gates.delete(gate.id);
    this.wires = this.wires.filter((w) => w.fixed);
    for (const gate of snapshot.gates) this.gates.set(gate.id, { ...gate });
    for (const wire of snapshot.wires) {
      const occupied = this.wireInto(wire.to);
      if (occupied && !occupied.fixed) this.wires = this.wires.filter((w) => w !== occupied);
      this.wires.push({ ...wire, id: nextWireId(), from: { ...wire.from }, to: { ...wire.to } });
    }
    this.gateSeq = snapshot.gateSeq ?? this.gateSeq;
  }
}

/** A slot advertises the pins of the gates it accepts, so leads can be drawn early. */
export function slotPins(slot) {
  const accepts = slot.accepts && slot.accepts.length ? slot.accepts : ['NAND'];
  const inputs = [];
  for (const type of accepts) {
    for (const pin of gateDef(type).inputs) if (!inputs.includes(pin)) inputs.push(pin);
  }
  return { inputs, outputs: [OUT] };
}

/**
 * Build the starting circuit for a level: terminals, slots, any gates the
 * machine supplies already, and the declared wiring.
 */
export function circuitFromLevel(level) {
  const circuit = new Circuit({
    inputs: level.io.inputs,
    outputs: level.io.outputs,
    slots: level.slots || [],
  });
  for (const gate of level.given || []) {
    circuit.addGate({ ...gate, fixed: true });
  }
  for (const [from, to] of level.prewired || []) {
    circuit.connect(from, to, { fixed: true });
  }
  return circuit;
}

/** Apply a level's reference solution. Used by the solvability tests and nothing else. */
export function applySolution(circuit, solution) {
  for (const gate of solution.gates || []) {
    circuit.addGate({ id: gate.id || gate.slot, type: gate.type, x: gate.x || 0, y: gate.y || 0, slot: gate.slot || null });
  }
  for (const [from, to] of solution.wires || []) {
    const result = circuit.connect(from, to);
    if (!result.ok) throw new Error(`Reference wiring rejected (${from} -> ${to}): ${result.reason}`);
  }
  return circuit;
}
