# Tests

Run them with `npm test`.

The folders mirror the source tree, with `-tests` added to every name. To find
the tests for a file, take its path and add the suffixes:

```
core/clip-range.js        ->  test/core-tests/clip-range-tests.js
web/src/iframe-player.js  ->  test/web-tests/src-tests/iframe-player-tests.js
```

Two folders do not follow that rule:

- `repo-tests/` - checks about the repo itself, with no single source file
  behind them.
- `support/` - fakes and helpers. Not tests, so they are not named `-tests`.
