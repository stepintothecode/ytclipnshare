// Tests for core/clip-range.js

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ClipRange, MIN_CLIP_SECONDS } from '../../core/clip-range.js';

test('a fresh range covers the whole video', () => {
  const range = ClipRange.of(300);
  assert.equal(range.start, 0);
  assert.equal(range.end, 300);
  assert.equal(range.length, 300);
  assert.ok(range.isWholeVideo);
});

test('an unknown duration is its own state, not a zero-length clip', () => {
  const range = ClipRange.unknown();
  assert.ok(range.isUnknown);
  assert.equal(range.duration, 0);
  assert.ok(!range.isWholeVideo);
});

test('start cannot pass the end of the video', () => {
  const range = ClipRange.of(100).withStart(500);
  assert.equal(range.start, 100 - MIN_CLIP_SECONDS);
  assert.equal(range.end, 100);
});

test('dragging start past end pushes end along', () => {
  const range = ClipRange.of(100, 0, 30).withStart(50);
  assert.equal(range.start, 50);
  assert.equal(range.end, 51);
});

test('dragging end below start pushes end back to the minimum clip', () => {
  const range = ClipRange.of(100, 40, 80).withEnd(10);
  assert.equal(range.start, 40);
  assert.equal(range.end, 41);
});

test('end is capped at the duration', () => {
  assert.equal(ClipRange.of(100, 10, 20).withEnd(9999).end, 100);
});

test('nudging is symmetric and stops at the edges', () => {
  const range = ClipRange.of(100, 0, 100);
  assert.equal(range.nudgeStart(-1).start, 0, 'start holds at zero');
  assert.equal(range.nudgeEnd(1).end, 100, 'end holds at the duration');
  assert.equal(range.nudgeStart(5).start, 5);
  assert.equal(ClipRange.of(100, 0, 50).nudgeEnd(1).end, 51);
});

test('learning the duration seeds start from a shared timestamp', () => {
  const range = ClipRange.unknown().withDuration(600, 42);
  assert.equal(range.start, 42);
  assert.equal(range.end, 600);
  assert.equal(range.duration, 600);
});

test('a second, longer video replaces the first duration entirely', () => {
  const first = ClipRange.unknown().withDuration(180, 0);
  const second = first.withDuration(1800, 0);
  assert.equal(second.duration, 1800);
  assert.equal(second.end, 1800);
});

test('ranges are immutable', () => {
  const range = ClipRange.of(100);
  const moved = range.withStart(10);
  assert.equal(range.start, 0);
  assert.equal(moved.start, 10);
  assert.ok(!range.equals(moved));
  assert.ok(range.equals(ClipRange.of(100)));
});

test('a video shorter than the minimum clip reads as unknown', () => {
  assert.ok(ClipRange.of(0).isUnknown);
  assert.ok(!ClipRange.of(1).isUnknown);
});

test('fractional and junk inputs are rounded into whole seconds', () => {
  assert.equal(ClipRange.of(100).withStart(10.6).start, 11);
  assert.equal(ClipRange.of(100).withStart(Number.NaN).start, 0);
  assert.equal(ClipRange.of(100).withStart(-40).start, 0);
});

test('long clips are flagged but still allowed', () => {
  assert.ok(ClipRange.of(1200, 0, 1200).isLong);
  assert.ok(!ClipRange.of(1200, 0, 600).isLong);
});
