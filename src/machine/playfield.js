/**
 * The machine: a backglass with rolling score reels and a top-down playfield.
 *
 * Every device in PARTS gets a visual here, drawn dark until the level that
 * wires it has been solved. Signal values arrive through applyState, which also
 * spots rising edges so coils can thunk and chimes can ring exactly once.
 */

import { BACKGLASS_VIEW, PARTS, PLAYFIELD_VIEW } from './parts.js';
import { clear, setClass, svg } from '../util/dom.js';
import * as audio from './audio.js';

const SCORES = {
  'bumper.pop': 100,
  'bumper.upper': 100,
  'slingshot.left': 10,
  'slingshot.right': 10,
  'coil.gate': 500,
  'lamp.jackpot': 5000,
  'lamp.mystery': 2500,
  'toy.spinner': 300,
  'lamp.lockA': 1000,
  'lamp.lockB': 1000,
  'lamp.lockC': 1000,
  'coil.release': 3000,
  'coil.kickback': 250,
  'lamp.bonus2x': 200,
  'lamp.bonus3x': 300,
  'lamp.bonus4x': 400,
};

function lampNode(id, def) {
  const group = svg('g', { class: 'part part--lamp', dataset: { part: id } });
  const r = def.size || 11;
  group.append(
    svg('circle', { class: 'lamp__halo', cx: def.x, cy: def.y, r: r * 2.5 }),
    svg('circle', { class: 'lamp__insert', cx: def.x, cy: def.y, r }),
    svg('circle', { class: 'lamp__filament', cx: def.x, cy: def.y, r: r * 0.45 }),
    svg('text', { class: 'part__label', x: def.x, y: def.y + r + 13, text: def.label })
  );
  return group;
}

function bumperNode(id, def) {
  const group = svg('g', { class: 'part part--bumper', dataset: { part: id } });
  group.append(
    svg('circle', { class: 'bumper__halo', cx: def.x, cy: def.y, r: def.r * 1.9 }),
    svg('circle', { class: 'bumper__skirt', cx: def.x, cy: def.y, r: def.r }),
    svg('circle', { class: 'bumper__ring', cx: def.x, cy: def.y, r: def.r * 0.64 }),
    svg('circle', { class: 'bumper__cap', cx: def.x, cy: def.y, r: def.r * 0.3 }),
    svg('text', { class: 'part__label', x: def.x, y: def.y + def.r + 15, text: def.label })
  );
  return group;
}

function slingNode(id, def) {
  const group = svg('g', { class: 'part part--sling', dataset: { part: id } });
  const w = 34 * def.flip;
  group.append(
    svg('path', {
      class: 'sling__rubber',
      d: `M ${def.x - w / 2} ${def.y - 26} L ${def.x + w / 2} ${def.y + 8} L ${def.x - w / 2} ${def.y + 26} Z`,
    }),
    svg('g', { class: 'sling__arm' }, svg('path', {
      class: 'sling__kicker',
      d: `M ${def.x - w * 0.1} ${def.y - 14} L ${def.x + w * 0.42} ${def.y + 6} L ${def.x - w * 0.1} ${def.y + 16} Z`,
    })),
    svg('text', { class: 'part__label', x: def.x, y: def.y + 44, text: def.label })
  );
  return group;
}

/** Degrees from horizontal: rest tips hang toward the outhole; fire swings them up the playfield. */
const FLIPPER_REST = 32;
const FLIPPER_UP = 48;

function flipperAngle(def, on) {
  // flip: left = -1, right = +1. Bats are drawn pointing inward, so rest
  // rotates the tip down (toward the drain) and fire rotates it up.
  return on ? FLIPPER_UP * def.flip : -FLIPPER_REST * def.flip;
}

function flipperNode(id, def) {
  const group = svg('g', { class: 'part part--flipper', dataset: { part: id } });
  // Inward: left bat extends right, right bat extends left.
  const inward = -def.flip;
  const length = 66;
  const tipX = def.x + inward * length;
  const bat = svg('g', { class: 'flipper__bat' });
  bat.setAttribute('transform', `rotate(${flipperAngle(def, false)} ${def.x} ${def.y})`);
  bat.append(
    svg('path', {
      class: 'flipper__bar',
      d: `M ${def.x} ${def.y - 10} L ${tipX} ${def.y - 3.5} L ${tipX} ${def.y + 4} L ${def.x} ${def.y + 11} Z`,
    }),
    svg('circle', { class: 'flipper__pivot', cx: def.x, cy: def.y, r: 7 })
  );
  group.append(bat, svg('text', { class: 'part__label', x: def.x, y: def.y + 34, text: def.label }));
  return group;
}

