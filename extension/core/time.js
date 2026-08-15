/* Generated copy - do not edit. See extension/core/DO_NOT_EDIT.md
   Source: core/time.js - regenerate with: npm run sync */

// Turning seconds into clock text and back.

/** 83 -> "1:23", 3723 -> "1:02:03" */
export function formatClock(seconds) {
  const total = Math.max(0, Math.round(seconds || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h && m < 10 ? `0${m}` : String(m);
  return `${h ? `${h}:` : ''}${mm}:${s < 10 ? `0${s}` : s}`;
}

/** What a person types: "1:23", "1:02:03" or "83". Returns null if unreadable. */
export function parseClock(text) {
  if (text == null) return null;
  const s = String(text).trim();
  if (s === '') return null;
  if (/^\d+(\.\d+)?$/.test(s)) return Math.max(0, Math.round(parseFloat(s)));
  if (!/^\d{1,3}(:\d{1,2}){1,2}$/.test(s)) return null;
  const parts = s.split(':').map(Number);
  const seconds =
    parts.length === 3
      ? parts[0] * 3600 + parts[1] * 60 + parts[2]
      : parts[0] * 60 + parts[1];
  return Math.max(0, seconds);
}

/** What YouTube puts in t=: "90", "90s", "1m30s". Returns 0 if unreadable. */
export function parseTimeParam(value) {
  if (!value) return 0;
  const v = String(value).trim();
  if (/^\d+(\.\d+)?s?$/.test(v)) return Math.floor(parseFloat(v));
  const m = v.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (m && (m[1] || m[2] || m[3])) {
    return Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0);
  }
  return 0;
}
