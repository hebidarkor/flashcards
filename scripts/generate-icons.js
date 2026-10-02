/**
 * generate-icons.js
 * Creates icon-192.png and icon-512.png for the PWA manifest.
 * Uses only Node built-ins — no canvas dependency needed.
 * Generates a simple Greek flag blue square with "GR" text as SVG,
 * then writes minimal valid PNG files using raw PNG encoding.
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PUBLIC = path.join(__dirname, '..', 'public');

// We'll use the system's built-in svg→png conversion if available,
// otherwise write a placeholder PNG programmatically.

// Simple SVG icon: blue background, white Greek cross + "GR"
function makeSVG(size) {
  const pad = Math.round(size * 0.15);
  const fs2 = Math.round(size * 0.28);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size*0.18)}" fill="#3b82d4"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
    font-family="serif" font-size="${fs2}" font-weight="bold" fill="white">🇬🇷</text>
</svg>`;
}

// Write SVG files
fs.writeFileSync(path.join(PUBLIC, 'icon-192.svg'), makeSVG(192));
fs.writeFileSync(path.join(PUBLIC, 'icon-512.svg'), makeSVG(512));

// Try converting with Inkscape, rsvg-convert, or ImageMagick if available
const converters = [
  (svg, png, size) => `inkscape --export-png="${png}" --export-width=${size} "${svg}"`,
  (svg, png, size) => `rsvg-convert -w ${size} -h ${size} "${svg}" -o "${png}"`,
  (svg, png, size) => `magick "${svg}" -resize ${size}x${size} "${png}"`,
  (svg, png, size) => `convert "${svg}" -resize ${size}x${size} "${png}"`,
];

let converted = false;
for (const mkCmd of converters) {
  try {
    execSync(mkCmd(path.join(PUBLIC,'icon-192.svg'), path.join(PUBLIC,'icon-192.png'), 192), {stdio:'pipe'});
    execSync(mkCmd(path.join(PUBLIC,'icon-512.svg'), path.join(PUBLIC,'icon-512.png'), 512), {stdio:'pipe'});
    converted = true;
    console.log('Icons generated via converter.');
    break;
  } catch {}
}

if (!converted) {
  // Fallback: write a minimal valid 1x1 PNG and note that real icons need manual creation
  // A proper minimal PNG (blue 1x1 pixel) — base64 encoded
  const png1x1Blue = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64'
  );
  fs.writeFileSync(path.join(PUBLIC, 'icon-192.png'), png1x1Blue);
  fs.writeFileSync(path.join(PUBLIC, 'icon-512.png'), png1x1Blue);
  console.log('Note: placeholder icons written. For proper icons, replace public/icon-192.png and public/icon-512.png with real 192x192 and 512x512 PNG files.');
}

// Clean up SVGs
try { fs.unlinkSync(path.join(PUBLIC,'icon-192.svg')); } catch {}
try { fs.unlinkSync(path.join(PUBLIC,'icon-512.svg')); } catch {}
