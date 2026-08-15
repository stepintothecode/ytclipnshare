// Builds the YouTube URLs. Kept in one place so the preview player and the
// shared link always agree.

/**
 * @typedef {{ hideRelated: boolean, loop: boolean, autoplay: boolean, privacy: boolean }} ClipOptions
 */

/** @type {ClipOptions} */
export const DEFAULT_OPTIONS = Object.freeze({
  hideRelated: true,
  loop: false,
  autoplay: false,
  privacy: false,
});

export function withDefaults(options) {
  return { ...DEFAULT_OPTIONS, ...(options ?? {}) };
}

function embedHost(options) {
  return withDefaults(options).privacy
    ? 'https://www.youtube-nocookie.com'
    : 'https://www.youtube.com';
}

/**
 * The link people share. Starts and stops where the range says.
 * e.g. https://www.youtube.com/embed/ID?start=30&end=90&rel=0
 */
export function clipLink(videoId, range, options) {
  const opts = withDefaults(options);
  const params = new URLSearchParams();

  if (range.start > 0) params.set('start', String(range.start));
  params.set('end', String(range.end));
  if (opts.hideRelated) params.set('rel', '0');
  if (opts.loop) {
    params.set('loop', '1');
    // YouTube only loops one video if it is also the whole playlist.
    params.set('playlist', videoId);
  }
  if (opts.autoplay) {
    params.set('autoplay', '1');
    // Browsers block unmuted autoplay, so these two go together.
    params.set('mute', '1');
  }

  return `${embedHost(opts)}/embed/${videoId}?${params}`;
}

/**
 * For creators who block embedding. Opens the video normally at the start
 * time, with no end time. e.g. https://youtu.be/ID?t=43
 */
export function fallbackLink(videoId, range) {
  return `https://youtu.be/${videoId}${range.start > 0 ? `?t=${range.start}` : ''}`;
}

/** Settings for the preview player, from the same options as the clip link. */
export function playerVars(range, options) {
  const opts = withDefaults(options);
  return {
    playsinline: 1,
    modestbranding: 1,
    rel: opts.hideRelated ? 0 : 1,
    start: range.start,
  };
}

/** Both links at once, which is what the UI shows. */
export function buildLinks(videoId, range, options) {
  return {
    clip: clipLink(videoId, range, options),
    fallback: fallbackLink(videoId, range),
  };
}
