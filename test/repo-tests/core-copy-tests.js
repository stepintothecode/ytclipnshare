// Checks the whole repo, not one source file: extension/core/ has to match
// core/. See extension/core/DO_NOT_EDIT.md.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { coreFiles, staleFiles } from '../../tools/sync-core.mjs';

test('there are core modules to copy', () => {
  assert.ok(coreFiles().length > 0);
});

test('extension/core is up to date', () => {
  assert.deepEqual(staleFiles(), [], 'run: node tools/sync-core.mjs');
});
