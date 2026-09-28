import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parsePcmWav } from '../src/machine/audio.js';

test('parsePcmWav reads a 22050 Hz mono clip', async () => {
  const bytes = await readFile(new URL('../assets/sounds/fx_Flipperup.wav', import.meta.url));
  const pcm = parsePcmWav(bytes);
  assert.equal(pcm.sampleRate, 22050);
  assert.equal(pcm.channels, 1);
  assert.equal(pcm.frames, 5222);
  assert.equal(pcm.samples.length, 1);
  assert.equal(pcm.samples[0].length, 5222);
  assert.ok(Math.abs(pcm.samples[0][0] - 177 / 32768) < 1e-7);
});

test('parsePcmWav reads a 44100 Hz stereo clip', async () => {
  const bytes = await readFile(new URL('../assets/sounds/left_slingshot.wav', import.meta.url));
  const pcm = parsePcmWav(bytes);
  assert.equal(pcm.sampleRate, 44100);
  assert.equal(pcm.channels, 2);
  assert.equal(pcm.frames, 15795);
  assert.equal(pcm.samples[0].length, 15795);
  assert.equal(pcm.samples[1].length, 15795);
  assert.ok(Math.abs(pcm.samples[0][0] - 1 / 32768) < 1e-7);
  assert.ok(Math.abs(pcm.samples[1][0] - -1 / 32768) < 1e-7);
});
