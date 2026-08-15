// Draws the icon to PNG, because Chrome extensions and iOS both reject SVG
// icons. Uses only node's zlib, so there is no image library to install.
//
//   node tools/make-icons.mjs
//
// The PNGs are committed, so run this only when the icon changes.

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const RED = [255, 61, 61];
const WHITE = [255, 255, 255];

/** Samples per pixel edge. 4 means 16 samples a pixel, for smooth edges. */
const SS = 4;

// The shapes, in the same 512x512 space as the SVG files.

const TRANSPARENT_MARK = {
  background: null,
  body: { rect: [64, 150, 384, 212, 52], fill: RED },
  slots: [
    [118, 62, 46, 388, 23],
    [348, 62, 46, 388, 23],
  ],
  bars: [
    [128, 72, 26, 368, 13],
    [358, 72, 26, 368, 13],
  ],
  barFill: RED,
  triangle: { points: [222, 205, 308, 256, 222, 307], fill: WHITE },
};

/** Solid version, for the places that fill transparency in themselves. */
const SOLID_MARK = {
  background: RED,
  body: { rect: [122, 186, 268, 148, 36], fill: WHITE },
  slots: [
    [158, 132, 36, 248, 18],
    [318, 132, 36, 248, 18],
  ],
  bars: [
    [166, 140, 20, 232, 10],
    [326, 140, 20, 232, 10],
  ],
  barFill: WHITE,
  triangle: { points: [233, 224, 295, 260, 233, 296], fill: RED },
};

function inRoundRect(px, py, [x, y, w, h, r]) {
  if (px < x || px > x + w || py < y || py > y + h) return false;
  const nearestX = Math.min(Math.max(px, x + r), x + w - r);
  const nearestY = Math.min(Math.max(py, y + r), y + h - r);
  const dx = px - nearestX;
  const dy = py - nearestY;
  return dx * dx + dy * dy <= r * r;
}

function inTriangle(px, py, [ax, ay, bx, by, cx, cy]) {
  const sign = (x1, y1, x2, y2, x3, y3) =>
    (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
  const d1 = sign(px, py, ax, ay, bx, by);
  const d2 = sign(px, py, bx, by, cx, cy);
  const d3 = sign(px, py, cx, cy, ax, ay);
  const hasNegative = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPositive = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNegative && hasPositive);
}

/** @returns {[number,number,number]|null} colour at a point, or null for transparent. */
function sample(px, py, mark) {
  if (inTriangle(px, py, mark.triangle.points)) return mark.triangle.fill;

  const onBar = mark.bars.some((bar) => inRoundRect(px, py, bar));
  if (onBar) return mark.barFill;

  const inSlot = mark.slots.some((slot) => inRoundRect(px, py, slot));
  if (!inSlot && inRoundRect(px, py, mark.body.rect)) return mark.body.fill;

  return mark.background;
}

/** @returns {Buffer} RGBA pixels, smoothed by averaging the samples. */
function rasterise(size, mark) {
  const pixels = Buffer.alloc(size * size * 4);
  const scale = 512 / size;
  const step = 1 / SS;
  const samples = SS * SS;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          const px = (x + (sx + 0.5) * step) * scale;
          const py = (y + (sy + 0.5) * step) * scale;
          const colour = sample(px, py, mark);
          if (!colour) continue;
          // Only count samples that hit a shape, so edges stay clean.
          r += colour[0];
          g += colour[1];
          b += colour[2];
          a += 1;
        }
      }

      const offset = (y * size + x) * 4;
      if (a > 0) {
        pixels[offset] = Math.round(r / a);
        pixels[offset + 1] = Math.round(g / a);
        pixels[offset + 2] = Math.round(b / a);
        pixels[offset + 3] = Math.round((a / samples) * 255);
      }
    }
  }

  return pixels;
}

// A small PNG encoder. Nothing here is specific to this icon.

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // truecolour with alpha
  header[10] = 0; // deflate
  header[11] = 0; // adaptive filtering
  header[12] = 0; // no interlace

  // Filter type 0 in front of every scanline.
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    const from = y * size * 4;
    raw[y * (size * 4 + 1)] = 0;
    pixels.copy(raw, y * (size * 4 + 1) + 1, from, from + size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const TARGETS = [
  // Transparent, for tabs, launchers and the extension toolbar.
  ['web/icons/icon-192.png', 192, TRANSPARENT_MARK],
  ['web/icons/icon-512.png', 512, TRANSPARENT_MARK],
  ['extension/icons/icon-16.png', 16, TRANSPARENT_MARK],
  ['extension/icons/icon-32.png', 32, TRANSPARENT_MARK],
  ['extension/icons/icon-48.png', 48, TRANSPARENT_MARK],
  ['extension/icons/icon-128.png', 128, TRANSPARENT_MARK],
  // Solid, because the OS fills in transparent pixels for these two.
  ['web/icons/icon-maskable.png', 512, SOLID_MARK],
  ['web/icons/icon-180.png', 180, SOLID_MARK],
];

for (const [relativePath, size, mark] of TARGETS) {
  const target = join(ROOT, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, encodePng(size, rasterise(size, mark)));
  console.log(`${relativePath}  ${size}x${size}`);
}
