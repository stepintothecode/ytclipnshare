// Everything the web app and the extension share. No DOM, no browser APIs.

export { formatClock, parseClock, parseTimeParam } from './time.js';
export { ClipRange, MIN_CLIP_SECONDS, LONG_CLIP_SECONDS } from './clip-range.js';
export { parseVideoReference, isVideoReference } from './video-reference.js';
export { ICON_BOX, ICONS } from './icons.js';
export {
  SUPPORT_URL,
  SUPPORT_REASON,
  SUPPORT_LABEL,
  supportLink,
  supportSurfaces,
} from './support.js';
export {
  DEFAULT_OPTIONS,
  withDefaults,
  clipLink,
  fallbackLink,
  playerVars,
  buildLinks,
} from './youtube-embed.js';
