/**
 * The bench: the SVG circuit editor.
 *
 * Three ways to do everything, because a class of thirty will have all three:
 * drag a gate from the parts bin, click the bin then click a socket, or tab to
 * a socket and press Enter. Wires work the same way - drag pin to pin, or click
 * one pin then the other.
 */

import { gateDef } from '../engine/gates.js';
import { IN_PIN, OUT, slotPins } from '../engine/circuit.js';
import { clear, setClass, svg, svgPoint } from '../util/dom.js';
import {
  BENCH_VIEW,
  GATE,
  PIN_HIT_RADIUS,
  WORK_AREA,
  clampToWorkArea,
  gatePinPositions,
  keyboardSpots,
  pinPosition,
  terminalBox,
  wirePath,
} from './geometry.js';

const GLYPHS = {
  AND: (g) => g.append(svg('path', { class: 'glyph__body', d: 'M -13 -9 L -2 -9 A 9 9 0 0 1 -2 9 L -13 9 Z' })),
  NAND: (g) =>
    g.append(
      svg('path', { class: 'glyph__body', d: 'M -15 -9 L -4 -9 A 9 9 0 0 1 -4 9 L -15 9 Z' }),
      svg('circle', { class: 'glyph__bubble', cx: 9, cy: 0, r: 3.2 })
    ),
  OR: (g) =>
    g.append(svg('path', { class: 'glyph__body', d: 'M -14 -9 Q -3 -9 9 0 Q -3 9 -14 9 Q -8 0 -14 -9 Z' })),
  XOR: (g) =>
    g.append(
      svg('path', { class: 'glyph__body', d: 'M -11 -9 Q 0 -9 12 0 Q 0 9 -11 9 Q -5 0 -11 -9 Z' }),
      svg('path', { class: 'glyph__arc', d: 'M -16 -9 Q -10 0 -16 9' })
    ),
  INV: (g) =>
    g.append(
      svg('path', { class: 'glyph__body', d: 'M -12 -9 L 5 0 L -12 9 Z' }),
      svg('circle', { class: 'glyph__bubble', cx: 8.5, cy: 0, r: 3.2 })
    ),
};

export function gateGlyph(type, className = 'glyph') {
  const group = svg('g', { class: className });
  (GLYPHS[type] || GLYPHS.AND)(group);
  return group;
}

