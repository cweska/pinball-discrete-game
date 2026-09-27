/**
 * Progress lives in localStorage. No accounts, no server, and a student can
 * close the tab mid-level without losing the bench they were building.
 */

const KEY = 'gatecrasher.progress.v1';

const DEFAULTS = {
  version: 1,
  unlocked: 1,
  current: 1,
  solved: {},
  benches: {},
  hintTier: {},
  settings: { muted: false, showValues: true },
};

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULTS),
      ...parsed,
      settings: { ...DEFAULTS.settings, ...(parsed.settings || {}) },
    };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

let state = null;

function write() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // A locked-down browser profile should not break the game.
  }
}

function ensure() {
  if (!state) state = read();
  return state;
}

export function progress() {
  return ensure();
}

export function unlockedCount() {
  return ensure().unlocked;
}

export function isSolved(levelId) {
  return !!ensure().solved[levelId];
}

export function solvedIds() {
  return Object.keys(ensure().solved);
}

export function currentLevelNumber() {
  return ensure().current;
}

export function setCurrentLevel(number) {
  ensure().current = number;
  write();
}

export function markSolved(level, snapshot) {
  const data = ensure();
  data.solved[level.id] = { at: Date.now(), gates: snapshot.gates, wires: snapshot.wires };
  data.benches[level.id] = snapshot;
  data.unlocked = Math.max(data.unlocked, level.number + 1);
  write();
}

export function saveBench(levelId, snapshot) {
  const data = ensure();
  data.benches[levelId] = snapshot;
  write();
}

export function loadBench(levelId) {
  return ensure().benches[levelId] || null;
}

export function hintTier(levelId) {
  return ensure().hintTier[levelId] || 0;
}

export function setHintTier(levelId, tier) {
  const data = ensure();
  data.hintTier[levelId] = Math.max(tier, data.hintTier[levelId] || 0);
  write();
}

export function settings() {
  return ensure().settings;
}

export function updateSettings(patch) {
  const data = ensure();
  data.settings = { ...data.settings, ...patch };
  write();
  return data.settings;
}

/** Teacher escape hatch: ?unlock=all opens every level on this device. */
export function unlockAll(total) {
  const data = ensure();
  data.unlocked = total;
  write();
}

export function resetEverything() {
  state = structuredClone(DEFAULTS);
  write();
}
