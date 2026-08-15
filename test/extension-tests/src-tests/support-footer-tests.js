// Tests for extension/src/support-footer.js, using the fake DOM. This one also
// proves the generated extension/core/ copy is wired up, since the renderer
// reads the link and the icon through it.

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { FakeNode, installFakeDocument } from '../../support/fake-dom.js';
import { mountSupportFooter } from '../../../extension/src/support-footer.js';
import { SUPPORT_LABEL, SUPPORT_REASON, supportLink } from '../../../core/support.js';
import { ICONS } from '../../../core/icons.js';

beforeEach(installFakeDocument);

const mount = (surface) => {
  const host = new FakeNode('footer');
  mountSupportFooter(host, surface);
  return host;
};

test('the popup footer links out as the extension, not as the web app', () => {
  const [reason, link] = mount('extension').children;

  assert.equal(reason.textContent, SUPPORT_REASON);
  assert.equal(link.href, supportLink('extension'));
  assert.equal(link.text, SUPPORT_LABEL);
  assert.equal(link.rel, 'noopener');
});

test('the icon matches the one the web app draws', () => {
  const [path] = mount('extension').find('path');

  assert.equal(path.getAttribute('d'), ICONS.heart);
});

test('an unnamed surface leaves the footer empty instead of drawing a dead link', () => {
  assert.deepEqual(mount('desktop').children, []);
});
