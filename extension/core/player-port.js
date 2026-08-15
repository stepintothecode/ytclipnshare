/* Generated copy - do not edit. See extension/core/DO_NOT_EDIT.md
   Source: core/player-port.js - regenerate with: npm run sync */

// Both apps drive a YouTube player, but not the same one. This file describes
// what a player has to do, so the UI never talks to a player directly.
//
//   web/src/iframe-player.js      YouTube's embedded player
//   extension/src/tab-player.js   the <video> on a YouTube tab
//   test/support/fake-youtube.js  a stub for tests
//
// Only the web app loads a video. The extension reads whichever one the tab
// already has, so it skips load() and implements the rest.

/**
 * Why a load failed. The UI turns these into sentences; nothing else looks at
 * YouTube's numeric codes.
 *
 * @typedef {'embedding-disabled' | 'not-found' | 'bad-id' | 'timed-out' | 'unavailable'} PlayerFailure
 */

/**
 * @typedef {object} PlayerPort
 * @property {(videoId: string, options?: object) => Promise<{duration: number}>} load
 *   Loads a video, resolves once its duration is known.
 * @property {() => number} currentTime
 * @property {(seconds: number) => void} seek
 * @property {(start: number, end: number, onEnd: () => void) => void} playRange
 * @property {() => void} stop
 * @property {() => void} destroy
 */

export class PlayerError extends Error {
  /** @param {PlayerFailure} reason */
  constructor(reason, message) {
    super(message);
    this.name = 'PlayerError';
    this.reason = reason;
  }
}

/** YouTube's numeric error codes, translated once. */
export function failureFromYouTubeCode(code) {
  switch (code) {
    case 101:
    case 150:
      return 'embedding-disabled';
    case 100:
      return 'not-found';
    case 2:
      return 'bad-id';
    default:
      return 'unavailable';
  }
}

/** The sentence a person reads. Shared by both apps. */
export function describeFailure(reason) {
  switch (reason) {
    case 'embedding-disabled':
      return 'This creator has disabled embedding. Your clip link won’t play for them, so send the fallback link instead.';
    case 'not-found':
      return 'That video doesn’t exist, or it’s private.';
    case 'bad-id':
      return 'That video ID looks malformed.';
    case 'timed-out':
      return 'The player didn’t respond. Check your connection and try loading it again.';
    default:
      return 'The player hit an error. The fallback link should still work.';
  }
}
