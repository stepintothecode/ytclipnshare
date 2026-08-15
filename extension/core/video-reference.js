/* Generated copy - do not edit. See extension/core/DO_NOT_EDIT.md
   Source: core/video-reference.js - regenerate with: npm run sync */

// Finds a video ID in a link, a bare ID, or messy share text.
// Returns null when there is no YouTube link. It never guesses.

import { parseTimeParam } from './time.js';

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

const ALLOWED_HOSTS = new Set([
  'youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
]);

/** Subdomains that are still the same site. */
const IGNORED_SUBDOMAINS = /^(?:www|m|music|gaming)\./;

// Finds links inside text like "Great demo https://youtu.be/ID".
// The leading boundary stops the host part matching the tail of
// "not-youtube.com". Group 1 is the link; the boundary character is not.
const LINK_LIKE =
  /(?:^|[^A-Za-z0-9.\-])((?:https?:\/\/)?(?:[A-Za-z0-9-]+\.)*(?:youtube\.com|youtu\.be|youtube-nocookie\.com)\/[^\s"'<>]*)/gi;

/** Punctuation swept up when a link ends a sentence. */
const TRAILING_JUNK = /[.,;:!?)\]}>]+$/;

const PATH_ID = /\/(?:shorts|embed|live|v)\/([A-Za-z0-9_-]{11})/;

/**
 * @param {string} input
 * @returns {{id: string, startAt: number} | null}
 */
export function parseVideoReference(input) {
  if (input == null) return null;
  const text = String(input).trim();
  if (!text) return null;

  if (VIDEO_ID.test(text)) return { id: text, startAt: 0 };

  for (const [, candidate] of text.matchAll(LINK_LIKE)) {
    const reference = fromLink(candidate.replace(TRAILING_JUNK, ''));
    if (reference) return reference;
  }

  return null;
}

export function isVideoReference(input) {
  return parseVideoReference(input) !== null;
}

function fromLink(candidate) {
  let url;
  try {
    url = new URL(
      /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`,
    );
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(IGNORED_SUBDOMAINS, '');
  if (!ALLOWED_HOSTS.has(host)) return null;

  const id = host === 'youtu.be' ? shortLinkId(url) : longLinkId(url);
  if (!id) return null;

  return {
    id,
    startAt: parseTimeParam(
      url.searchParams.get('t') ?? url.searchParams.get('start'),
    ),
  };
}

/** youtu.be/ID */
function shortLinkId(url) {
  const segment = url.pathname.split('/')[1] ?? '';
  return VIDEO_ID.test(segment) ? segment : null;
}

/** youtube.com/watch?v=ID, or /shorts/ID, /embed/ID, /live/ID */
function longLinkId(url) {
  const v = url.searchParams.get('v');
  if (v && VIDEO_ID.test(v)) return v;
  const match = url.pathname.match(PATH_ID);
  return match ? match[1] : null;
}
