// Drives the <video> element on a YouTube tab.
//
// Injected functions run inside the page, so they cannot use anything from
// core/ and have to stand alone.

const YOUTUBE_TAB = /^https?:\/\/(?:[\w-]+\.)?youtube\.com\//;

export class TabPlayer {
  #tabId;

  constructor(tabId) {
    this.#tabId = tabId;
  }

  /** Null when the active tab is not a YouTube page. */
  static async forActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !YOUTUBE_TAB.test(tab.url ?? '')) return null;
    return new TabPlayer(tab.id);
  }

  async #run(func, args = []) {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: this.#tabId },
      func,
      args,
    });
    return result?.result;
  }

  /** @returns {Promise<{videoId: string|null, duration: number, currentTime: number, title: string}>} */
  read() {
    return this.#run(() => {
      const video = document.querySelector('video');
      const params = new URLSearchParams(location.search);
      const fromPath = location.pathname.match(
        /\/(?:shorts|embed|live|v)\/([A-Za-z0-9_-]{11})/,
      );
      return {
        videoId: params.get('v') ?? fromPath?.[1] ?? null,
        // duration is NaN until the video's metadata arrives.
        duration:
          video && Number.isFinite(video.duration) ? Math.floor(video.duration) : 0,
        currentTime: video ? Math.round(video.currentTime) : 0,
        title: document.title.replace(/\s*-\s*YouTube$/, ''),
      };
    });
  }

  async currentTime() {
    return (await this.read()).currentTime;
  }

  seek(seconds) {
    return this.#run((to) => {
      const video = document.querySelector('video');
      if (video) video.currentTime = to;
    }, [seconds]);
  }

  // Stops itself in the page, because the popup is usually closed before the
  // clip finishes.
  playRange(start, end) {
    return this.#run(
      (from, to) => {
        const video = document.querySelector('video');
        if (!video) return;
        window.__ytclipnshareStopPreview?.();

        const finish = () => {
          video.removeEventListener('timeupdate', onTick);
          delete window.__ytclipnshareStopPreview;
        };
        const onTick = () => {
          if (video.currentTime < to) return;
          video.pause();
          video.currentTime = from;
          finish();
        };

        window.__ytclipnshareStopPreview = finish;
        video.currentTime = from;
        video.addEventListener('timeupdate', onTick);
        video.play();
      },
      [start, end],
    );
  }

  stop() {
    return this.#run(() => {
      window.__ytclipnshareStopPreview?.();
      document.querySelector('video')?.pause();
    });
  }

  /** Sends the tab to another video, for when the popup opens off YouTube. */
  static async openInActiveTab(url) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) await chrome.tabs.update(tab.id, { url });
  }
}
