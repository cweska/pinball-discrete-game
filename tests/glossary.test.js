import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitGlossary } from '../src/ui/glossary.js';

function marked(text) {
  return splitGlossary(text)
    .filter((part) => part.def)
    .map((part) => part.text);
}

function roundTrip(text) {
  assert.equal(
    splitGlossary(text).map((part) => part.text).join(''),
    text
  );
}

test('a phrase is one tip, and a longer word is not split', () => {
  assert.deepEqual(marked('The ball leaves the shooter lane.'), ['shooter lane']);
  assert.deepEqual(marked('A ball in the left outlane drains.'), ['outlane', 'drains']);
  assert.deepEqual(marked('The pop bumpers kick.'), ['pop bumpers']);
  assert.deepEqual(marked('End of ball turns the ball saver off.'), ['End of ball', 'ball saver']);
  assert.deepEqual(marked('one ball-release coil on the drop-target level'), ['ball-release', 'coil', 'drop-target']);
  roundTrip('The ball leaves the shooter lane.');
  roundTrip('A ball in the left outlane drains.');
});

test('ordinary words and logic gates stay unmarked', () => {
  const plain = 'The level is locked. Put an AND gate in the socket.';
  assert.deepEqual(marked(plain), []);
  roundTrip(plain);
  assert.deepEqual(marked('Fire it during a game. GAME ON is 1.'), ['GAME ON']);
  assert.deepEqual(
    marked('The buttons under the playfield are the real switches. Hold, tap, or turn them and watch the machine.'),
    ['playfield', 'switches']
  );
});

test('each marked word keeps the original letters and a definition', () => {
  const parts = splitGlossary('LEFT FLIPPER COIL');
  assert.deepEqual(marked('LEFT FLIPPER COIL'), ['FLIPPER', 'COIL']);
  for (const part of parts) {
    if (part.def) assert.match(part.def, /\S/);
  }
  roundTrip('LEFT FLIPPER COIL');
});
