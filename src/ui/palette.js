/**
 * The parts bin. Each entry shows the standard gate symbol, what it does, and
 * how many are left in the crate.
 */

import { gateDef } from '../engine/gates.js';
import { clear, h, setClass, svg } from '../util/dom.js';
import { gateGlyph } from './bench.js';

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
      onDrag?.(entry.type, event);
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