function targetNode(id, def) {
  const group = svg('g', { class: 'part part--target', dataset: { part: id } });
  group.append(
    svg('rect', { class: 'target__slot', x: def.x - 15, y: def.y + 9, width: 30, height: 5, rx: 2 }),
    svg('g', { class: 'target__body' },
      svg('rect', { class: 'target__face', x: def.x - 14, y: def.y - 16, width: 28, height: 26, rx: 4 }),
      svg('text', { class: 'target__letter', x: def.x, y: def.y + 3, text: def.label })
    )
  );
  return group;
}

/**
 * Coil housing with the piston along `aim`. 'up' fires toward the top of the
 * table (kickback, auto-launch). The default points right.
 */
function coilGeometry(def) {
  if (def.aim === 'up') {
    return {
      up: true,
      body: { x: def.x - 10, y: def.y - 15, width: 20, height: 30 },
      rod: { x: def.x - 3, y: def.y - 29, width: 6, height: 16 },
      winding: `M ${def.x - 10} ${def.y - 9} h 20 M ${def.x - 10} ${def.y - 3} h 20 M ${def.x - 10} ${def.y + 3} h 20 M ${def.x - 10} ${def.y + 9} h 20`,
      labelY: def.y + 32,
    };
  }
  return {
    up: false,
    body: { x: def.x - 15, y: def.y - 10, width: 30, height: 20 },
    rod: { x: def.x + 13, y: def.y - 3, width: 16, height: 6 },
    winding: `M ${def.x - 9} ${def.y - 10} v 20 M ${def.x - 3} ${def.y - 10} v 20 M ${def.x + 3} ${def.y - 10} v 20 M ${def.x + 9} ${def.y - 10} v 20`,
    labelY: def.y + 24,
  };
}

function coilNode(id, def) {
  const geo = coilGeometry(def);
  const group = svg('g', {
    class: geo.up ? 'part part--coil coil--up' : 'part part--coil',
    dataset: { part: id },
  });
  group.append(
    svg('rect', { class: 'coil__body', ...geo.body, rx: 3 }),
    svg('g', { class: 'coil__plunger' }, svg('rect', { class: 'coil__rod', ...geo.rod, rx: 2 })),
    svg('path', { class: 'coil__winding', d: geo.winding }),
    svg('text', { class: 'part__label', x: def.x, y: geo.labelY, text: def.label })
  );
  return group;
}

function toyNode(id, def) {
  const group = svg('g', { class: 'part part--toy', dataset: { part: id } });
  const wheel = svg('g', { class: 'toy__wheel', style: `--pivot-x:${def.x}px; --pivot-y:${def.y}px` });
  wheel.append(svg('circle', { class: 'toy__rim', cx: def.x, cy: def.y, r: def.r }));
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    wheel.append(
      svg('line', {
        class: 'toy__spoke',
        x1: def.x,
        y1: def.y,
        x2: def.x + Math.cos(angle) * def.r,
        y2: def.y + Math.sin(angle) * def.r,
      })
    );
  }
  wheel.append(svg('circle', { class: 'toy__hub', cx: def.x, cy: def.y, r: 5 }));
  group.append(wheel, svg('text', { class: 'part__label', x: def.x, y: def.y + def.r + 15, text: def.label }));
  return group;
}

const BUILDERS = {
  lamp: lampNode,
  bumper: bumperNode,
  sling: slingNode,
  flipper: flipperNode,
  target: targetNode,
  coil: coilNode,
  toy: toyNode,
};

function playfieldArt() {
  const art = svg('g', { class: 'pf-art' });
  art.append(
    svg('path', {
      class: 'pf-body',
      d: 'M 14 696 L 14 150 Q 14 34 200 22 Q 386 34 386 150 L 386 696 Z',
    }),
    // shooter lane on the right, outlanes hugging the bottom corners
    svg('path', { class: 'pf-lane', d: 'M 344 690 L 344 210 Q 344 150 300 128' }),
    svg('path', { class: 'pf-lane', d: 'M 58 690 L 58 560 Q 58 520 86 500' }),
    svg('path', { class: 'pf-lane', d: 'M 342 690 L 342 560 Q 342 520 314 500' }),
    // wireform ramps sketched in
    svg('path', { class: 'pf-ramp', d: 'M 104 596 Q 40 430 96 300 Q 130 200 150 96' }),
    svg('path', { class: 'pf-ramp', d: 'M 296 596 Q 360 430 306 300 Q 272 200 250 96' }),
    svg('path', { class: 'pf-arch', d: 'M 96 108 Q 200 56 304 108' }),
    // inlane guides feeding the flippers
    svg('path', { class: 'pf-guide', d: 'M 96 546 Q 112 604 138 636' }),
    svg('path', { class: 'pf-guide', d: 'M 304 546 Q 288 604 262 636' }),
    svg('path', { class: 'pf-apron', d: 'M 14 668 L 386 668 L 386 696 L 14 696 Z' }),
    svg('path', { class: 'pf-drain', d: 'M 168 668 L 232 668 L 214 696 L 186 696 Z' }),
    svg('text', { class: 'pf-drain-label', x: 200, y: 688, text: 'OUTHOLE' })
  );
  return art;
}

