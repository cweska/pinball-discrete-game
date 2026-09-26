/**
 * The parts bin. Each entry shows the standard gate symbol, what it does, and
 * how many are left in the crate.
 *
 * A click arms the gate so the next click on a socket drops it in. A drag past
 * a few pixels starts a ghost instead, so the two gestures do not fight.
 */

import { gateDef } from '../engine/gates.js';
import { clear, h, setClass, svg } from '../util/dom.js';
import { gateGlyph } from './bench.js';

const DRAG_PX = 6;

export function createPalette(root, { onArm, onDrag } = {}) {
  let level = null;
  const chips = new Map();

  function chip(entry) {
    const def = gateDef(entry.type);
    const symbol = svg('svg', { class: 'chip__symbol', viewBox: '-22 -14 44 28', 'aria-hidden': 'true' });
    symbol.append(gateGlyph(entry.type, 'glyph glyph--chip'));

    const count = h('span', { class: 'chip__count', text: `${entry.count}` });
    const button = h(
      'button',
      {
        class: `chip chip--${entry.type}`,
        type: 'button',
        dataset: { type: entry.type },
        'aria-label': `${def.label} gate. ${def.blurb}. ${entry.count} left.`,
      },
      symbol,
      h('span', { class: 'chip__name', text: def.label }),
      count,
      h('span', { class: 'chip__blurb', text: def.blurb })
    );

    button.addEventListener('click', () => onArm?.(entry.type));
    button.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const pointerId = event.pointerId;
      const origin = { x: event.clientX, y: event.clientY };
      let dragging = false;

      const onMove = (move) => {
        if (move.pointerId !== pointerId || dragging) return;
        if (Math.hypot(move.clientX - origin.x, move.clientY - origin.y) < DRAG_PX) return;
        dragging = true;
        cleanup();
        onDrag?.(entry.type, move);
      };
      const onUp = (up) => {
        if (up.pointerId !== pointerId) return;
        cleanup();
      };
      const cleanup = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    });

    chips.set(entry.type, { button, count, entry });
    return button;
  }

  return {
    setLevel(nextLevel) {
      level = nextLevel;
      chips.clear();
      clear(root);
      root.append(
        h('h3', { class: 'panel__title', text: 'Parts bin' }),
        h('div', { class: 'chips' }, level.palette.map(chip))
      );
    },
    setCounts(used) {
      for (const [type, chip] of chips) {
        const remaining = chip.entry.count - (used[type] || 0);
        chip.count.textContent = String(remaining);
        setClass(chip.button, 'is-empty', remaining <= 0);
        chip.button.setAttribute(
          'aria-label',
          `${gateDef(type).label} gate. ${gateDef(type).blurb}. ${remaining} left.`
        );
      }
    },
    setArmed(type) {
      for (const [chipType, chip] of chips) {
        setClass(chip.button, 'is-armed', chipType === type);
        chip.button.setAttribute('aria-pressed', chipType === type ? 'true' : 'false');
      }
    },
  };
}
