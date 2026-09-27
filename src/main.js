import { createApp } from './ui/app.js';
import { qs } from './util/dom.js';

const app = createApp({
  machine: qs('#machine'),
  testControls: qs('#test-controls'),
  bench: qs('#bench'),
  briefing: qs('#briefing'),
  hint: qs('#hint'),
  status: qs('#status'),
  palette: qs('#palette'),
  levelChip: qs('#level-chip'),
  progress: qs('#progress'),
  progressLabel: qs('#progress-label'),
  signalTesting: qs('#signal-testing'),
  buildView: qs('#build-view'),
  freeplayView: qs('#freeplay-view'),
  freeplayList: qs('#freeplay-list'),
  freeplayLog: qs('#freeplay-log'),
  freeplayCount: qs('#freeplay-count'),
  checkButton: qs('#btn-check'),
  hintButton: qs('#btn-hint'),
  undoButton: qs('#btn-undo'),
  clearButton: qs('#btn-clear'),
  mapButton: qs('#btn-map'),
  helpButton: qs('#btn-help'),
  muteButton: qs('#btn-mute'),
  valuesButton: qs('#btn-values'),
  stopFreePlayButton: qs('#btn-stop-freeplay'),
});

app.boot();
