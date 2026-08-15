import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ICON_BOX, ICONS } from '../../core/icons.js';

test('there are icons to draw', () => {
  assert.ok(Object.keys(ICONS).length > 0);
});

test('every icon is a path that starts by moving the pen', () => {
  for (const [name, d] of Object.entries(ICONS)) {
    assert.match(d, /^M/, `${name} should start with a move command`);
  }
});

test('the box is square, so CSS can size an icon with one number', () => {
  const [, , width, height] = ICON_BOX.split(' ').map(Number);
  assert.equal(width, height);
});
