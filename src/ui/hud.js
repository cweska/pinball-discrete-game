/**
 * Everything around the bench: the level chip, the briefing, the goal table,
 * the status line and the hint card.
 */

import { clear, h, setClass, svg } from '../util/dom.js';
import { goalTable } from '../engine/validator.js';
import { TIER_LABELS } from './hints.js';
import { ACTS, LEVELS } from '../levels/index.js';

function tableFor(level) {
  const table = goalTable(level);
  if (!table) return sequenceList(level);

  const head = h(
    'tr',
    {},
    table.inputs.map((t) => h('th', { class: 'gt__in', text: t.label })),
    table.outputs.map((t) => h('th', { class: 'gt__out', text: t.label }))
  );
  const rows = table.rows.map((row) =>
    h(
      'tr',
      {},
      row.in.map((value) => h('td', { class: `gt__in v${value}`, text: String(value) })),
      row.out.map((value) => h('td', { class: `gt__out v${value}`, text: value == null ? '-' : String(value) }))
    )
  );
  return h('table', { class: 'goal-table' }, h('thead', {}, head), h('tbody', {}, rows));
}

function sequenceList(level) {
  const scenario = level.spec.scenarios[0];
  return h(
    'ol',
    { class: 'goal-steps' },
    scenario.steps
      .filter((step) => step.note && step.expect)
      .map((step) =>
        h(
          'li',
          {},
          h('span', { class: 'goal-steps__note', text: step.note }),
          h('span', {
            class: 'goal-steps__want',
            text: Object.entries(step.expect)
              .map(([id, value]) => {
                const terminal = level.io.outputs.find((t) => t.id === id);
                return `${terminal ? terminal.short || terminal.label : id} ${value ? 'on' : 'off'}`;
              })
              .join(', '),
          })
        )
      )
  );
}

export function createHud(refs) {
  let level = null;
  let tableOpen = false;
  let onSignalStep = null;
  let onSignalRepeat = null;

  const signalCount = h('span', { class: 'signal-test__count', text: '' });
  const signalBits = h('span', { class: 'signal-test__bits', text: '' });
  const signalReadout = h('span', { class: 'signal-test__readout', 'aria-live': 'polite' }, signalCount, signalBits);
  const repeatButton = h(
    'button',
    {
      class: 'signal-test__btn signal-test__repeat',
      type: 'button',
      'aria-pressed': 'true',
    },
    'Cycle Inputs',
    svg(
      'svg',
      { class: 'signal-test__cycle', viewBox: '0 0 24 24', 'aria-hidden': 'true' },
      svg('path', {
        fill: 'currentColor',
        d: 'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z',
      })
    )
  );
  const backButton = h('button', {
    class: 'signal-test__btn',
    type: 'button',
    'aria-label': 'Previous input combination',
    title: 'Previous combination',
    text: 'Back',
  });
  const nextButton = h('button', {
    class: 'signal-test__btn',
    type: 'button',
    'aria-label': 'Next input combination',
    title: 'Next combination',
    text: 'Next',
  });
  backButton.addEventListener('click', () => onSignalStep?.(-1));
  nextButton.addEventListener('click', () => onSignalStep?.(1));
  repeatButton.addEventListener('click', () => onSignalRepeat?.());
  refs.signalTesting.append(
    h('span', { class: 'signal-test__label', text: 'Try inputs:' }),
    backButton,
    nextButton,
    repeatButton,
    signalReadout
  );

  function renderBriefing() {
    clear(refs.briefing);
    const table = tableFor(level);
    const toggle = h('button', {
      class: 'briefing__toggle',
      type: 'button',
      'aria-expanded': tableOpen ? 'true' : 'false',
      text: tableOpen ? 'Hide every case' : 'Show every case',
    });
    const tableWrap = h('div', { class: 'briefing__table', hidden: !tableOpen }, table);
    toggle.addEventListener('click', () => {
      tableOpen = !tableOpen;
      tableWrap.hidden = !tableOpen;
      toggle.textContent = tableOpen ? 'Hide every case' : 'Show every case';
      toggle.setAttribute('aria-expanded', tableOpen ? 'true' : 'false');
    });

    refs.briefing.append(
      h('h2', { class: 'briefing__title', text: level.title }),
      h('p', { class: 'briefing__story', text: level.brief.story }),
      h('p', { class: 'briefing__goal' }, h('strong', { text: 'Your job: ' }), level.brief.goal),
      level.brief.note ? h('p', { class: 'briefing__note', text: level.brief.note }) : null,
      toggle,
      tableWrap
    );
  }

  return {
    setLevel(nextLevel, { solved = false } = {}) {
      level = nextLevel;
      tableOpen = false;
      const act = ACTS.find((a) => a.act === level.act);
      clear(refs.levelChip);
      const chip = [
        h('span', { class: 'level-chip__act', text: `Act ${act.act} \u00b7 ${act.title}` }),
        h('span', { class: 'level-chip__name', text: `${level.number}. ${level.title}` }),
        h('span', { class: 'level-chip__count', text: `${level.number} of ${LEVELS.length}` }),
      ];
      if (solved) chip.push(h('span', { class: 'level-chip__done', text: 'done' }));
      refs.levelChip.append(...chip);
      renderBriefing();
      this.clearHint();
      this.setStatus(
        level.placement === 'slots'
          ? 'Drag a gate from the parts bin into a socket.'
          : 'Drag gates onto the bench. Then connect an output pin to an input pin.',
        'info'
      );
    },

    setStatus(message, tone = 'info', action = null) {
      clear(refs.status);
      refs.status.append(h('span', { class: `status__dot status__dot--${tone}` }), h('span', { text: message }));
      if (action) {
        const button = h('button', { class: 'status__action', type: 'button', text: action.label });
        button.addEventListener('click', action.onClick);
        refs.status.append(button);
      }
      refs.status.dataset.tone = tone;
    },

    setHint({ tier, text, total }) {
      clear(refs.hint);
      refs.hint.hidden = false;
      refs.hint.append(
        h('div', { class: 'hint__head' },
          h('span', { class: 'hint__tier', text: TIER_LABELS[tier] || 'Hint' }),
          h('span', { class: 'hint__count', text: `${tier} of ${total}` })
        ),
        h('p', { class: 'hint__text', text })
      );
    },

    clearHint() {
      clear(refs.hint);
      refs.hint.hidden = true;
    },

    bindSignalTesting({ onStep, onToggleRepeat }) {
      onSignalStep = onStep;
      onSignalRepeat = onToggleRepeat;
    },

    setSignalTesting({ index, total, bits, repeat, paused }) {
      signalCount.textContent = `${index + 1}/${total}`;
      signalBits.textContent = bits;
      signalReadout.title = paused ? `The test buttons have the switches. Next combination: ${bits}` : bits;
      repeatButton.setAttribute('aria-pressed', repeat ? 'true' : 'false');
      repeatButton.title = repeat ? 'Stop on this case' : 'Keep going through every case';
      setClass(refs.signalTesting, 'is-paused', paused);
    },

    setProgress(solvedCount) {
      refs.progress.style.setProperty('--fill', `${(solvedCount / LEVELS.length) * 100}%`);
      refs.progress.setAttribute('aria-label', `${solvedCount} of ${LEVELS.length} levels done`);
      clear(refs.progressLabel);
      refs.progressLabel.append(h('span', { text: `${solvedCount}/${LEVELS.length} levels done` }));
    },
  };
}
