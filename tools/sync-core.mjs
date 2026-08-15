// Copies core/ into extension/core/. See extension/core/DO_NOT_EDIT.md for why.
//
//   node tools/sync-core.mjs          write the copy
//   node tools/sync-core.mjs --check  fail if it is out of date

import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'core');
const TARGET = join(ROOT, 'extension', 'core');

const BANNER = `/* Generated copy - do not edit. See extension/core/DO_NOT_EDIT.md
   Source: core/%s - regenerate with: npm run sync */\n\n`;

export function coreFiles() {
  return readdirSync(SOURCE).filter((name) => name.endsWith('.js')).sort();
}

export function expectedContents(name) {
  return BANNER.replace('%s', name) + readFileSync(join(SOURCE, name), 'utf8');
}

/** Files in extension/core/ that are missing or out of date. */
export function staleFiles() {
  return coreFiles().filter((name) => {
    let actual;
    try {
      actual = readFileSync(join(TARGET, name), 'utf8');
    } catch {
      return true;
    }
    return actual !== expectedContents(name);
  });
}

function sync() {
  mkdirSync(TARGET, { recursive: true });
  for (const name of coreFiles()) {
    writeFileSync(join(TARGET, name), expectedContents(name));
    console.log(`extension/core/${name}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--check')) {
    const stale = staleFiles();
    if (stale.length > 0) {
      console.error(
        `extension/core is out of date: ${stale.join(', ')}\nRun: node tools/sync-core.mjs`,
      );
      process.exit(1);
    }
    console.log('extension/core is up to date');
  } else {
    sync();
  }
}
