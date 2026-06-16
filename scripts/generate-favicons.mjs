import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const svg = readFileSync(join(publicDir, 'favicon.svg'));

const sizes = [
  { name: 'favicon-16.png', size: 16 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon-48.png', size: 48 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
];

for (const { name, size } of sizes) {
  await sharp(svg).resize(size, size).png().toFile(join(publicDir, name));
}

const png16 = readFileSync(join(publicDir, 'favicon-16.png'));
const png32 = readFileSync(join(publicDir, 'favicon-32.png'));
const png48 = readFileSync(join(publicDir, 'favicon-48.png'));
const ico = await pngToIco([png16, png32, png48]);
writeFileSync(join(publicDir, 'favicon.ico'), ico);

console.log('Generated favicon assets in public/');
