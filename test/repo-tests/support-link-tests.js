// Checks the whole repo, not one source file: the support link is described in
// core/ and drawn by each app, so neither page holds a URL of its own.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SUPPORT_URL } from '../../core/support.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PAGES = ['web/index.html', 'extension/popup.html'];

const read = (page) => readFileSync(join(ROOT, page), 'utf8');

for (const page of PAGES) {
  test(`${page} leaves an empty footer for the support link`, () => {
    assert.match(read(page), /<footer class="support" id="support"><\/footer>/);
  });

  test(`${page} does not repeat the support URL`, () => {
    assert.ok(
      !read(page).includes(SUPPORT_URL),
      'the URL belongs in core/support.js, so the two apps cannot drift apart',
    );
  });
}

test('no page links straight to a payment provider', () => {
  for (const page of PAGES) {
    const html = read(page);
    for (const provider of ['ko-fi.com', 'github.com/sponsors', 'paypal', 'upi://', 'razorpay']) {
      assert.ok(
        !html.includes(provider),
        `${page} names ${provider}. Providers live on the support page, so swapping one `
          + 'never means shipping a new extension build and waiting on a store review.',
      );
    }
  }
});
