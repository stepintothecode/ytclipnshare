# Words used in this repo

**Video reference** - anything that points at a video: a link, an Android share
message, or a bare 11-character ID. Reading one gives a video ID and a start
time, or nothing.

**Video ID** - YouTube's 11-character id, like `dQw4w9WgXcQ`.

**Clip range** - the chosen start and end, plus the length of the video they
sit in. Always valid, never shorter than a second. A range with no duration yet
is *unknown*.

**Clip link** - the link people share. Starts and stops where the range says.

**Fallback link** - a plain `youtu.be` link at the start time, for videos that
block embedding. No end time. Hidden behind a toggle in the UI.

**Clip options** - the four switches: hide related videos, loop, autoplay
(muted), privacy mode.

## Two things worth knowing

The apps control playback, they do not cut video. Nothing is downloaded or
re-hosted, so avoid words like trim, cut or export.

`core/` runs anywhere: a page, a popup, or `node --test`. It has no DOM, no
`chrome.*` and no network calls. Anything that talks to a player goes in an
adapter instead, described in `core/player-port.js`.
