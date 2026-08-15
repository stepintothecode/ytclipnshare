// The start and end of a clip, kept valid: 0 <= start < end <= duration.
// Immutable, so every change returns a new ClipRange.

export const MIN_CLIP_SECONDS = 1;

/** Clips longer than this are flagged in the UI, not blocked. */
export const LONG_CLIP_SECONDS = 600;

function toWhole(n) {
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function clamp(n, low, high) {
  return Math.min(high, Math.max(low, n));
}

// Fits start into the video first, then end after it. So dragging start past
// end pushes end along, and start is only held back when end runs out of room.
function normalise(start, end, duration) {
  const d = Math.max(0, toWhole(duration));
  if (d < MIN_CLIP_SECONDS) return { start: 0, end: 0, duration: d };
  const s = clamp(toWhole(start), 0, d - MIN_CLIP_SECONDS);
  const e = clamp(toWhole(end), s + MIN_CLIP_SECONDS, d);
  return { start: s, end: e, duration: d };
}

export class ClipRange {
  #start;
  #end;
  #duration;

  constructor(start, end, duration) {
    const v = normalise(start, end, duration);
    this.#start = v.start;
    this.#end = v.end;
    this.#duration = v.duration;
    Object.freeze(this);
  }

  /** Before the player has reported a duration. */
  static unknown() {
    return new ClipRange(0, 0, 0);
  }

  static of(duration, start = 0, end = duration) {
    return new ClipRange(start, end, duration);
  }

  get start() {
    return this.#start;
  }

  get end() {
    return this.#end;
  }

  get duration() {
    return this.#duration;
  }

  get length() {
    return this.#end - this.#start;
  }

  /** No duration yet, so the UI should stay in its loading state. */
  get isUnknown() {
    return this.#duration < MIN_CLIP_SECONDS;
  }

  get isLong() {
    return this.length > LONG_CLIP_SECONDS;
  }

  get isWholeVideo() {
    return !this.isUnknown && this.#start === 0 && this.#end === this.#duration;
  }

  withStart(seconds) {
    return new ClipRange(seconds, this.#end, this.#duration);
  }

  withEnd(seconds) {
    return new ClipRange(this.#start, seconds, this.#duration);
  }

  nudgeStart(delta) {
    return this.withStart(this.#start + delta);
  }

  nudgeEnd(delta) {
    return this.withEnd(this.#end + delta);
  }

  /**
   * Called when the player reports a duration, including for the second and
   * third video someone loads. startAt seeds the start from a t= timestamp.
   */
  withDuration(duration, startAt = 0) {
    return new ClipRange(startAt, duration, duration);
  }

  equals(other) {
    return (
      other instanceof ClipRange &&
      other.start === this.#start &&
      other.end === this.#end &&
      other.duration === this.#duration
    );
  }

  toJSON() {
    return { start: this.#start, end: this.#end, duration: this.#duration };
  }
}
