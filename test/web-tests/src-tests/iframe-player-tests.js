// Tests for web/src/iframe-player.js, using the fake YouTube player.

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { fake, resetFake } from '../../support/fake-youtube.js';
import { IframePlayer } from '../../../web/src/iframe-player.js';

const SHORT = 'aaaaaaaaaaa';
const LONG = 'bbbbbbbbbbb';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

beforeEach(() => {
  resetFake();
});

test('a load resolves once the duration is known', async () => {
  fake.durations = { [SHORT]: 183 };
  const player = new IframePlayer('mount');

  assert.deepEqual(await player.load(SHORT), { duration: 183 });
});

test('loading a second video reports the second video’s duration', async () => {
  // This used to keep the first video's duration, because loadVideoById never
  // fires onReady again and that was the only place duration was read.
  fake.durations = { [SHORT]: 180, [LONG]: 1800 };
  const player = new IframePlayer('mount');

  assert.equal((await player.load(SHORT)).duration, 180);
  assert.equal((await player.load(LONG)).duration, 1800);
});

test('an embed with no video_id still loads on duration alone', async () => {
  fake.durations = { [SHORT]: 42 };
  fake.reportsVideoId = false;
  const player = new IframePlayer('mount');

  assert.equal((await player.load(SHORT)).duration, 42);
});

test('a blocked embed fails the load with a reason the UI can explain', async () => {
  fake.errorCode = 150;
  const player = new IframePlayer('mount');

  await assert.rejects(player.load(SHORT), (error) => {
    assert.equal(error.name, 'PlayerError');
    assert.equal(error.reason, 'embedding-disabled');
    return true;
  });
});

test('a missing video is told apart from a blocked one', async () => {
  fake.errorCode = 100;
  const player = new IframePlayer('mount');

  await assert.rejects(player.load(SHORT), (error) => {
    assert.equal(error.reason, 'not-found');
    return true;
  });
});

test('previewing stops at the end of the range and reports back', async () => {
  fake.durations = { [SHORT]: 300 };
  const player = new IframePlayer('mount');
  await player.load(SHORT);

  let ended = false;
  player.playRange(10, 20, () => {
    ended = true;
  });

  assert.equal(fake.lastPlayer.currentTime, 10, 'preview seeks to the start');
  assert.ok(player.isPreviewing);

  fake.lastPlayer.currentTime = 20;
  await delay(300);

  assert.ok(ended, 'onEnd fired');
  assert.ok(!player.isPreviewing);
  assert.equal(fake.lastPlayer.playing, false, 'playback paused');
  assert.equal(fake.lastPlayer.currentTime, 10, 'playhead returned to the start');
});

test('stopping a preview leaves the video where it is', async () => {
  fake.durations = { [SHORT]: 300 };
  const player = new IframePlayer('mount');
  await player.load(SHORT);

  let ended = false;
  player.playRange(10, 20, () => {
    ended = true;
  });
  player.stop();

  fake.lastPlayer.currentTime = 20;
  await delay(300);

  assert.ok(!ended, 'a stopped preview does not fire onEnd');
  assert.ok(!player.isPreviewing);
});
