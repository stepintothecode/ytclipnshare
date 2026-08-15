# Do not edit anything in this folder

These files are **copies**. The real code is in `core/` at the root of the
repo.

Any change you make here is lost the next time the copy runs, and the real
file in `core/` will not have it.

## Why the copy exists

A Chrome extension can only load files that sit inside its own folder. The web
app simply imports `../core/`, but the extension cannot reach outside
`extension/`, so it needs its own copy.

The copies are committed, so `extension/` always works as-is when someone loads
it unpacked.

## Changing a core file

Edit the file in `core/`, then run:

```sh
npm run sync
```

## How you find out it is out of date

`test/repo-tests/core-copy-tests.js` compares every file here against `core/`,
so `npm test` catches a forgotten sync. To check on its own:

```sh
npm run sync:check
```

```
extension/core is up to date          # good
extension/core is out of date: ...    # run npm run sync
```
