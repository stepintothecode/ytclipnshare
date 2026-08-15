// Tests for core/time.js

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { formatClock, parseClock, parseTimeParam } from '../../core/time.js';

test('formatClock drops the hour until there is one', () => {
  assert.equal(formatClock(0), '0:00');
  assert.equal(formatClock(9), '0:09');
  assert.equal(formatClock(83), '1:23');
  assert.equal(formatClock(600), '10:00');
  assert.equal(formatClock(3599), '59:59');
  assert.equal(formatClock(3600), '1:00:00');
  assert.equal(formatClock(3723), '1:02:03');
});

test('formatClock is defensive about junk', () => {
  assert.equal(formatClock(-5), '0:00');
  assert.equal(formatClock(undefined), '0:00');
  assert.equal(formatClock(12.6), '0:13');
});

test('parseClock reads what a person types', () => {
  assert.equal(parseClock('1:23'), 83);
  assert.equal(parseClock('1:02:03'), 3723);
  assert.equal(parseClock('83'), 83);
  assert.equal(parseClock(' 90 '), 90);
  assert.equal(parseClock('100:00'), 6000, 'long videos have three-digit minutes');
});

test('parseClock says null rather than guessing zero', () => {
  for (const input of ['', '   ', 'abc', '1:2:3:4', 'twelve', null, undefined]) {
    assert.equal(parseClock(input), null, String(input));
  }
});

test('parseTimeParam reads what YouTube writes', () => {
  assert.equal(parseTimeParam('90'), 90);
  assert.equal(parseTimeParam('90s'), 90);
  assert.equal(parseTimeParam('1m30s'), 90);
  assert.equal(parseTimeParam('1h2m3s'), 3723);
  assert.equal(parseTimeParam('2m'), 120);
});

test('a missing or unreadable timestamp is simply the start', () => {
  for (const input of ['', null, undefined, 'soon']) {
    assert.equal(parseTimeParam(input), 0, String(input));
  }
});
