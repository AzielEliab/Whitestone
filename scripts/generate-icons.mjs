#!/usr/bin/env node
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function png(size, paint) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = paint(x, y, size);
      const i = y * (size * 4 + 1) + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function insideRoundRect(x, y, size, radius) {
  const r = radius;
  if (x >= r && x < size - r && y >= 0 && y < size) return true;
  if (y >= r && y < size - r && x >= 0 && x < size) return true;
  const corners = [
    [r, r],
    [size - 1 - r, r],
    [r, size - 1 - r],
    [size - 1 - r, size - 1 - r],
  ];
  return corners.some(([cx, cy]) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r);
}

function paint(x, y, size) {
  const r = Math.round(size * 0.22);
  if (!insideRoundRect(x, y, size, r)) return [0, 0, 0, 0];
  const ink = [26, 25, 22, 255];
  const stone = [232, 226, 214, 255];
  const p1 = [size * 0.19, size * 0.69];
  const p2 = [size * 0.5, size * 0.22];
  const p3 = [size * 0.81, size * 0.69];
  const area = (x1, y1, x2, y2, x3, y3) => (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2;
  const a = area(...p1, ...p2, ...p3);
  const a1 = area(x, y, ...p2, ...p3);
  const a2 = area(...p1, x, y, ...p3);
  const a3 = area(...p1, ...p2, x, y);
  const inTri = Math.abs(a) > 0 && Math.sign(a) === Math.sign(a1) && Math.sign(a) === Math.sign(a2) && Math.sign(a) === Math.sign(a3);
  const cx = size * 0.5;
  const cy = size * 0.59;
  const cr = size * 0.08;
  if ((x - cx) ** 2 + (y - cy) ** 2 <= cr * cr) return ink;
  if (inTri) return stone;
  return ink;
}

writeFileSync(join(root, "apple-touch-icon.png"), png(180, paint));
writeFileSync(join(root, "icon-192.png"), png(192, paint));
writeFileSync(join(root, "icon-512.png"), png(512, paint));
console.log("wrote apple-touch-icon.png, icon-192.png, icon-512.png");
