import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, r, g, b, a = 255) {
  // Minimal PNG generator using zlib
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    // CRC
    let c = 0xffffffff;
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let t = n;
      for (let k = 0; k < 8; k++) {
        t = t & 1 ? 0xedb88320 ^ (t >>> 1) : t >>> 1;
      }
      table[n] = t;
    }
    for (let i = 4; i < 8 + len; i++) {
      c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    buf.writeInt32BE(c ^ 0xffffffff, 8 + len);
    return buf;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with scanline filter byte 0
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.45;

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dist = Math.hypot(x - cx, y - cy);

      if (dist < radius) {
        // Cyan / Blue gradient inside circle
        const ratio = dist / radius;
        rawData[pxOffset] = Math.floor(6 + (1 - ratio) * 50); // R
        rawData[pxOffset + 1] = Math.floor(182 * (1 - ratio * 0.3)); // G
        rawData[pxOffset + 2] = Math.floor(212 + ratio * 40); // B
        rawData[pxOffset + 3] = a; // Alpha
      } else {
        // Dark Obsidian Background (#0a0b10)
        rawData[pxOffset] = 10;
        rawData[pxOffset + 1] = 11;
        rawData[pxOffset + 2] = 16;
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, 6, 182, 212));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, 6, 182, 212));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, 6, 182, 212));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, 6, 182, 212));

console.log('Successfully generated PWA PNG assets in /public/');
