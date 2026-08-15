import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SUPPORT_URL, supportLink, supportSurfaces } from '../../core/support.js';

test('each surface gets its own from tag', () => {
  assert.equal(supportLink('web'), `${SUPPORT_URL}?from=ytclipnshare-web`);
  assert.equal(supportLink('extension'), `${SUPPORT_URL}?from=ytclipnshare-ext`);
});

test('an unnamed surface gives null, not a link the support page cannot place', () => {
  assert.equal(supportLink('desktop'), null);
  assert.equal(supportLink(''), null);
  assert.equal(supportLink(undefined), null);
});

test('no two surfaces share a from tag', () => {
  const tags = supportSurfaces().map(supportLink);
  assert.equal(new Set(tags).size, tags.length);
});
