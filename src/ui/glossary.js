/**
 * Pinball words in the student copy.
 *
 * Level text stays plain. gloss() wraps each term when the page renders.
 * Longer phrases are listed first so "shooter lane" is one tip, and word
 * boundaries keep "outlane" from also matching "lane", and "locked" from
 * matching "lock".
 */

import { h } from '../util/dom.js';

const ENTRIES = [
  {
    keys: ['shooter lane'],
    def: 'The lane on the right where a new ball waits to be launched.',
  },
  {
    keys: ['bonus multiplier'],
    def: 'After a ball ends, points from that ball can count double, triple, or quadruple. These lamps show which one is lit.',
  },
  {
    keys: ['auto-launch', 'auto launch'],
    def: 'The coil that shoots a saved ball back up the shooter lane.',
  },
  {
    keys: ['ball release', 'ball-release'],
    def: 'The coil that lets the locked balls back onto the playfield.',
  },
  {
    keys: ['ball saver', 'ball savers', 'ball save'],
    def: 'A short time after launch. If the ball drains then, the machine shoots it again.',
  },
  {
    keys: ['drop targets', 'drop target', 'drop-targets', 'drop-target'],
    def: 'A small target that falls when the ball hits it. Down is 1. Up is 0.',
  },
  {
    keys: ['pop bumper', 'pop bumpers'],
    def: 'A round post that kicks the ball away when the ball hits its skirt.',
  },
  {
    keys: ['end of ball'],
    def: 'The moment this turn is over. It turns the ball saver off.',
  },
  {
    keys: ['gate wheel'],
    def: 'The spinning toy on the upper playfield. It spins when both ramps are made.',
  },
  {
    keys: ['game on'],
    def: 'The light that means a game is being played.',
  },
  {
    keys: ['playfield', 'playfields'],
    def: 'The board under the glass that the ball rolls on.',
  },
  {
    keys: ['slingshot', 'slingshots'],
    def: 'The rubber triangle above a flipper. It kicks the ball back up the playfield.',
  },
  {
    keys: ['kickback', 'kickbacks'],
    def: 'A kicker in the outlane that shoots the ball back onto the playfield.',
  },
  {
    keys: ['multiball'],
    def: 'More than one ball on the playfield at once. It starts when all three locks are lit.',
  },
  {
    keys: ['diverter', 'diverters'],
    def: 'A gate that opens to send the ball a different way.',
  },
  {
    keys: ['jackpot', 'jackpots'],
    def: 'The big award lamp. It lights when all four targets are down.',
  },
  {
    keys: ['mystery'],
    def: 'A surprise award. Its lamp lights when exactly one ramp is made.',
  },
  {
    keys: ['outlane', 'outlanes'],
    def: 'The gutter beside the flippers. A ball down it usually drains, unless the kickback saves it.',
  },
  {
    keys: ['outhole', 'outholes'],
    def: 'The hole under the flippers where a drained ball sits.',
  },
  {
    keys: ['flipper', 'flippers'],
    def: 'The paddle at the bottom. Its coil swings it up so the player can hit the ball.',
  },
  {
    keys: ['bumper', 'bumpers'],
    def: 'A round post that kicks the ball away when the ball hits its skirt.',
  },
  {
    keys: ['target', 'targets'],
    def: 'A small target that falls when the ball hits it. Down is 1. Up is 0.',
  },
  {
    keys: ['kicker', 'kickers'],
    def: 'The part behind the slingshot rubber that slaps the ball away.',
  },
  {
    keys: ['switch', 'switches'],
    def: 'A sensor that changes when a ball or a finger touches it. That change is 0 or 1 on a wire.',
  },
  {
    keys: ['collects', 'collect'],
    def: 'The ball went through a lane and scored it.',
  },
  {
    keys: ['skirt', 'skirts'],
    def: 'The ring around a pop bumper. A hit on the skirt is that bumper\'s switch.',
  },
  {
    keys: ['drain', 'drains'],
    def: 'The ball falls past the flippers and that turn ends.',
  },
  {
    keys: ['tilted', 'tilt'],
    def: 'The machine thinks someone shoved it to cheat. The tilt light comes on, and some parts are supposed to stop.',
  },
  {
    keys: ['lamp', 'lamps'],
    def: 'A light on the machine. On is 1. Off is 0.',
  },
  {
    keys: ['lane', 'lanes'],
    def: 'A narrow slot the ball can roll through. Lane A and lane B are the two at the top.',
  },
  {
    keys: ['lock', 'locks'],
    def: 'A spot that captures a ball. Its lamp stays on after the hit, until reset.',
  },
  {
    keys: ['coil', 'coils'],
    def: 'The electromagnet that moves a part. It turns on when its wire is 1.',
  },
  {
    keys: ['ramp', 'ramps'],
    def: 'A raised track the ball rolls up. A ramp is made when the ball goes all the way up.',
  },
  {
    keys: ['armed'],
    def: 'The kickback is ready to save the ball. The ARMED lamp shows that.',
  },
  {
    keys: ['made'],
    def: 'The shot was completed. A made ramp means the ball rolled all the way up it.',
  },
  {
    keys: ['2x', '3x', '4x'],
    def: 'After a ball ends, points from that ball can count double, triple, or quadruple. These lamps show which one is lit.',
  },
];

const MATCHERS = ENTRIES
  .flatMap((entry) => entry.keys.map((key) => ({ key, def: entry.def })))
  .sort((a, b) => b.key.length - a.key.length || a.key.localeCompare(b.key));

