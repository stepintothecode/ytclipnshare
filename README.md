# YTClipNShare

Pick a start and end time on a YouTube video, get a link that plays only that
part.

**https://stepintothecode.github.io/ytclipnshare/**

Two apps sharing the same code in `core/`:

- `web/` - web app, made for phones
- `extension/` - browser extension, made for desktop

## Web app

1. Open https://stepintothecode.github.io/ytclipnshare/
2. Paste a YouTube link and press **Load**.
3. Drag the two handles, or press **Use current time** under either box.
4. Press **Copy link**.

To install it: on Android open the Chrome menu and pick *Install And Create Shortcut*,
on iPhone use Safari's *Share* then *Add to Home Screen*. Android can then
share a video to YTClipNShare straight from the YouTube app.

## Browser extension

1. Go to `chrome://extensions` and turn on **Developer mode**.
2. Press **Load unpacked** and pick the `extension/` folder.
3. Open a YouTube video and click the YTClipNShare icon.

It reads the video and the playhead from the tab, so there is nothing to paste.

## Developing

No build step and no dependencies. You only need Node.

```sh
npm test        # run the tests
npx serve .     # then open http://localhost:3000/web/
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the layout and conventions.

GitHub Pages serves the repo root. The app lives in `web/`, and the root
redirects there.

## Limits

- It is playback control, not a trim. The video starts and stops where you
  said, but the viewer still has a full scrub bar.
- Shorts play in the normal landscape player, not the vertical feed.
- Some creators block embedding. Both apps warn you and offer a fallback link
  that opens the video at your start time.
- Nothing is downloaded. If the original video goes, so does your link.
