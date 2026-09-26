/**
 * Everything around the bench: the level chip, the briefing, the goal table,
 * the status line and the hint card.
 */

import { clear, h, setClass } from '../util/dom.js';
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

  function renderBriefing() {
    clear(refs.briefing);
    const table = tableFor(level);
    const toggle = h('button', {
      class: 'briefing__toggle',
      type: 'button',
      'aria-expanded': tableOpen ? 'true' : 'false',
      text: tableOpen ? 'Hide what it has to do' : 'Show exactly what it has to do',
    });
    const tableWrap = h('div', { class: 'briefing__table', hidden: !tableOpen }, table);
    toggle.addEventListener('click', () => {
      tableOpen = !tableOpen;
      tableWrap.hidden = !tableOpen;
      toggle.textContent = tableOpen ? 'Hide what it has to do' : 'Show exactly what it has to do';
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
          ? 'Take a gate from the parts bin and drop it into a socket.'
          : 'Drag gates onto the bench, then draw wires from pin to pin.',
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
          h('span', { class: 'hint__count', text: `hint ${tier} of ${total}` })
        ),
        h('p', { class: 'hint__text', text })
      );
    },

    clearHint() {
      clear(refs.hint);
      refs.hint.hidden = true;
    },

    setDemo(isDemo, note) {
      setClass(refs.bench, 'is-demo', isDemo);
      clear(refs.demoNote);
      if (isDemo) {
        refs.demoNote.append(
          h('span', { class: 'demo__pip' }),
          h('span', { text: note ? `Example signals: ${note}` : 'Example signals running' })
        );
      } else {
        refs.demoNote.append(h('span', { class: 'demo__pip demo__pip--live' }), h('span', { text: 'You are driving' }));
      }
    },

    setProgress(solvedCount) {
      refs.progress.style.setProperty('--fill', `${(solvedCount / LEVELS.length) * 100}%`);
      refs.progress.setAttribute('aria-label', `${solvedCount} of ${LEVELS.length} features wired`);
      clear(refs.progressLabel);
      refs.progressLabel.append(h('span', { text: `${solvedCount}/${LEVELS.length} features alive` }));
    },
  };
}
