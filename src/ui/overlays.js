/**
 * Modal panels: the level map, the how-to-play card, and the moment a feature
 * starts working.
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
      h('span', { class: 'map__state', text: solved ? 'done' : open ? 'open' : 'locked' })
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
            ? 'The machine plays by itself. A ball rolls around, and your finished circuits control it.'
            : 'Finish at least 3 levels to unlock this.',
        })
      );
      if (freePlayReady) {
        freePlay.addEventListener('click', () => {
          dialog.close();
          onFreePlay?.();
        });
      }

      open(h('h2', { class: 'modal__title', text: 'Levels', dataset: { autofocus: '' } }), ...acts, freePlay);
    },

    showHelp() {
      open(
        h('h2', { class: 'modal__title', text: 'How to play', dataset: { autofocus: '' } }),
        h('ol', { class: 'help' },
          h('li', {}, h('strong', { text: 'Read your job. ' }), 'The text above the bench says what this part of the machine should do. Click Show every case to see each 0 and 1 the circuit has to match.'),
          h('li', {}, h('strong', { text: 'Place a gate. ' }), 'Drag a gate from the parts bin, or click it and then click where it goes. Early levels have sockets you must use. Later levels let you place gates anywhere on the bench.'),
          h('li', {}, h('strong', { text: 'Connect a wire. ' }), 'A wire goes from an output pin to an input pin. Output pins are the circle on the right of a gate, and the circle on an INPUTS box (left side). Input pins are the circles on the left of a gate, and the circle on an OUTPUTS box (right side). Drag from one circle to the other, or click one and then the other. Click a wire to delete it. One output can connect to many inputs.'),
          h('li', {}, h('strong', { text: 'Read the wires. ' }), 'Moving dots mean a wire is connected. A bright solid line is 1 (on). A dim dashed line is 0 (off). A gray line is not connected yet. The 0s and 1s button in the top bar shows or hides those numbers.'),
          h('li', {}, h('strong', { text: 'Try every input. ' }), 'The Try inputs controls, above the bench, walk through every combination of the switches. Back and Next move one combination. Cycle Inputs keeps going until you turn it off.'),
          h('li', {}, h('strong', { text: 'Test the machine. ' }), 'The buttons under the playfield are the real switches. Hold, tap, or switch them and watch the machine. Then press Test the circuit. That checks every case at once.'),
          h('li', {}, h('strong', { text: 'If you get stuck, press Hint. ' }), 'A hint also shows up on its own after about two minutes.')
        ),
        h('h3', { class: 'help__sub', text: 'Keyboard' }),
        h('ul', { class: 'help' },
          h('li', {}, 'Tab moves between gates, sockets, and pins. Press Enter to pick up a gate. Press Enter on a socket to place it.'),
          h('li', {}, 'Press Enter on one pin, then Enter on another pin, to connect a wire.'),
          h('li', {}, 'Delete removes the selected gate. Press Undo, or Ctrl+Z (Cmd+Z on a Mac), to undo. Escape cancels.')
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
      const stay = h('button', { class: 'btn', type: 'button', text: 'Stay and try it' });
      stay.addEventListener('click', () => {
        dialog.close();
        onStay?.();
      });
      buttons.push(stay);

      open(
        h('p', { class: 'done__kicker', text: 'It works.' }),
        h('h2', { class: 'modal__title', text: `${level.title} is working` }),
        h('p', { class: 'done__body', text: level.teacher.answer }),
        next
          ? h('p', { class: 'done__next', text: `Next up: ${next.brief.goal}` })
          : h('p', { class: 'done__next', text: 'You finished every level. The castle machine is ready to play.' }),
        h('div', { class: 'modal__actions' }, buttons)
      );
    },

    hide() {
      if (dialog.open) dialog.close();
    },
  };
}