function reelDigits(index) {
  const group = svg('g', { class: 'reel', dataset: { reel: index } });
  const strip = svg('g', { class: 'reel__strip' });
  for (let d = 0; d < 11; d++) {
    strip.append(svg('text', { class: 'reel__digit', x: 0, y: d * 34, text: String(d % 10) }));
  }
  group.append(
    svg('rect', { class: 'reel__window', x: -13, y: -24, width: 26, height: 32, rx: 3 }),
    svg('g', { class: 'reel__clip' }, strip)
  );
  return group;
}

export function createMachine(root) {
  const backglass = svg('svg', {
    class: 'backglass',
    viewBox: `0 0 ${BACKGLASS_VIEW.width} ${BACKGLASS_VIEW.height}`,
    role: 'img',
    'aria-label': 'Backglass: score reels and status lamps',
  });
  const playfield = svg('svg', {
    class: 'playfield',
    viewBox: `0 0 ${PLAYFIELD_VIEW.width} ${PLAYFIELD_VIEW.height}`,
    role: 'img',
    'aria-label': 'Playfield',
  });

  const nodes = new Map();
  const previous = new Map();
  let score = 0;
  let spinning = false;
  const reels = [];

  function build() {
    clear(backglass);
    clear(playfield);

    backglass.append(
      svg('rect', { class: 'bg-panel', x: 6, y: 6, width: 388, height: 138, rx: 10 }),
      svg('text', { class: 'bg-title', x: 200, y: 40, text: 'GATECRASHER' }),
      svg('text', { class: 'bg-sub', x: 200, y: 58, text: 'LOGIC DIVISION \u00b7 MODEL NAND-8' })
    );
    const reelRow = svg('g', { class: 'reels', transform: 'translate(120 92)' });
    for (let i = 0; i < 5; i++) {
      const reel = reelDigits(i);
      reel.setAttribute('transform', `translate(${i * 32} 0)`);
      reelRow.append(reel);
      reels.push(reel.querySelector('.reel__strip'));
    }
    backglass.append(reelRow, svg('text', { class: 'bg-caption', x: 40, y: 92, text: 'SCORE' }));

    playfield.append(playfieldArt());
    const ballLayer = svg('g', { class: 'pf-balls' });

    for (const [id, def] of Object.entries(PARTS)) {
      const builder = BUILDERS[def.kind];
      if (!builder) continue;
      const node = builder(id, def);
      node.append(svg('title', {}, `${def.label} - not wired yet`));
      node.classList.add('part--dead');
      (def.zone === 'backglass' ? backglass : playfield).append(node);
      nodes.set(id, { node, def });
    }

    playfield.append(ballLayer);
    return ballLayer;
  }

  const ballLayer = build();
  root.append(backglass, playfield);

  function setScore(value) {
    score = Math.max(0, Math.min(99999, value));
    const digits = String(score).padStart(5, '0').split('').map(Number);
    digits.forEach((digit, index) => {
      const strip = reels[index];
      if (strip) strip.style.transform = `translateY(${-digit * 34}px)`;
    });
  }

  function addScore(points) {
    if (!points) return;
    setScore(score + points);
  }

  function flash(id, className, duration = 220) {
    const entry = nodes.get(id);
    if (!entry) return;
    entry.node.classList.remove(className);
    // Force a reflow so the class re-triggers even on back-to-back hits.
    void entry.node.getBoundingClientRect();
    entry.node.classList.add(className);
    setTimeout(() => entry.node.classList.remove(className), duration);
  }

  function pulsePart(id, { sound = true, scoring = true } = {}) {
    const entry = nodes.get(id);
    if (!entry) return;
    flash(id, 'is-hit', entry.def.kind === 'coil' ? 260 : 300);
    if (sound && entry.def.sound) audio.play(entry.def.sound);
    if (scoring) addScore(SCORES[id] || 0);
  }

  /**
   * @param {Map<string, {value: number, live: boolean, target: boolean, driven: boolean}>} states
   */
  function applyState(states, { sound = true, scoring = true } = {}) {
    for (const [id, entry] of nodes) {
      const state = states.get(id) || { value: 0, live: false, target: false, driven: false };
      const node = entry.node;
      const value = state.value ? 1 : 0;
      const was = previous.get(id);

      setClass(node, 'part--dead', !state.live && !state.target);
      setClass(node, 'part--target', !!state.target);
      setClass(node, 'part--live', !!state.live);
      setClass(node, 'is-on', !!value && (state.live || state.target));

      if (entry.def.kind === 'flipper') {
        const bat = node.querySelector('.flipper__bat');
        if (bat) {
          const on = !!value && (state.live || state.target);
          bat.setAttribute('transform', `rotate(${flipperAngle(entry.def, on)} ${entry.def.x} ${entry.def.y})`);
        }
      }

      if (entry.def.kind === 'toy') {
        const shouldSpin = !!value && (state.live || state.target);
        setClass(node, 'is-spinning', shouldSpin);
        if (shouldSpin !== spinning) {
          spinning = shouldSpin;
          if (!sound) audio.stopSpin();
          else if (shouldSpin) audio.startSpin();
          else audio.stopSpin();
        }
      }

      if (was !== undefined && was === 0 && value === 1 && (state.live || state.target)) {
        const kind = entry.def.kind;
        if (kind === 'coil' || kind === 'bumper' || kind === 'sling') {
          pulsePart(id, { sound, scoring });
        } else if (kind === 'lamp') {
          if (scoring) addScore(SCORES[id] || 0);
          if (sound && SCORES[id] >= 1000) audio.play('relay');
        }
      }
      previous.set(id, value);
    }
  }

  function setTargetDown(id, down) {
    const entry = nodes.get(id);
    if (entry) setClass(entry.node, 'is-down', !!down);
  }

  function describe(id, text) {
    const entry = nodes.get(id);
    if (!entry) return;
    const title = entry.node.querySelector('title');
    if (title) title.textContent = text;
  }

  const CELEBRATIONS = {
    flipperFlutter: ['flipper.left', 'flipper.right', 'flipper.left', 'flipper.right'],
    chimeRun: ['bumper.pop', 'bumper.upper', 'bumper.pop'],
    slapBack: ['slingshot.right', 'slingshot.left', 'slingshot.right'],
    targetReset: ['coil.gate', 'lamp.jackpot', 'coil.gate'],
    spinUp: ['lamp.mystery', 'toy.spinner', 'lamp.mystery'],
    bonusSweep: ['lamp.bonus2x', 'lamp.bonus3x', 'lamp.bonus4x'],
    kickSave: ['coil.kickback', 'coil.autoLaunch', 'lamp.ballsave'],
    lockUp: ['lamp.lockA', 'lamp.lockB', 'lamp.lockC'],
    laneFlash: ['lane.left', 'lane.right', 'lane.left', 'lane.right'],
    lightShow: [
      'knocker',
      'lamp.multiball',
      'lamp.lockA',
      'lamp.lockB',
      'lamp.lockC',
      'coil.release',
      'bumper.pop',
      'bumper.upper',
      'lamp.jackpot',
      'slingshot.left',
      'slingshot.right',
      'flipper.left',
      'flipper.right',
    ],
  };

  function celebrate(kind) {
    const sequence = CELEBRATIONS[kind] || CELEBRATIONS.chimeRun;
    sequence.forEach((id, index) => {
      setTimeout(() => {
        flash(id, 'is-hit', 320);
        const entry = nodes.get(id);
        if (entry && entry.def.sound) audio.play(entry.def.sound);
      }, index * 130);
    });
  }

  const ball = svg('circle', { class: 'pf-ball', cx: 200, cy: 640, r: 9 });
  function showBall(visible) {
    if (visible && !ball.isConnected) ballLayer.append(ball);
    else if (!visible && ball.isConnected) ball.remove();
  }
  function moveBall(x, y) {
    ball.setAttribute('cx', x);
    ball.setAttribute('cy', y);
  }

  return {
    backglass,
    playfield,
    applyState,
    pulsePart,
    setTargetDown,
    celebrate,
    describe,
    setScore,
    addScore,
    showBall,
    moveBall,
    get score() {
      return score;
    },
    resetEdges() {
      previous.clear();
    },
  };
}