const DEFINITIONS = new Map(MATCHERS.map((item) => [item.key, item.def]));

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const PATTERN = new RegExp(`\\b(?:${MATCHERS.map((item) => escapeRegExp(item.key)).join('|')})\\b`, 'gi');

/** @returns {{ text: string, def?: string }[]} */
export function splitGlossary(text) {
  const source = String(text ?? '');
  if (!source) return [];
  const parts = [];
  let cursor = 0;
  for (const match of source.matchAll(new RegExp(PATTERN.source, 'gi'))) {
    const start = match.index ?? 0;
    if (start > cursor) parts.push({ text: source.slice(cursor, start) });
    const raw = match[0];
    parts.push({ text: raw, def: DEFINITIONS.get(raw.toLowerCase()) });
    cursor = start + raw.length;
  }
  if (cursor < source.length) parts.push({ text: source.slice(cursor) });
  return parts;
}

let tip = null;
let openTerm = null;
let pinned = false;
let watching = false;
let installed = false;

function termFrom(event) {
  const node = event.target?.nodeType === 1 ? event.target : event.target?.parentElement;
  return node?.closest?.('.term') || null;
}

function place(term) {
  if (!tip) return;
  tip.style.right = 'auto';
  tip.style.bottom = 'auto';
  tip.style.margin = '0';
  const rect = term.getBoundingClientRect();
  const tipRect = tip.getBoundingClientRect();
  const gap = 8;
  const fitsAbove = rect.top >= tipRect.height + 4;
  let top = fitsAbove
    ? Math.max(4, rect.top - tipRect.height - gap)
    : rect.bottom + gap;
  if (top + tipRect.height > window.innerHeight - gap) {
    top = Math.max(4, window.innerHeight - tipRect.height - gap);
  }
  let left = rect.left + rect.width / 2 - tipRect.width / 2;
  left = Math.max(gap, Math.min(left, window.innerWidth - tipRect.width - gap));
  tip.style.left = `${Math.round(left)}px`;
  tip.style.top = `${Math.round(top)}px`;
}

function reveal() {
  if (typeof tip.showPopover === 'function') {
    if (!tip.matches(':popover-open')) tip.showPopover();
    return;
  }
  const host = openTerm?.closest('dialog') || document.body;
  if (tip.parentElement !== host) host.append(tip);
  tip.hidden = false;
}

function show(term, pin) {
  if (!tip || !term) return;
  if (pin) pinned = true;
  if (openTerm !== term) {
    openTerm?.classList.remove('is-open');
    openTerm?.removeAttribute('aria-describedby');
    openTerm = term;
    term.classList.add('is-open');
    term.setAttribute('aria-describedby', tip.id);
    tip.textContent = term.dataset.def || '';
  }
  reveal();
  place(term);
  if (!watching) {
    watching = true;
    requestAnimationFrame(watch);
  }
}

function hide() {
  pinned = false;
  watching = false;
  openTerm?.classList.remove('is-open');
  openTerm?.removeAttribute('aria-describedby');
  openTerm = null;
  if (!tip) return;
  if (typeof tip.hidePopover === 'function' && tip.matches(':popover-open')) tip.hidePopover();
  else tip.hidden = true;
}

function watch() {
  if (!watching) return;
  if (!openTerm?.isConnected) {
    hide();
    return;
  }
  place(openTerm);
  requestAnimationFrame(watch);
}

function onOver(event) {
  if (pinned) return;
  const term = termFrom(event);
  if (term) show(term, false);
}

function onOut(event) {
  if (pinned) return;
  const term = termFrom(event);
  if (!term || term !== openTerm) return;
  const next = event.relatedTarget;
  const nextEl = next?.nodeType === 1 ? next : next?.parentElement;
  if (nextEl?.closest?.('.term') === term) return;
  hide();
}

function onFocusIn(event) {
  const term = termFrom(event);
  if (!term || term.closest('button, a')) return;
  show(term, false);
}

function onFocusOut(event) {
  if (pinned) return;
  const term = termFrom(event);
  if (term && term === openTerm) hide();
}

function onClick(event) {
  const term = termFrom(event);
  if (!term) {
    if (openTerm) hide();
    return;
  }
  if (pinned && openTerm === term && !term.closest('button, a')) {
    hide();
    return;
  }
  show(term, true);
}

function onKey(event) {
  if (event.key !== 'Escape' || !openTerm) return;
  event.preventDefault();
  event.stopPropagation();
  hide();
}

function ensureTooltip() {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  tip = h('div', { id: 'term-tip', class: 'term-tip', popover: 'manual', role: 'tooltip' });
  document.body.append(tip);
  document.addEventListener('mouseover', onOver);
  document.addEventListener('mouseout', onOut);
  document.addEventListener('focusin', onFocusIn);
  document.addEventListener('focusout', onFocusOut);
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey, true);
}

/**
 * Turn a plain sentence into text and underlined term spans.
 * A term inside a button is hover-only, so the button stays the tab stop.
 */
export function gloss(text) {
  const parts = splitGlossary(text);
  if (typeof document === 'undefined') return [String(text ?? '')];
  ensureTooltip();
  const terms = [];
  const nodes = parts.map((part) => {
    if (!part.def) return part.text;
    const term = h('span', { class: 'term', tabindex: '0', dataset: { def: part.def } }, part.text);
    terms.push(term);
    return term;
  });
  if (terms.length) {
    queueMicrotask(() => {
      for (const term of terms) {
        if (term.closest('button, a')) term.removeAttribute('tabindex');
      }
    });
  }
  return nodes;
}
