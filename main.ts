// News image entry for Saturday 21 November 2026. The picture beside this file is the
// entry; the program delivers its bytes, unchanged, to the output folder, because the
// judge sees exactly the file that lands there.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const target = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const bytes = readFileSync(new URL('./entry.png', import.meta.url));

// Refuse a file the gate would score 0: the image must be a whole PNG or JPEG (told by
// its first bytes), at most 1 MiB and at most 1024 pixels on either side.
const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
if (!png && !jpeg) throw new Error('entry.png is not a PNG or JPEG image');
if (bytes.length > 1024 * 1024) throw new Error('entry.png is larger than 1 MiB');

// The pixel cap, from the header: a PNG stores its size in the IHDR chunk that follows
// the signature; a JPEG stores it in a start-of-frame segment, found by walking the
// segment lengths from the SOI marker.
function dimensions(): [number, number] {
  if (png) return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
  let at = 2;
  while (at + 4 < bytes.length && bytes[at] === 0xff) {
    const marker = bytes[at + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return [bytes.readUInt16BE(at + 7), bytes.readUInt16BE(at + 5)];
    }
    at += 2 + bytes.readUInt16BE(at + 2);
  }
  return [0, 0];
}
const [width, height] = dimensions();
if (width > 1024 || height > 1024) throw new Error(`entry.png is ${width}x${height}, over the 1024 pixel cap`);

mkdirSync(target, { recursive: true });
writeFileSync(join(target, 'entry.png'), bytes);
