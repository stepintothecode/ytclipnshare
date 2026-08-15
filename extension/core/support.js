/* Generated copy - do not edit. See extension/core/DO_NOT_EDIT.md
   Source: core/support.js - regenerate with: npm run sync */

// Where the tip jar lives, and which app sent someone to it. The URL is here
// rather than in the two pages so that changing payment provider never means
// editing an app that is already published to a store.

export const SUPPORT_URL = 'https://stepintothecode.github.io/support/';

// The support page greets people by the project they came from. Add a surface
// here and a matching entry to PROJECTS in the support repo.
const SOURCES = {
  web: 'ytclipnshare-web',
  extension: 'ytclipnshare-ext',
};

export const SUPPORT_REASON = 'Free, ad-free and no tracking.';
export const SUPPORT_LABEL = 'Chip in';

/**
 * supportLink('web') -> 'https://stepintothecode.github.io/support/?from=ytclipnshare-web'
 * Returns null for a surface nobody has named, so a typo draws nothing rather
 * than a link the support page cannot recognise.
 */
export function supportLink(surface) {
  const from = SOURCES[surface];
  return from ? `${SUPPORT_URL}?from=${from}` : null;
}

export function supportSurfaces() {
  return Object.keys(SOURCES);
}