export function createBench(root, options = {}) {
  const view = svg('svg', {
    class: 'bench',
    viewBox: `0 0 ${BENCH_VIEW.width} ${BENCH_VIEW.height}`,
    role: 'application',
    'aria-label': 'Circuit bench',
  });
  const layers = {
    frame: svg('g', { class: 'bench-frame' }),
    slots: svg('g', { class: 'bench-slots' }),
    wires: svg('g', { class: 'bench-wires' }),
    dots: svg('g', { class: 'bench-dots' }),
    nodes: svg('g', { class: 'bench-nodes' }),
    overlay: svg('g', { class: 'bench-overlay' }),
  };
  view.append(layers.frame, layers.slots, layers.wires, layers.dots, layers.nodes, layers.overlay);
  root.append(view);

  let level = null;
  let circuit = null;
  let armedType = null;
  let pendingPin = null;
  let selected = null;
  let drag = null;
  const wireVisuals = new Map();
  const valueBadges = new Map();
  let showValues = true;

  const notify = (reason) => options.onChange?.(reason);
  const say = (message, tone) => options.onStatus?.(message, tone);
  const sound = (name) => options.onSound?.(name);

  // --- building ------------------------------------------------------------

  function terminalNode(terminal, kind, index, count) {
    const box = terminalBox(kind, index, count);
    const isInput = kind === 'input';
    const group = svg('g', {
      class: `terminal terminal--${kind}`,
      dataset: { terminal: terminal.id },
    });
    group.append(
      svg('rect', { class: 'terminal__box', x: box.x, y: box.y, width: box.width, height: box.height, rx: 7 }),
      svg('text', {
        class: 'terminal__label',
        x: box.x + box.width / 2,
        y: box.centerY - 2,
        text: terminal.label,
      }),
      terminal.note
        ? svg('text', { class: 'terminal__note', x: box.x + box.width / 2, y: box.centerY + 11, text: terminal.note })
        : null,
      svg('line', {
        class: 'terminal__lead',
        x1: isInput ? box.x + box.width : box.x,
        y1: box.centerY,
        x2: box.pin.x,
        y2: box.pin.y,
      })
    );
    group.append(pinNode(terminal.id, isInput ? OUT : IN_PIN, box.pin, isInput ? 'out' : 'in', terminal.label));
    const badge = svg('text', {
      class: 'value-badge',
      x: box.pin.x + (isInput ? 16 : -16),
      y: box.pin.y + 4,
      text: '0',
    });
    group.append(badge);
    valueBadges.set(`${terminal.id}.${isInput ? OUT : IN_PIN}`, badge);
    return group;
  }

  function pinNode(nodeId, pin, position, direction, ownerLabel) {
    const group = svg('g', { class: `pin pin--${direction}`, dataset: { node: nodeId, pin } });
    const role = direction === 'out' ? 'output' : `input ${pin.toUpperCase()}`;
    group.append(
      svg('circle', { class: 'pin__hit', cx: position.x, cy: position.y, r: PIN_HIT_RADIUS }),
      svg('circle', { class: 'pin__dot', cx: position.x, cy: position.y, r: 5 })
    );
    const hit = group.querySelector('.pin__hit');
    hit.setAttribute('tabindex', '0');
    hit.setAttribute('role', 'button');
    hit.setAttribute('aria-label', `${ownerLabel} ${role} pin`);
    return group;
  }

  function gateNode(gate) {
    const def = gateDef(gate.type);
    const group = svg('g', {
      class: `gate gate--${gate.type}${gate.fixed ? ' gate--fixed' : ''}`,
      dataset: { gate: gate.id },
    });
    group.append(
      svg('rect', {
        class: 'gate__body',
        x: gate.x - GATE.w / 2,
        y: gate.y - GATE.h / 2,
        width: GATE.w,
        height: GATE.h,
        rx: 8,
        tabindex: '0',
        role: 'button',
        'aria-label': `${def.label} gate. Press Delete to remove it.`,
      })
    );
    const glyph = gateGlyph(gate.type);
    glyph.setAttribute('transform', `translate(${gate.x} ${gate.y - 8})`);
    group.append(glyph, svg('text', { class: 'gate__label', x: gate.x, y: gate.y + 19, text: def.label }));

    const pins = gatePinPositions(gate);
    for (const pin of def.inputs) group.append(pinNode(gate.id, pin, pins[pin], 'in', def.label));
    group.append(pinNode(gate.id, OUT, pins[OUT], 'out', def.label));

    const badge = svg('text', { class: 'value-badge', x: pins[OUT].x + 15, y: pins[OUT].y - 9, text: '0' });
    group.append(badge);
    valueBadges.set(`${gate.id}.${OUT}`, badge);

    if (!gate.fixed) {
      const remove = svg('g', { class: 'gate__remove', dataset: { remove: gate.id } });
      remove.append(
        svg('circle', { class: 'gate__remove-dot', cx: gate.x + GATE.w / 2 - 6, cy: gate.y - GATE.h / 2 + 6, r: 9 }),
        svg('text', { class: 'gate__remove-x', x: gate.x + GATE.w / 2 - 6, y: gate.y - GATE.h / 2 + 10, text: '\u00d7' })
      );
      group.append(remove);
    }
    return group;
  }

  function slotNode(slot) {
    const free = circuit.slotIsFree(slot.id);
    const accepts = slot.accepts.map((type) => gateDef(type).label).join(' or ');
    const group = svg('g', {
      class: `slot${free ? '' : ' slot--filled'}`,
      dataset: { slot: slot.id },
    });
    group.append(
      svg('rect', {
        class: 'slot__box',
        x: slot.x - GATE.w / 2,
        y: slot.y - GATE.h / 2,
        width: GATE.w,
        height: GATE.h,
        rx: 8,
        tabindex: free ? '0' : null,
        role: 'button',
        'aria-label': `Empty socket, accepts ${accepts}`,
      })
    );
    if (free) {
      group.append(svg('text', { class: 'slot__hint', x: slot.x, y: slot.y + 5, text: 'socket' }));
      const pins = gatePinPositions(slot);
      for (const pin of slotPins(slot).inputs) {
        group.append(svg('circle', { class: 'slot__pin', cx: pins[pin].x, cy: pins[pin].y, r: 4 }));
      }
      group.append(svg('circle', { class: 'slot__pin', cx: pins[OUT].x, cy: pins[OUT].y, r: 4 }));
    }
    return group;
  }

  function spotNodes() {
    if (level.placement !== 'free') return [];
    return keyboardSpots().map((spot) =>
      svg('g', { class: 'spot', dataset: { spot: spot.id, x: spot.x, y: spot.y } },
        svg('rect', {
          class: 'spot__box',
          x: spot.x - GATE.w / 2,
          y: spot.y - GATE.h / 2,
          width: GATE.w,
          height: GATE.h,
          rx: 8,
          tabindex: '0',
          role: 'button',
          'aria-label': `Bench spot ${spot.label}. Press Enter to place the selected gate here.`,
        })
      )
    );
  }

  function wireNode(wire) {
    const from = pinPosition(circuit, level, wire.from.node, wire.from.pin);
    const to = pinPosition(circuit, level, wire.to.node, wire.to.pin);
    const d = wirePath(from, to);
    const group = svg('g', { class: `wire${wire.fixed ? ' wire--fixed' : ''}`, dataset: { wire: wire.id } });
    const path = svg('path', { class: 'wire__line', d });
    const hit = svg('path', { class: 'wire__hit', d, dataset: { wire: wire.id } });
    if (!wire.fixed) hit.append(svg('title', {}, 'Click to remove this wire'));
    group.append(hit, path);
    return { group, path };
  }

  function render() {
    clear(layers.frame);
    clear(layers.slots);
    clear(layers.wires);
    clear(layers.dots);
    clear(layers.nodes);
    clear(layers.overlay);
    wireVisuals.clear();
    valueBadges.clear();

    layers.frame.append(
      svg('rect', {
        class: 'bench-work',
        x: WORK_AREA.x,
        y: WORK_AREA.y,
        width: WORK_AREA.width,
        height: WORK_AREA.height,
        rx: 12,
      }),
      svg('text', { class: 'bench-rail-label', x: 84, y: 26, text: 'FROM THE MACHINE' }),
      svg('text', { class: 'bench-rail-label', x: 816, y: 26, text: 'TO THE MACHINE' })
    );

    for (const slot of circuit.slots) layers.slots.append(slotNode(slot));
    for (const spot of spotNodes()) layers.slots.append(spot);

    for (const wire of circuit.wires) {
      const visual = wireNode(wire);
      layers.wires.append(visual.group);
      const dots = [svg('circle', { class: 'flow-dot', r: 3.4 }), svg('circle', { class: 'flow-dot', r: 3.4 })];
      for (const dot of dots) layers.dots.append(dot);
      wireVisuals.set(wire.id, { ...visual, dots, length: 0, wire });
    }

    circuit.inputs.forEach((terminal, index) =>
      layers.nodes.append(terminalNode(terminal, 'input', index, circuit.inputs.length))
    );
    circuit.outputs.forEach((terminal, index) =>
      layers.nodes.append(terminalNode(terminal, 'output', index, circuit.outputs.length))
    );
    for (const gate of circuit.gateList()) layers.nodes.append(gateNode(gate));

    // Path lengths are needed for the flow dots and never change once drawn.
    for (const visual of wireVisuals.values()) visual.length = visual.path.getTotalLength();

    refreshDecorations();
  }

  function refreshDecorations() {
    setClass(view, 'is-armed', !!armedType);
    setClass(view, 'is-wiring', !!pendingPin);
    for (const node of view.querySelectorAll('.gate')) {
      setClass(node, 'is-selected', !!selected && selected.kind === 'gate' && selected.id === node.dataset.gate);
    }
    for (const node of view.querySelectorAll('.pin')) {
      setClass(
        node,
        'is-pending',
        !!pendingPin && pendingPin.node === node.dataset.node && pendingPin.pin === node.dataset.pin
      );
    }
    for (const node of view.querySelectorAll('.slot')) {
      const slot = circuit.slot(node.dataset.slot);
      setClass(node, 'is-available', !!armedType && slot && slot.accepts.includes(armedType) && circuit.slotIsFree(slot.id));
    }
  }

  // --- actions -------------------------------------------------------------

  function placeGate(type, position, slotId = null) {
    if (!type) return false;
    const counts = circuit.countByType();
    const allowance = (level.palette.find((entry) => entry.type === type) || {}).count ?? 0;
    if ((counts[type] || 0) >= allowance) {
      sound('reject');
      say(`The bin is out of ${gateDef(type).label} gates. Remove one first.`, 'warn');
      return false;
    }
    if (level.placement === 'slots') {
      const slot = slotId ? circuit.slot(slotId) : nearestSlot(position, type);
      if (!slot) {
        sound('reject');
        say('On this one, gates have to go into a socket.', 'warn');
        return false;
      }
      if (!slot.accepts.includes(type)) {
        sound('reject');
        say(`That socket does not take a ${gateDef(type).label}.`, 'warn');
        return false;
      }
      options.beforeChange?.();
      circuit.addGate({ slot: slot.id, type, x: slot.x, y: slot.y });
    } else {
      const spot = clampToWorkArea(position.x, position.y);
      options.beforeChange?.();
      circuit.addGate({ type, x: Math.round(spot.x), y: Math.round(spot.y) });
    }
    sound('place');
    armedType = null;
    options.onArmedChange?.(null);
    render();
    notify('place');
    return true;
  }

  function nearestSlot(position, type) {
    let best = null;
    let bestDistance = Infinity;
    for (const slot of circuit.slots) {
      if (!circuit.slotIsFree(slot.id) || !slot.accepts.includes(type)) continue;
      const distance = Math.hypot(slot.x - position.x, slot.y - position.y);
      if (distance < bestDistance) {
        best = slot;
        bestDistance = distance;
      }
    }
    return bestDistance < 160 ? best : best; // always snap to the closest usable socket
  }

  function removeGate(id) {
    const gate = circuit.gate(id);
    if (!gate || gate.fixed) return;
    options.beforeChange?.();
    circuit.removeGate(id);
    selected = null;
    sound('cut');
    render();
    notify('remove');
  }

  function removeWire(id) {
    const wire = circuit.wires.find((w) => w.id === id);
    if (!wire || wire.fixed) return;
    options.beforeChange?.();
    circuit.disconnect(id);
    sound('cut');
    render();
    notify('unwire');
    say('Wire removed. Ctrl+Z puts it back.', 'info');
  }

  function tryConnect(a, b) {
    const first = a;
    const second = b;
    const source = first.pin === OUT ? first : second;
    const sink = first.pin === OUT ? second : first;
    if (source.pin !== OUT || sink.pin === OUT) {
      sound('reject');
      say('A wire runs from an output pin to an input pin.', 'warn');
      return false;
    }
    options.beforeChange?.();
    const result = circuit.connect({ node: source.node, pin: source.pin }, { node: sink.node, pin: sink.pin });
    if (!result.ok) {
      sound('reject');
      say(result.reason, 'warn');
      return false;
    }
    sound('wire');
    render();
    notify('wire');
    return true;
  }

  function pinFromEvent(event) {
    const element = document.elementFromPoint(event.clientX, event.clientY);
    const pin = element && element.closest ? element.closest('.pin') : null;
    if (!pin || !view.contains(pin)) return null;
    return { node: pin.dataset.node, pin: pin.dataset.pin };
  }

  function slotFromEvent(event) {
    const element = document.elementFromPoint(event.clientX, event.clientY);
    const slot = element && element.closest ? element.closest('.slot, .spot') : null;
    if (!slot || !view.contains(slot)) return null;
    if (slot.classList.contains('spot')) {
      return { spot: true, x: Number(slot.dataset.x), y: Number(slot.dataset.y) };
    }
    return { slotId: slot.dataset.slot };
  }

  // --- pointer plumbing ----------------------------------------------------

  function beginGhost(type, event) {
    const ghost = svg('g', { class: 'ghost' });
    ghost.append(
      svg('rect', { class: 'ghost__body', x: -GATE.w / 2, y: -GATE.h / 2, width: GATE.w, height: GATE.h, rx: 8 }),
      svg('text', { class: 'ghost__label', x: 0, y: 5, text: gateDef(type).label })
    );
    layers.overlay.append(ghost);
    drag = { kind: 'newGate', type, ghost };
    moveGhost(event);
  }

  function moveGhost(event) {
    if (!drag || !drag.ghost) return;
    const point = svgPoint(view, event);
    drag.ghost.setAttribute('transform', `translate(${point.x} ${point.y})`);
  }

  function endDrag(event) {
    if (!drag) return;
    const current = drag;
    drag = null;
    current.ghost?.remove();
    if (current.kind === 'newGate') {
      const point = svgPoint(view, event);
      const target = slotFromEvent(event);
      const inside = point.x > WORK_AREA.x - 40 && point.x < BENCH_VIEW.width && point.y > 0 && point.y < BENCH_VIEW.height;
      if (target && target.slotId) placeGate(current.type, point, target.slotId);
      else if (target && target.spot) placeGate(current.type, { x: target.x, y: target.y });
      else if (inside) placeGate(current.type, point);
      else refreshDecorations();
    } else if (current.kind === 'moveGate') {
      render();
      notify('move');
    } else if (current.kind === 'wire') {
      layers.overlay.querySelector('.pending-wire')?.remove();
      const target = pinFromEvent(event);
      if (target && (target.node !== current.from.node || target.pin !== current.from.pin)) {
        tryConnect(current.from, target);
        pendingPin = null;
      } else {
        // A click without a drag leaves the pin armed for a second click.
        pendingPin = current.from;
        say('Now click the pin you want to connect it to.', 'info');
      }
      refreshDecorations();
    }
  }

  function onPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    const target = event.target;
    const pinGroup = target.closest?.('.pin');
    const removeBadge = target.closest?.('[data-remove]');
    const wireHit = target.closest?.('.wire__hit');
    const gateGroup = target.closest?.('.gate');
    const slotGroup = target.closest?.('.slot');
    const spotGroup = target.closest?.('.spot');

    if (removeBadge) {
      removeGate(removeBadge.dataset.remove);
      return;
    }
    if (pinGroup) {
      event.preventDefault();
      const pin = { node: pinGroup.dataset.node, pin: pinGroup.dataset.pin };
      if (pendingPin) {
        const done = tryConnect(pendingPin, pin);
        pendingPin = done ? null : pendingPin;
        refreshDecorations();
        return;
      }
      drag = { kind: 'wire', from: pin };
      const path = svg('path', { class: 'pending-wire', d: '' });
      layers.overlay.append(path);
      onPointerMove(event);
      return;
    }
    if (wireHit) {
      removeWire(wireHit.dataset.wire);
      return;
    }
    if (slotGroup && armedType) {
      placeGate(armedType, { x: 0, y: 0 }, slotGroup.dataset.slot);
      return;
    }
    if (spotGroup && armedType) {
      placeGate(armedType, { x: Number(spotGroup.dataset.x), y: Number(spotGroup.dataset.y) });
      return;
    }
    if (gateGroup) {
      const gate = circuit.gate(gateGroup.dataset.gate);
      selected = { kind: 'gate', id: gateGroup.dataset.gate };
      if (gate && !gate.fixed && level.placement === 'free') {
        const point = svgPoint(view, event);
        drag = { kind: 'moveGate', id: gate.id, dx: gate.x - point.x, dy: gate.y - point.y };
      }
      refreshDecorations();
      return;
    }
    if (armedType) {
      placeGate(armedType, svgPoint(view, event));
      return;
    }
    if (pendingPin) {
      pendingPin = null;
      say('Wire cancelled.', 'info');
    }
    selected = null;
    refreshDecorations();
  }

  function onPointerMove(event) {
    if (!drag) return;
    if (drag.kind === 'newGate') {
      moveGhost(event);
      return;
    }
    const point = svgPoint(view, event);
    if (drag.kind === 'moveGate') {
      const gate = circuit.gate(drag.id);
      if (!gate) return;
      const spot = clampToWorkArea(point.x + drag.dx, point.y + drag.dy);
      gate.x = Math.round(spot.x);
      gate.y = Math.round(spot.y);
      redrawGate(gate);
      return;
    }
    if (drag.kind === 'wire') {
      const from = pinPosition(circuit, level, drag.from.node, drag.from.pin);
      const path = layers.overlay.querySelector('.pending-wire');
      if (path) {
        const forward = drag.from.pin === OUT;
        path.setAttribute('d', forward ? wirePath(from, point) : wirePath(point, from));
      }
    }
  }

  function redrawGate(gate) {
    const node = view.querySelector(`.gate[data-gate="${gate.id}"]`);
    if (!node) return;
    const fresh = gateNode(gate);
    node.replaceWith(fresh);
    for (const wire of circuit.wires) {
      if (wire.from.node !== gate.id && wire.to.node !== gate.id) continue;
      const visual = wireVisuals.get(wire.id);
      if (!visual) continue;
      const d = wirePath(
        pinPosition(circuit, level, wire.from.node, wire.from.pin),
        pinPosition(circuit, level, wire.to.node, wire.to.pin)
      );
      visual.path.setAttribute('d', d);
      visual.group.querySelector('.wire__hit').setAttribute('d', d);
      visual.length = visual.path.getTotalLength();
    }
    refreshDecorations();
  }

  function onKeyDown(event) {
    const target = event.target;
    const isEnter = event.key === 'Enter' || event.key === ' ';
    if (isEnter) {
      const pin = target.closest?.('.pin');
      const slot = target.closest?.('.slot');
      const spot = target.closest?.('.spot');
      if (pin) {
        event.preventDefault();
        const here = { node: pin.dataset.node, pin: pin.dataset.pin };
        if (pendingPin) {
          if (tryConnect(pendingPin, here)) pendingPin = null;
        } else {
          pendingPin = here;
          say('Pin selected. Tab to the other pin and press Enter.', 'info');
        }
        refreshDecorations();
        return;
      }
      if (slot && armedType) {
        event.preventDefault();
        placeGate(armedType, { x: 0, y: 0 }, slot.dataset.slot);
        return;
      }
      if (spot && armedType) {
        event.preventDefault();
        placeGate(armedType, { x: Number(spot.dataset.x), y: Number(spot.dataset.y) });
        return;
      }
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      const gate = target.closest?.('.gate');
      if (gate) {
        event.preventDefault();
        removeGate(gate.dataset.gate);
      } else if (selected && selected.kind === 'gate') {
        event.preventDefault();
        removeGate(selected.id);
      }
      return;
    }
    if (event.key === 'Escape') {
      pendingPin = null;
      armedType = null;
      options.onArmedChange?.(null);
      refreshDecorations();
    }
  }

  view.addEventListener('pointerdown', onPointerDown);
  view.addEventListener('keydown', onKeyDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  // --- painting ------------------------------------------------------------

  function paint(sim, { phase = 0, animate = true } = {}) {
    for (const [wireId, visual] of wireVisuals) {
      const state = sim.wires.get(wireId) || { value: 0, driven: false };
      const group = visual.group;
      setClass(group, 'is-high', state.driven && state.value === 1);
      setClass(group, 'is-low', state.driven && state.value === 0);
      setClass(group, 'is-dark', !state.driven);

      const dotCount = state.driven ? (state.value ? 2 : 1) : 0;
      visual.dots.forEach((dot, index) => {
        if (index >= dotCount || !visual.length) {
          dot.setAttribute('opacity', '0');
          return;
        }
        const offset = (phase + index / dotCount) % 1;
        const point = visual.path.getPointAtLength(visual.length * (animate ? offset : 0.5));
        dot.setAttribute('cx', point.x);
        dot.setAttribute('cy', point.y);
        dot.setAttribute('opacity', '1');
        setClass(dot, 'is-high', state.value === 1);
      });
    }

    for (const [key, badge] of valueBadges) {
      const value = sim.pins.get(key);
      const driven = value !== undefined;
      badge.textContent = driven ? String(value) : '-';
      setClass(badge, 'is-high', driven && value === 1);
      badge.setAttribute('opacity', showValues ? '1' : '0');
    }

    for (const node of view.querySelectorAll('.pin')) {
      const value = sim.pins.get(`${node.dataset.node}.${node.dataset.pin}`);
      setClass(node, 'is-high', value === 1);
    }
  }

  // --- api -----------------------------------------------------------------

  return {
    view,
    setLevel(nextLevel, nextCircuit) {
      level = nextLevel;
      circuit = nextCircuit;
      armedType = null;
      pendingPin = null;
      selected = null;
      render();
    },
    render,
    paint,
    arm(type) {
      armedType = armedType === type ? null : type;
      pendingPin = null;
      refreshDecorations();
      return armedType;
    },
    get armed() {
      return armedType;
    },
    beginDragFromPalette(type, event) {
      armedType = type;
      refreshDecorations();
      beginGhost(type, event);
    },
    setShowValues(value) {
      showValues = !!value;
    },
    highlight(targets) {
      for (const node of view.querySelectorAll('.is-hinted')) node.classList.remove('is-hinted');
      for (const target of targets || []) {
        const node =
          view.querySelector(`.slot[data-slot="${target}"]`) ||
          view.querySelector(`.gate[data-gate="${target}"]`) ||
          view.querySelector(`.terminal[data-terminal="${target}"]`);
        if (node) node.classList.add('is-hinted');
      }
    },
    clearHighlights() {
      for (const node of view.querySelectorAll('.is-hinted')) node.classList.remove('is-hinted');
    },
  };
}
