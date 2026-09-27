/**
 * Modal panels: the act map, the how-to-play card, and the moment a feature
 * comes alive.
 */

import { clear, h } from '../util/dom.js';
import { ACTS, LEVELS } from '../levels/index.js';

export function createOverlays(host, { onSelectLevel, onFreePlay } = {}) {
  const dialog = h('dialog', { class: 'modal' });
  host.append(dialog);

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  function open(...children) {
    clear(dialog);
    const close = h('button', { class: 'modal__close', type: 'button', 'aria-label': 'Close', text: '\u00d7' });
    close.addEventListener('click', () => dialog.close());
    dialog.append(close, ...children);
    if (!dialog.open) dialog.showModal();
    const focusTarget = dialog.querySelector('[data-autofocus]') || close;
    focusTarget.focus();
  }

  function levelButton(level, { unlocked, solved, current }) {
    const open = level.number <= unlocked;
    const button = h(
      'button',
      {
        class: [
          'map__level',
          solved ? 'is-solved' : '',
          level.number === current ? 'is-current' : '',
          open ? '' : 'is-locked',
        ],
        type: 'button',
        disabled: !open,
        dataset: { level: String(level.number) },
      },
      h('span', { class: 'map__num', text: String(level.number) }),
      h('span', { class: 'map__name', text: level.title }),
      h('span', { class: 'map__state', text: solved ? 'wired' : open ? 'open' : 'locked' })
    );
    if (open) button.addEventListener('click', () => {
      dialog.close();
      onSelectLevel?.(level.number);
    });
    return button;
  }

  return {
    dialog,
    showMap({ unlocked, solved, current, freePlayReady }) {
      const acts = ACTS.map((act) =>
        h(
          'section',
          { class: 'map__act' },
          h('h3', { class: 'map__act-title' }, `Act ${act.act}. ${act.title}`, h('span', { class: 'map__act-blurb', text: act.blurb })),
          h(
            'div',
            { class: 'map__grid' },
            LEVELS.filter((level) => level.act === act.act).map((level) =>
              levelButton(level, { unlocked, solved: solved.includes(level.id), current })
            )
          )
        )
      );

      const freePlay = h(
        'button',
        {
          class: ['map__freeplay', freePlayReady ? '' : 'is-locked'],
          type: 'button',
          disabled: !freePlayReady,
        },
        h('span', { class: 'map__freeplay-title', text: 'Free Play' }),
        h('span', {
          class: 'map__freeplay-note',
          text: freePlayReady
            ? 'Turn the machine loose. A ball runs the playfield and every circuit you built drives it.'
            : 'Wire at least three features to open this up.',
        })
      );
      if (freePlayReady) {
        freePlay.addEventListener('click', () => {
          dialog.close();
          onFreePlay?.();
        });
      }

      open(h('h2', { class: 'modal__title', text: 'Act map', dataset: { autofocus: '' } }), ...acts, freePlay);
    },

    showHelp() {
      open(
        h('h2', { class: 'modal__title', text: 'How to play', dataset: { autofocus: '' } }),
        h('ol', { class: 'help' },
          h('li', {}, h('strong', { text: 'Read the job. ' }), 'Each build tells you what the machine should do. "Show exactly what it has to do" spells it out signal by signal.'),
          h('li', {}, h('strong', { text: 'Place a gate. ' }), 'Drag one out of the parts bin, or click it and then click where it goes. Early builds have sockets; later ones let you put gates anywhere.'),
          h('li', {}, h('strong', { text: 'Wire it. ' }), 'Drag from the circle on the right of a gate, or click a whole terminal, then drop on an input pin or a TO THE MACHINE terminal. Click a pin then another pin works too. Click a wire to remove it. One output can feed as many inputs as you like.'),
          h('li', {}, h('strong', { text: 'Watch the flow. ' }), 'Dots travel along every live wire. Bright and solid means 1, dim and dashed means 0, grey means nothing is driving it yet.'),
          h('li', {}, h('strong', { text: 'Step the inputs. ' }), 'Signal Testing walks every combination of the input switches. Back and Next move one combination at a time. Repeat cycles through all of them until you turn it off.'),
          h('li', {}, h('strong', { text: 'Test it. ' }), 'The test controls close real switches. Hold, tap or flip them and watch the machine. Then press Test the circuit to check every case at once.'),
          h('li', {}, h('strong', { text: 'Stuck? ' }), 'Hints arrive on their own after a couple of minutes, or press Hint whenever you want one.')
        ),
        h('h3', { class: 'help__sub', text: 'Keyboard' }),
        h('ul', { class: 'help' },
          h('li', {}, 'Tab moves between parts, sockets and pins. Enter picks up a gate, then Enter on a socket drops it in.'),
          h('li', {}, 'Enter on one pin then Enter on another draws a wire between them.'),
          h('li', {}, 'Delete removes the focused gate. Ctrl+Z undoes. Escape cancels.')
        )
      );
    },

    showComplete({ level, next, onNext, onStay, onMap }) {
      const buttons = [];
      if (next) {
        const button = h('button', { class: 'btn btn--primary', type: 'button', text: `Next: ${next.title}`, dataset: { autofocus: '' } });
        button.addEventListener('click', () => {
          dialog.close();
          onNext?.();
        });
        buttons.push(button);
      } else {
        const button = h('button', { class: 'btn btn--primary', type: 'button', text: 'Open Free Play', dataset: { autofocus: '' } });
        button.addEventListener('click', () => {
          dialog.close();
          onMap?.();
        });
        buttons.push(button);
      }
      const stay = h('button', { class: 'btn', type: 'button', text: 'Stay here and poke at it' });
      stay.addEventListener('click', () => {
        dialog.close();
        onStay?.();
      });
      buttons.push(stay);

      open(
        h('p', { class: 'done__kicker', text: 'That works.' }),
        h('h2', { class: 'modal__title', text: `${level.title} is alive` }),
        h('p', { class: 'done__body', text: level.teacher.answer }),
        next
          ? h('p', { class: 'done__next', text: `Up next: ${next.brief.goal}` })
          : h('p', { class: 'done__next', text: 'Every feature on GATECRASHER is wired. The machine is yours.' }),
        h('div', { class: 'modal__actions' }, buttons)
      );
    },

    hide() {
      if (dialog.open) dialog.close();
    },
  };
}
