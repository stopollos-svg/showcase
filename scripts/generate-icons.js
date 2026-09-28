import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 2; // Color type: 2 (Truecolor RGB)
  ihdrData[10] = 0; // Compression: 0
  ihdrData[11] = 0; // Filter: 0
  ihdrData[12] = 0; // Interlace: 0

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data: height rows, each with 1 byte filter type (0) + width * 3 bytes (RGB)
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowSize);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.42;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      // Distance from center
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Create a nice warm circular badge on warm background
      if (dist < radius * 0.25) {
        // Inner white dot / aperture
        rawData[pixelOffset] = 255;
        rawData[pixelOffset + 1] = 255;
        rawData[pixelOffset + 2] = 255;
      } else if (dist < radius * 0.75 && dist > radius * 0.6) {
        // White camera lens ring
        rawData[pixelOffset] = 255;
        rawData[pixelOffset + 1] = 255;
        rawData[pixelOffset + 2] = 255;
      } else {
        // Orange gradient
        const t = (x + y) / (width + height);
        rawData[pixelOffset] = Math.round(234 * (1 - t * 0.2)); // ~#ea580c
        rawData[pixelOffset + 1] = Math.round(88 * (1 - t * 0.3));
        rawData[pixelOffset + 2] = Math.round(12 + t * 20);
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeInt32BE(crc, 8 + len);
  return chunk;
}

// Precomputed CRC table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return c ^ 0xffffffff;
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate required PWA icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, 234, 88, 12));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, 234, 88, 12));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, 234, 88, 12));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, 234, 88, 12));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(32, 32, 234, 88, 12));

console.log('PWA PNG and favicon assets generated successfully.');
