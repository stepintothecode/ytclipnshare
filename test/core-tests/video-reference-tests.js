// Tests for core/video-reference.js

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseVideoReference } from '../../core/video-reference.js';

const ID = 'dQw4w9WgXcQ';

test('accepts every link shape YouTube hands out', () => {
  const cases = [
    ID,
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}`,
    `https://youtu.be/${ID}?si=AbCdEfGhIjKl`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube.com/live/${ID}`,
    `https://m.youtube.com/watch?v=${ID}`,
    `https://music.youtube.com/watch?v=${ID}`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
    `youtube.com/watch?v=${ID}`,
    `www.youtube.com/watch?v=${ID}&feature=share`,
  ];

  for (const input of cases) {
    assert.equal(parseVideoReference(input)?.id, ID, input);
  }
});

test('picks up an existing timestamp in every notation', () => {
  const cases = [
    [`https://youtu.be/${ID}?t=90`, 90],
    [`https://youtu.be/${ID}?t=90s`, 90],
    [`https://youtu.be/${ID}?t=1m30s`, 90],
    [`https://www.youtube.com/watch?v=${ID}&t=1h2m3s`, 3723],
    [`https://www.youtube.com/embed/${ID}?start=43`, 43],
    [`https://youtu.be/${ID}`, 0],
  ];

  for (const [input, expected] of cases) {
    assert.equal(parseVideoReference(input)?.startAt, expected, input);
  }
});

test('finds the link inside messy share text', () => {
  const shared = `Mindblowing demo\nhttps://youtu.be/${ID}?t=15`;
  assert.deepEqual(parseVideoReference(shared), { id: ID, startAt: 15 });
});

test('a title whose first word is eleven characters is not a video ID', () => {
  // This used to return "Mindblowing" as the video ID, and the app then said
  // the video did not exist.
  assert.equal(parseVideoReference(`Mindblowing demo https://youtu.be/${ID}`)?.id, ID);
  assert.equal(parseVideoReference('Mindblowing demo of something'), null);
});

test('strips punctuation that ends the sentence, not the link', () => {
  assert.equal(parseVideoReference(`Watch this: https://youtu.be/${ID}.`)?.id, ID);
  assert.equal(parseVideoReference(`(https://youtu.be/${ID})`)?.id, ID);
});

test('refuses to guess', () => {
  const cases = [
    null,
    undefined,
    '',
    '   ',
    'just some text',
    'https://vimeo.com/123456789',
    'https://not-youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com/watch?v=tooshort',
    'https://youtube.com/results?search_query=cats',
  ];

  for (const input of cases) {
    assert.equal(parseVideoReference(input), null, String(input));
  }
});

test('a lookalike host is not YouTube', () => {
  assert.equal(parseVideoReference(`https://youtube.com.evil.test/watch?v=${ID}`), null);
});
