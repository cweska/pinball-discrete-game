/**
 * Link check.
 *
 * Importing a module makes the runtime resolve every named import in it, so
 * this catches a symbol imported from the wrong file - which in a no-build
 * project is otherwise only found by loading the page in a browser.
 *
 * src/main.js is skipped because it touches the document as soon as it loads.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const SRC = resolve(import.meta.dirname, '..', 'src');
const SKIP = new Set(['main.js']);

async function jsFiles(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await jsFiles(path)));
    else if (entry.name.endsWith('.js') && !SKIP.has(relative(SRC, path))) found.push(path);
  }
  return found;
}

const files = await jsFiles(SRC);

test('there are modules to check', () => {
  assert.ok(files.length > 15, `only found ${files.length} modules`);
});

for (const file of files) {
  test(`every import in src/${relative(SRC, file)} resolves`, async () => {
    const module = await import(file);
    assert.ok(module, 'module loaded');
  });
}
