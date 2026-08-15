// Tests for core/youtube-embed.js

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ClipRange } from '../../core/clip-range.js';
import {
  buildLinks,
  clipLink,
  fallbackLink,
  playerVars,
} from '../../core/youtube-embed.js';

const ID = 'dQw4w9WgXcQ';

const paramsOf = (link) => new URL(link).searchParams;

test('a clip link carries the range', () => {
  const params = paramsOf(clipLink(ID, ClipRange.of(300, 30, 90)));
  assert.equal(params.get('start'), '30');
  assert.equal(params.get('end'), '90');
});

test('a start of zero is left out, an end never is', () => {
  const params = paramsOf(clipLink(ID, ClipRange.of(300, 0, 90)));
  assert.equal(params.get('start'), null);
  assert.equal(params.get('end'), '90');
});

test('options map onto the player parameters YouTube expects', () => {
  const range = ClipRange.of(300, 10, 90);

  const hidden = paramsOf(clipLink(ID, range, { hideRelated: true }));
  assert.equal(hidden.get('rel'), '0');

  const shown = paramsOf(clipLink(ID, range, { hideRelated: false }));
  assert.equal(shown.get('rel'), null);

  const looped = paramsOf(clipLink(ID, range, { loop: true }));
  assert.equal(looped.get('loop'), '1');
  assert.equal(looped.get('playlist'), ID, 'looping one video needs it as the playlist');

  const auto = paramsOf(clipLink(ID, range, { autoplay: true }));
  assert.equal(auto.get('autoplay'), '1');
  assert.equal(auto.get('mute'), '1', 'browsers block unmuted autoplay');
});

test('privacy mode changes the embed host', () => {
  const range = ClipRange.of(300, 0, 90);
  assert.equal(new URL(clipLink(ID, range)).hostname, 'www.youtube.com');
  assert.equal(
    new URL(clipLink(ID, range, { privacy: true })).hostname,
    'www.youtube-nocookie.com',
  );
});

test('the fallback link is a plain watch link at the start time', () => {
  assert.equal(fallbackLink(ID, ClipRange.of(300, 43, 90)), `https://youtu.be/${ID}?t=43`);
  assert.equal(fallbackLink(ID, ClipRange.of(300, 0, 90)), `https://youtu.be/${ID}`);
});

test('preview vars come from the same options as the clip link', () => {
  const range = ClipRange.of(300, 30, 90);
  assert.equal(playerVars(range, { hideRelated: true }).rel, 0);
  assert.equal(playerVars(range, { hideRelated: false }).rel, 1);
  assert.equal(playerVars(range).start, 30, 'the preview opens where the clip does');
});

test('both links are built from one call', () => {
  const links = buildLinks(ID, ClipRange.of(300, 30, 90));
  assert.ok(links.clip.includes('/embed/'));
  assert.ok(links.fallback.startsWith('https://youtu.be/'));
});
