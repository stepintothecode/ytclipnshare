// A stand-in for YouTube's player, so the load and preview logic can be
// tested without a browser. Import this before the player it is faking.

export const fake = {
  /** videoId -> duration in seconds. Missing means it never reports one. */
  durations: {},
  /** When set, the player raises this YouTube error code instead of loading. */
  errorCode: null,
  /** Some embeds never report a video_id. Set false to test that. */
  reportsVideoId: true,
  /** The last player made, so a test can move its playhead. */
  lastPlayer: null,
};

export function resetFake() {
  fake.durations = {};
  fake.errorCode = null;
  fake.reportsVideoId = true;
  fake.lastPlayer = null;
}

class FakeYouTubePlayer {
  constructor(mountId, config) {
    this.mountId = mountId;
    this.config = config;
    this.videoId = config.videoId;
    this.currentTime = 0;
    this.playing = false;
    fake.lastPlayer = this;

    queueMicrotask(() => {
      if (fake.errorCode !== null) {
        config.events.onError({ data: fake.errorCode });
      } else {
        config.events.onReady();
      }
    });
  }

  getDuration() {
    return fake.durations[this.videoId] ?? 0;
  }

  getVideoData() {
    return fake.reportsVideoId ? { video_id: this.videoId } : {};
  }

  loadVideoById({ videoId, startSeconds = 0 }) {
    this.videoId = videoId;
    this.currentTime = startSeconds;
  }

  getCurrentTime() {
    return this.currentTime;
  }

  seekTo(seconds) {
    this.currentTime = seconds;
  }

  playVideo() {
    this.playing = true;
  }

  pauseVideo() {
    this.playing = false;
  }

  destroy() {
    this.destroyed = true;
  }
}

globalThis.window = { YT: { Player: FakeYouTubePlayer } };
globalThis.document = {
  createElement: () => ({}),
  head: { appendChild() {} },
};
