/**
 * Hints.
 *
 * Three tiers, on a timer that only runs while the tab is visible and the
 * student is actually on the level. Repeated failed checks nudge the ladder
 * forward. The last tier points at the socket but still leaves the placing to
 * them - nothing here ever solves a level.
 */

const FIRST_MS = 120_000;
const NEXT_MS = 90_000;
const MIN_GAP_MS = 25_000;
const FAILURES_PER_NUDGE = 3;

export const TIER_LABELS = ['', 'A nudge', 'Getting warmer', 'Almost telling you'];

export function createHints({ onHint } = {}) {
  let level = null;
  let tier = 0;
  let shown = 0;
  let activeMs = 0;
  let lastHintAt = 0;
  let failures = 0;
  let paused = false;
  let solved = false;

  function emit(reason) {
    if (!level || solved) return;
    if (shown >= level.hints.length) return;
    shown += 1;
    tier = shown;
    lastHintAt = activeMs;
    onHint?.({ tier, text: level.hints[shown - 1], total: level.hints.length, reason });
  }

  return {
    setLevel(nextLevel, { tier: startTier = 0 } = {}) {
      level = nextLevel;
      tier = 0;
      shown = 0;
      activeMs = 0;
      lastHintAt = 0;
      failures = 0;
      solved = false;
      // A student coming back to a level keeps the hints they had already earned.
      if (startTier > 0) {
        shown = Math.min(startTier, nextLevel.hints.length);
        tier = shown;
        onHint?.({ tier, text: nextLevel.hints[shown - 1], total: nextLevel.hints.length, reason: 'restored', quiet: true });
      }
    },
    /** @param {number} deltaMs time since the last frame */
    tick(deltaMs) {
      if (paused || !level || solved) return;
      activeMs += deltaMs;
      const due = shown === 0 ? FIRST_MS : lastHintAt + NEXT_MS;
      if (activeMs >= due) emit('timer');
    },
    request() {
      if (shown >= (level?.hints.length ?? 0)) {
        onHint?.({ tier: shown, text: level.hints[shown - 1], total: level.hints.length, reason: 'repeat' });
        return;
      }
      emit('asked');
    },
    registerFailure() {
      failures += 1;
      if (failures % FAILURES_PER_NUDGE === 0 && activeMs - lastHintAt > MIN_GAP_MS) emit('stuck');
    },
    markSolved() {
      solved = true;
    },
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    get tier() {
      return tier;
    },
    get elapsedMs() {
      return activeMs;
    },
    get exhausted() {
      return !!level && shown >= level.hints.length;
    },
  };
}

/**
 * What the last hint tier should point at: the sockets or gate positions from
 * the reference build, so the student's eye lands in the right place.
 */
export function hintTargets(level) {
  if (level.placement === 'slots') return level.reference.gates.map((gate) => gate.slot).filter(Boolean);
  return level.io.outputs.map((terminal) => terminal.id);
}
