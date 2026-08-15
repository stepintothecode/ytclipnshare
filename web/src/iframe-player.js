// Drives YouTube's embedded player. The UI never touches YT.Player itself.

import { PlayerError, failureFromYouTubeCode } from '../../core/player-port.js';
import { playerVars } from '../../core/youtube-embed.js';

const API_SRC = 'https://www.youtube.com/iframe_api';
const STANDARD_HOST = 'https://www.youtube.com';
const PRIVACY_HOST = 'https://www.youtube-nocookie.com';

/** How long to wait for a duration before giving up. */
const LOAD_TIMEOUT_MS = 15000;
const POLL_MS = 120;

let apiPromise = null;

/** Loads YouTube's script once per page. */
function loadApi() {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = API_SRC;
    script.onerror = () =>
      reject(new PlayerError('unavailable', 'Could not reach YouTube.'));
    document.head.appendChild(script);
  });
  return apiPromise;
}

export class IframePlayer {
  #mountId;
  #player = null;
  #host = STANDARD_HOST;
  #previewTimer = null;
  #pollTimer = null;
  #deadlineTimer = null;
  /** Set while a load is running, so an error can fail that load. */
  #rejectLoad = null;
  #failureHandler = null;

  constructor(mountId) {
    this.#mountId = mountId;
  }

  /** For errors that arrive outside a load, e.g. mid-playback. */
  onFailure(handler) {
    this.#failureHandler = handler;
  }

  /**
   * Loads a video and resolves once its duration is known.
   * @returns {Promise<{duration: number}>}
   */
  async load(videoId, options = {}) {
    const { startAt = 0 } = options;
    const YT = await loadApi();
    const host = options.privacy ? PRIVACY_HOST : STANDARD_HOST;

    this.stop();
    // Privacy mode is a different origin, so it needs a different player.
    if (this.#player && host !== this.#host) this.destroy();

    // An error can arrive before onReady, so it races the whole load.
    const failed = new Promise((_, reject) => {
      this.#rejectLoad = reject;
    });

    try {
      const duration = await Promise.race([
        failed,
        this.#open(YT, videoId, startAt, options, host),
      ]);
      return { duration };
    } finally {
      this.#rejectLoad = null;
      this.#stopPolling();
    }
  }

  async #open(YT, videoId, startAt, options, host) {
    if (this.#player) {
      this.#player.loadVideoById({ videoId, startSeconds: startAt });
    } else {
      this.#host = host;
      await new Promise((resolve) => {
        this.#player = new YT.Player(this.#mountId, {
          videoId,
          host,
          playerVars: playerVars({ start: startAt }, options),
          events: {
            onReady: () => resolve(),
            onError: (event) => this.#handleError(event),
          },
        });
      });
    }
    return this.#measureDuration(videoId);
  }

  // Waits for a duration belonging to the video we asked for. Checking the id
  // is what stops a second video keeping the first one's duration, since
  // loadVideoById never fires onReady again.
  #measureDuration(videoId) {
    return new Promise((resolve, reject) => {
      this.#pollTimer = setInterval(() => {
        const duration = this.#player?.getDuration?.() ?? 0;
        const loaded = this.#player?.getVideoData?.()?.video_id;
        // Some embeds never report a video_id, so a duration alone will do.
        if (duration > 0 && (!loaded || loaded === videoId)) {
          this.#stopPolling();
          resolve(Math.floor(duration));
        }
      }, POLL_MS);

      this.#deadlineTimer = setTimeout(() => {
        this.#stopPolling();
        reject(new PlayerError('timed-out', 'The player never reported a duration.'));
      }, LOAD_TIMEOUT_MS);
    });
  }

  #stopPolling() {
    clearInterval(this.#pollTimer);
    clearTimeout(this.#deadlineTimer);
    this.#pollTimer = null;
    this.#deadlineTimer = null;
  }

  #handleError(event) {
    const error = new PlayerError(
      failureFromYouTubeCode(event?.data),
      `YouTube error ${event?.data}`,
    );
    if (this.#rejectLoad) {
      this.#rejectLoad(error);
      return;
    }
    this.#failureHandler?.(error);
  }

  currentTime() {
    return Math.round(this.#player?.getCurrentTime?.() ?? 0);
  }

  seek(seconds) {
    this.#player?.seekTo?.(seconds, true);
  }

  /** Plays start to end, then calls onEnd. */
  playRange(start, end, onEnd) {
    if (!this.#player?.seekTo) return;
    this.stop();
    this.#player.seekTo(start, true);
    this.#player.playVideo();
    this.#previewTimer = setInterval(() => {
      if (this.currentTime() < end) return;
      this.#player.pauseVideo();
      this.#player.seekTo(start, true);
      this.stop();
      onEnd();
    }, POLL_MS);
  }

  get isPreviewing() {
    return this.#previewTimer !== null;
  }

  stop() {
    if (!this.#previewTimer) return;
    clearInterval(this.#previewTimer);
    this.#previewTimer = null;
  }

  pause() {
    this.#player?.pauseVideo?.();
  }

  destroy() {
    this.stop();
    this.#stopPolling();
    this.#player?.destroy?.();
    this.#player = null;
  }
}
