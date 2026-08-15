# Clipper

Pick a start and end time on any YouTube video or Short, get a link that plays only that part. Works on desktop and phone.

Built because YouTube retired the viewer-facing **Clip** feature in April 2026 — the share panel now only offers a start timestamp.

---

## Deploy to GitHub Pages

**1. Make the repo**

Go to [github.com/new](https://github.com/new), name it `clipper`, set it **Public**, create.

**2. Upload the files**

On the empty repo page click **uploading an existing file**, then drag in all five:

```
index.html
manifest.json
sw.js
icon.svg
icon-maskable.svg
```

Click **Commit changes**.

**3. Turn on Pages**

**Settings** → **Pages** (left sidebar) → under *Source* pick **Deploy from a branch** → Branch: **main**, folder: **/ (root)** → **Save**.

**4. Wait ~1 minute**, then open:

```
https://YOUR-USERNAME.github.io/clipper/
```

That's your permanent URL. Bookmark it.

> HTTPS matters — the service worker and clipboard API only run on a secure origin. GitHub Pages gives you that for free. Opening `index.html` straight off your hard drive will mostly work but the YouTube player and install prompt may not.

---

## Install it on your phone

**Android (Chrome):** open your Pages URL → menu **⋮** → *Add to Home screen* / *Install app*.

**iPhone (Safari):** open the URL → **Share** → *Add to Home Screen*.

It then opens full-screen like a normal app. On Android it also registers as a share target, so you can hit **Share** inside the YouTube app and send the video straight to Clipper.

---

## Using it

1. Paste a YouTube link (or just the 11-character video ID) and hit **Load**.
2. Drag the two handles to set start and end — or scrub the video and tap **⤓ Use current time** under either box. You can also type times directly (`1:23`, `1:02:03`, or plain seconds).
3. **▶︎ Preview clip** plays exactly the range and stops.
4. **Copy link** or **Share…**.

### Options

| Option | What it does |
|---|---|
| Hide related videos | Adds `rel=0` — no grid of other videos at the end |
| Loop the clip | Replays the segment instead of stopping |
| Autoplay (muted) | Starts on open. Must be muted; browsers block unmuted autoplay |
| Privacy mode | Uses `youtube-nocookie.com` |

### Link formats it accepts

`youtube.com/watch?v=…` · `youtu.be/…` · `youtube.com/shorts/…` · `youtube.com/embed/…` · `youtube.com/live/…` · `m.youtube.com/…` · `music.youtube.com/…` · bare video ID · or any block of text with a YouTube link in it. An existing `?t=` timestamp is picked up as the start time.

---

## Honest limitations

**It's playback control, not a trim.** The generated link uses YouTube's `start` and `end` player parameters. The video begins and stops where you said, but the viewer still has a full scrub bar and can drag outside the range. This is great for "watch this bit" — it is not a way to hide the rest of the video.

**Shorts play landscape.** A Short's clip link opens in the standard 16:9 embed player, not the vertical Shorts feed. The correct segment plays; it just doesn't look like Shorts. There is no way around this — YouTube exposes no Shorts-style embed.

**Some videos block embedding.** Certain creators and most music-label uploads disable embedding. The app detects this and warns you. Send the **fallback link** instead (`youtu.be/ID?t=43`), which opens the video normally at your start time — no end time, but it works everywhere.

**Nothing is downloaded.** No video files are copied or re-hosted. If the original video goes away, so does the clip link.

---

## Files

| File | Purpose |
|---|---|
| `index.html` | The entire app — UI, player, link builder. No dependencies except YouTube's IFrame API |
| `manifest.json` | PWA metadata: name, icons, Android share target |
| `sw.js` | Service worker; caches the app shell so it opens instantly |
| `icon.svg` / `icon-maskable.svg` | App icons |

No build step, no npm, no framework.

---

## Tinkering

The link-building logic is one function near the top of the `<script>` block in `index.html`:

```js
function buildLinks(id, start, end, opt)
```

Everything else — sliders, time inputs, preview — just feeds it numbers. Change the output format there and the whole app follows.

You can also deep-link into the app to prefill a video: `…/clipper/?v=VIDEO_ID_OR_URL`
