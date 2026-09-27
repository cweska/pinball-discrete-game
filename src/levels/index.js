import level01 from './level-01-flipper.js';
import level02 from './level-02-pop-bumper.js';
import level03 from './level-03-slingshot.js';
import level04 from './level-04-tilt-guard.js';
import level05 from './level-05-drop-targets.js';
import level06 from './level-06-mystery.js';
import level07 from './level-07-nand-only.js';
import level08 from './level-08-bonus.js';
import level09 from './level-09-kickback.js';
import level10 from './level-10-lock.js';
import level11 from './level-11-ball-saver.js';
import level12 from './level-12-lane-change.js';
import level13 from './level-13-multiball.js';

export const ACTS = [
  { act: 1, title: 'Wake It Up', blurb: 'One gate, one socket.' },
  { act: 2, title: 'Rules Take Shape', blurb: 'Gates working together.' },
  { act: 3, title: 'Make Do', blurb: 'Build it from what is in the crate.' },
  { act: 4, title: 'The Machine Remembers', blurb: 'Circuits that hold a value.' },
];

export const LEVELS = [
  level01,
  level02,
  level03,
  level04,
  level05,
  level06,
  level07,
  level08,
  level09,
  level10,
  level11,
  level12,
  level13,
].map((level, index) => ({ ...level, number: index + 1 }));

export function levelById(id) {
  return LEVELS.find((level) => level.id === id) || null;
}

export function levelByNumber(number) {
  return LEVELS[number - 1] || null;
}

export function actOf(level) {
  return ACTS.find((a) => a.act === level.act) || ACTS[0];
}

/** Machine parts unlocked by every level up to and including `number`. */
export function partsLiveAfter(number) {
  const live = new Set();
  for (const level of LEVELS.slice(0, number)) {
    for (const ids of Object.values(level.machine.bind || {})) {
      for (const id of Array.isArray(ids) ? ids : [ids]) live.add(id);
    }
  }
  return live;
}

export function boundParts(level) {
  const ids = [];
  for (const value of Object.values(level.machine.bind || {})) {
    for (const id of Array.isArray(value) ? value : [value]) ids.push(id);
  }
  return ids;
}
