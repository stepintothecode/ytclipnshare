// Tests for web/src/support-footer.js, using the fake DOM.

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { FakeNode, installFakeDocument } from '../../support/fake-dom.js';
import { mountSupportFooter } from '../../../web/src/support-footer.js';
import { SUPPORT_LABEL, SUPPORT_REASON, supportLink } from '../../../core/support.js';
import { ICONS } from '../../../core/icons.js';

beforeEach(installFakeDocument);

const mount = (surface) => {
  const host = new FakeNode('footer');
  mountSupportFooter(host, surface);
  return host;
};

test('the footer says why, then links out saying which app it came from', () => {
  const [reason, link] = mount('web').children;

  assert.equal(reason.textContent, SUPPORT_REASON);
  assert.equal(link.href, supportLink('web'));
  assert.equal(link.text, SUPPORT_LABEL);
  assert.equal(link.rel, 'noopener');
});

test('the icon is drawn from core, not written into the page', () => {
  const [path] = mount('web').find('path');

  assert.equal(path.getAttribute('d'), ICONS.heart);
});

test('an unnamed surface leaves the footer empty instead of drawing a dead link', () => {
  assert.deepEqual(mount('desktop').children, []);
});

test('mounting twice replaces the footer rather than stacking two', () => {
  const host = new FakeNode('footer');
  mountSupportFooter(host, 'web');
  mountSupportFooter(host, 'web');

  assert.equal(host.children.length, 2);
});
