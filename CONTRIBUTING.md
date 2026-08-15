# Working on YTClipNShare

## What to install

Just [Node](https://nodejs.org) 20 or newer, for the tests and the two small
scripts in `tools/`. That is it.

There are no dependencies, so there is nothing to `npm install`. There is no
build step either - the browser runs the files exactly as they are in the repo.

## Running it

```sh
npx serve .     # then open http://localhost:3000/web/
```

A plain `file://` open will not work, because ES modules and the service worker
both need a real server.

For the extension: `chrome://extensions`, turn on Developer mode, **Load
unpacked**, pick the `extension/` folder. Press the reload icon on the card
after each change.

## Running the tests

```sh
npm test          # everything
npm run sync      # copy core/ into extension/core/ after changing core/
npm run icons     # rebuild the PNG icons after changing the SVG
```

## How the code is arranged

```
core/           shared logic. no DOM, no chrome.*, no network
web/            the web app
extension/      the browser extension
test/           tests, mirroring the folders above
tools/          the two scripts
```

- **`core/` is the only place rules live.** If it can be decided without a
  browser, it belongs there. `web/src/` and `extension/src/` only move values
  between `core/` and the page.
- **Anything external sits behind an adapter.** Both apps drive a YouTube
  player, but not the same one, so neither talks to a player directly. See
  `core/player-port.js`.
- **The two apps are peers.** Neither imports the other. Either could be
  deleted without touching the other.
- **`extension/core/` is generated.** Never edit it. See
  `extension/core/DO_NOT_EDIT.md`.

## Conventions

**Naming.** The product is `YTClipNShare` everywhere: UI, manifests, titles,
comments. Files and folders are lower-case with dashes.

**Values are immutable.** Things like `ClipRange` return a new value instead of
changing themselves, so there is one place where the rules are applied.

**Never guess.** When input cannot be read, return `null` and let the caller
say so. `parseVideoReference` returning a made-up ID is what produced a
confusing "video doesn't exist" error before.

**Tests mirror the source tree**, with `-tests` added to folder and file names:

```
core/clip-range.js        ->  test/core-tests/clip-range-tests.js
web/src/iframe-player.js  ->  test/web-tests/src-tests/iframe-player-tests.js
```

Tests that are about the repo rather than one file go in `test/repo-tests/`.
Fakes and helpers go in `test/support/` and are not named `-tests`. More in
`test/README.md`.

**Comments explain why, in one or two lines.** If a comment only repeats what
the code says, delete it. Use an example where one is shorter than a sentence.

**No em dashes.** Use a plain `-`, or rewrite the sentence.

**Generated files need two things**: a note saying not to edit them, and a test
that fails when they go out of date.

## Before you push

```sh
npm test
```

That covers the logic and also checks `extension/core/` is up to date.
