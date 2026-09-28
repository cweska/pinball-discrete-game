/**
 * The controller: level lifecycle, the simulation loop that keeps the bench and
 * the machine in step, checking, undo, saving and Free Play.
 */

import { circuitFromLevel } from '../engine/circuit.js';
import { createState, settle } from '../engine/simulate.js';
import { validate } from '../engine/validator.js';
import { LEVELS, boundParts, levelByNumber, partsLiveAfter } from '../levels/index.js';
import { gateDef } from '../engine/gates.js';
import * as audio from '../machine/audio.js';
import { createFreePlay } from '../machine/freeplay.js';
import { createMachine } from '../machine/playfield.js';
import * as progress from '../state/progress.js';
import { clear, h, prefersReducedMotion, setClass } from '../util/dom.js';
import { createBench } from './bench.js';
import { createHints, hintTargets } from './hints.js';
import { createHud } from './hud.js';
import { createOverlays } from './overlays.js';
import { createPalette } from './palette.js';
import { createPulse } from './pulse.js';
import { createTestControls } from './controls.js';

const FREE_PLAY_MINIMUM = 3;

export function createApp(refs) {
  const reducedMotion = prefersReducedMotion();
  setClass(document.body, 'reduced-motion', reducedMotion);

  const machine = createMachine(refs.machine);
  const hud = createHud(refs);
  const hints = createHints({
    onHint: ({ tier, text, total, quiet }) => {
      hud.setHint({ tier, text, total });
      progress.setHintTier(level.id, tier);
      if (!quiet) audio.play('relay');
      if (tier >= 3) bench.highlight(hintTargets(level));
    },
  });

  let level = LEVELS[0];
  let circuit = circuitFromLevel(level);
  let simState = createState(0);
  let pulse = createPulse(level);
  let sim = settle(circuit, {}, simState);
  let mode = 'build';
  let undoStack = [];
  let redoStack = [];
  let signalStamp = '';
  let saveTimer = null;
  let inputs = {};

  const palette = createPalette(refs.palette, {
    onArm: (type) => {
      audio.unlockAudio();
      const armed = bench.arm(type);
      palette.setArmed(armed);
      if (armed) {
        hud.setStatus(
          level.placement === 'slots'
            ? `Click the socket to drop the ${gateDef(armed).label} in. Drag works too.`
            : `Click on the bench to drop the ${gateDef(armed).label}, or drag it from the bin.`,
          'info'
        );
      }
    },
    onDrag: (type, event) => {
      audio.unlockAudio();
      bench.beginDragFromPalette(type, event);
      palette.setArmed(type);
    },
  });

  const controls = createTestControls(refs.testControls, {
    onChange: (values) => {
      inputs = values;
    },
    onSound: (name) => {
      audio.unlockAudio();
      audio.play(name);
    },
  });

  const bench = createBench(refs.bench, {
    beforeChange: () => {
      undoStack.push(circuit.snapshot());
      if (undoStack.length > 60) undoStack.shift();
      redoStack = [];
    },
    onChange: () => {
      palette.setCounts(circuit.countByType());
      palette.setArmed(bench.armed);
      bench.clearHighlights();
      scheduleSave();
    },
    onStatus: (message, tone) => hud.setStatus(message, tone),
    onSound: (name) => audio.play(name),
    onArmedChange: (type) => palette.setArmed(type),
  });

  const freeplay = createFreePlay({
    machine,
    onEvent: (name) => logFreePlayEvent(name),
  });

  const overlays = createOverlays(document.body, {
    onSelectLevel: (number) => loadLevel(number),
    onFreePlay: () => startFreePlay(),
  });

  // --- persistence ---------------------------------------------------------

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => progress.saveBench(level.id, circuit.snapshot()), 250);
  }

  function solvedCount() {
    return progress.solvedIds().length;
  }

  // --- level lifecycle -----------------------------------------------------

  function loadLevel(number) {
    const next = levelByNumber(number);
    if (!next) return;
    stopFreePlay({ silent: true });
    level = next;
    circuit = circuitFromLevel(level);
    const saved = progress.loadBench(level.id);
    if (saved) {
      try {
        circuit.restore(saved);
      } catch {
        // A bench saved by an older build of the level pack just gets dropped.
      }
    }
    simState = createState(0);
    pulse = createPulse(level, { repeat: pulse.repeat });
    undoStack = [];
    redoStack = [];
    signalStamp = '';

    bench.setLevel(level, circuit);
    bench.setShowValues(progress.settings().showValues);
    palette.setLevel(level);
    palette.setCounts(circuit.countByType());
    controls.setLevel(level);
    hud.setLevel(level, { solved: progress.isSolved(level.id) });
    hud.setProgress(solvedCount());
    hints.setLevel(level, { tier: progress.hintTier(level.id) });
    publishSignal(false);
    machine.resetEdges();
    machine.setScore(0);
    progress.setCurrentLevel(number);
    refs.buildView.hidden = false;
    refs.freeplayView.hidden = true;
    setClass(document.body, 'is-freeplay', false);
    mode = 'build';
  }

  // --- checking ------------------------------------------------------------

  function check() {
    audio.unlockAudio();
    const result = validate(level, circuit);
    if (result.ok) {
      onSolved();
      return;
    }
    audio.play('reject');
    hints.registerFailure();
    const action = result.detail?.inputs
      ? {
          label: 'Set the switches to that case',
          onClick: () => {
            controls.applyVector(result.detail.inputs);
            hud.setStatus('Switches set to the case that fails. Watch the bench and the machine.', 'info');
          },
        }
      : null;
    hud.setStatus(result.message, 'warn', action);
    if (result.highlight) bench.highlight([result.highlight.node]);
  }

  function onSolved() {
    const firstTime = !progress.isSolved(level.id);
    progress.markSolved(level, circuit.snapshot());
    hints.markSolved();
    hud.setProgress(solvedCount());
    hud.setLevel(level, { solved: true });
    hud.setStatus('That works. Every case checks out.', 'good');
    audio.unlockAudio();
    audio.play('solved');
    machine.celebrate(level.machine.celebrate);
    if (!firstTime) return;
    const next = levelByNumber(level.number + 1);
    setTimeout(
      () =>
        overlays.showComplete({
          level,
          next,
          onNext: () => loadLevel(level.number + 1),
          onStay: () => hud.setStatus('Still here. Poke at the test controls as long as you like.', 'info'),
          onMap: () => openMap(),
        }),
      900
    );
  }

  // --- undo ----------------------------------------------------------------

  function undo() {
    if (!undoStack.length) {
      hud.setStatus('Nothing to undo yet.', 'info');
      return;
    }
    redoStack.push(circuit.snapshot());
    circuit.restore(undoStack.pop());
    bench.render();
    palette.setCounts(circuit.countByType());
    scheduleSave();
    audio.play('cut');
    hud.setStatus('Undone.', 'info');
  }

  function redo() {
    if (!redoStack.length) return;
    undoStack.push(circuit.snapshot());
    circuit.restore(redoStack.pop());
    bench.render();
    palette.setCounts(circuit.countByType());
    scheduleSave();
  }

  function clearBench() {
    undoStack.push(circuit.snapshot());
    redoStack = [];
    circuit.restore({ gates: [], wires: [], gateSeq: 0 });
    bench.render();
    palette.setCounts(circuit.countByType());
    scheduleSave();
    hud.setStatus('Bench cleared. Ctrl+Z brings it back.', 'info');
  }

  // --- free play -----------------------------------------------------------

  const freePlayLog = [];

  function logFreePlayEvent(name) {
    freePlayLog.unshift(name);
    freePlayLog.length = Math.min(freePlayLog.length, 7);
    if (!refs.freeplayLog) return;
    clear(refs.freeplayLog);
    for (const [index, entry] of freePlayLog.entries()) {
      refs.freeplayLog.append(h('li', { class: index === 0 ? 'is-latest' : '', text: prettyEvent(entry) }));
    }
  }

  function prettyEvent(name) {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (c) => c.toUpperCase())
      .replace(/(\d)/, ' $1');
  }

  function startFreePlay() {
    audio.unlockAudio();
    const wired = freeplay.start();
    mode = 'freeplay';
    freePlayLog.length = 0;
    setClass(document.body, 'is-freeplay', true);
    refs.buildView.hidden = true;
    refs.freeplayView.hidden = false;
    clear(refs.freeplayList);
    for (const solvedLevel of LEVELS.filter((l) => progress.isSolved(l.id))) {
      refs.freeplayList.append(
        h('li', {}, h('strong', { text: solvedLevel.title }), ` - ${boundParts(solvedLevel).length} device(s)`)
      );
    }
    clear(refs.freeplayCount);
    refs.freeplayCount.append(h('span', { text: `${wired} circuit${wired === 1 ? '' : 's'} running` }));
  }

  function stopFreePlay({ silent = false } = {}) {
    if (mode !== 'freeplay') return;
    freeplay.stop();
    audio.stopSpin();
    mode = 'build';
    setClass(document.body, 'is-freeplay', false);
    refs.buildView.hidden = false;
    refs.freeplayView.hidden = true;
    machine.resetEdges();
    if (!silent) hud.setStatus('Back at the bench.', 'info');
  }

  function openMap() {
    overlays.showMap({
      unlocked: progress.unlockedCount(),
      solved: progress.solvedIds(),
      current: level.number,
      freePlayReady: solvedCount() >= FREE_PLAY_MINIMUM,
    });
  }

  // --- the loop ------------------------------------------------------------

  function machineStates({ sound = true } = {}) {
    const live = partsLiveAfter(LEVELS.length);
    const solved = new Set();
    for (const solvedLevel of LEVELS.filter((l) => progress.isSolved(l.id))) {
      for (const partId of boundParts(solvedLevel)) solved.add(partId);
    }
    const states = new Map();
    for (const partId of live) {
      if (solved.has(partId)) states.set(partId, { value: 0, live: true, target: false, driven: false });
    }
    for (const [outputId, parts] of Object.entries(level.machine.bind || {})) {
      for (const partId of Array.isArray(parts) ? parts : [parts]) {
        states.set(partId, {
          value: sim.outputs[outputId] ? 1 : 0,
          live: solved.has(partId),
          target: true,
          driven: !!sim.outputsDriven[outputId],
        });
      }
    }
    for (const [inputId, partId] of Object.entries(level.machine.inputBind || {})) {
      states.set(partId, { value: inputs[inputId] ? 1 : 0, live: true, target: false, driven: true });
    }
    for (const partId of level.machine.watch || []) {
      if (!states.has(partId)) states.set(partId, { value: 0, live: false, target: true, driven: false });
    }
    for (const [inputId, partId] of Object.entries(level.machine.targetInputs || {})) {
      machine.setTargetDown(partId, inputs[inputId] === 1, { sound });
    }
    return states;
  }

  function combinationBits(vector) {
    return level.io.inputs.map((terminal) => `${terminal.short || terminal.label}=${vector[terminal.id] ? 1 : 0}`).join(' ');
  }

  function publishSignal(paused) {
    const stamp = `${level.id}|${pulse.index}|${pulse.repeat}|${paused}|${combinationBits(pulse.vector())}`;
    if (stamp === signalStamp) return;
    signalStamp = stamp;
    hud.setSignalTesting({
      index: pulse.index,
      total: pulse.vectors.length,
      bits: combinationBits(pulse.vector()),
      repeat: pulse.repeat,
      paused,
    });
  }

  let lastFrame = performance.now();
  function frame(now) {
    const delta = Math.min(90, now - lastFrame);
    lastFrame = now;

    if (mode === 'freeplay') {
      freeplay.tick(delta);
      machine.setScore(machine.score);
    } else {
      const isLive = controls.isLive(now);
      pulse.tick(now, { paused: isLive });
      const values = isLive ? controls.values : pulse.vector();
      if (!isLive) inputs = values;

      sim = settle(circuit, values, simState);
      bench.paint(sim, { phase: pulse.dotPhase(now), animate: !reducedMotion });
      machine.applyState(machineStates({ sound: isLive }), { sound: isLive, scoring: isLive });
      publishSignal(isLive);
      hints.tick(delta);
    }
    requestAnimationFrame(frame);
  }

  // --- wiring up the chrome ------------------------------------------------

  hud.bindSignalTesting({
    onStep: (delta) => {
      audio.unlockAudio();
      audio.play('relay');
      controls.release();
      pulse.step(delta);
      signalStamp = '';
      publishSignal(false);
    },
    onToggleRepeat: () => {
      audio.unlockAudio();
      audio.play('relay');
      pulse.setRepeat(!pulse.repeat);
      signalStamp = '';
      publishSignal(controls.isLive());
    },
  });

  refs.checkButton.addEventListener('click', check);
  refs.hintButton.addEventListener('click', () => {
    audio.unlockAudio();
    hints.request();
  });
  refs.undoButton.addEventListener('click', undo);
  refs.clearButton.addEventListener('click', clearBench);
  refs.mapButton.addEventListener('click', openMap);
  refs.helpButton.addEventListener('click', () => overlays.showHelp());
  refs.stopFreePlayButton.addEventListener('click', () => stopFreePlay());

  refs.muteButton.addEventListener('click', () => {
    const muted = !progress.settings().muted;
    progress.updateSettings({ muted });
    audio.setMuted(muted);
    refs.muteButton.setAttribute('aria-pressed', muted ? 'true' : 'false');
    refs.muteButton.textContent = muted ? 'Sound off' : 'Sound on';
    if (!muted) {
      audio.unlockAudio();
      audio.play('chime');
    }
  });

  refs.valuesButton.addEventListener('click', () => {
    const showValues = !progress.settings().showValues;
    progress.updateSettings({ showValues });
    bench.setShowValues(showValues);
    refs.valuesButton.setAttribute('aria-pressed', showValues ? 'true' : 'false');
    refs.valuesButton.textContent = showValues ? 'Values on' : 'Values off';
  });

  window.addEventListener('keydown', (event) => {
    if (event.target.closest('input, textarea')) return;
    const meta = event.ctrlKey || event.metaKey;
    if (meta && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    } else if (meta && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      redo();
    } else if (event.key === 'Enter' && meta) {
      event.preventDefault();
      check();
    } else if (event.key === '?') {
      overlays.showHelp();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hints.pause();
      audio.stopSpin();
    } else {
      hints.resume();
      lastFrame = performance.now();
    }
  });

  window.addEventListener('pointerdown', () => audio.unlockAudio(), { once: true });

  // --- boot ----------------------------------------------------------------

  function boot() {
    const params = new URLSearchParams(location.search);
    if (params.get('unlock') === 'all') progress.unlockAll(LEVELS.length);
    if (params.get('reset') === '1') progress.resetEverything();

    const settings = progress.settings();
    audio.setMuted(settings.muted);
    refs.muteButton.textContent = settings.muted ? 'Sound off' : 'Sound on';
    refs.muteButton.setAttribute('aria-pressed', settings.muted ? 'true' : 'false');
    refs.valuesButton.textContent = settings.showValues ? 'Values on' : 'Values off';
    refs.valuesButton.setAttribute('aria-pressed', settings.showValues ? 'true' : 'false');

    const requested = Number(params.get('level'));
    const start = Number.isFinite(requested) && requested >= 1 && requested <= LEVELS.length
      ? requested
      : Math.min(progress.currentLevelNumber(), progress.unlockedCount());
    loadLevel(Math.max(1, start));
    machine.showBall(false);
    requestAnimationFrame(frame);
  }

  return { boot, loadLevel, check, openMap };
}
