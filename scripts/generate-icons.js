#!/usr/bin/env node

/**
 * Generate Reflexa AI lotus icons in multiple sizes
 * This script creates PNG icons using SVG as an intermediate format
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [16, 32, 48, 128];
const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function generateLotusSVG(size) {
  const scale = size / 128;
  const cornerRadius = 24 * scale;

  // Calculate petal dimensions
  const outerRadius = 35 * scale;
  const petalWidth = 18 * scale;
  const petalHeight = 28 * scale;
  const innerRadius = 20 * scale;
  const innerPetalWidth = 12 * scale;
  const innerPetalHeight = 18 * scale;
  const centerRadius = 8 * scale;
  const highlightRadius = 3 * scale;

  const cx = size / 2;
  const cy = size / 2;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <defs>
    <!-- Background gradient -->
    <linearGradient id="bgGradient-${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
    </linearGradient>

    <!-- Outer petal gradient -->
    <linearGradient id="outerPetal-${size}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.95" />
      <stop offset="70%" style="stop-color:#ffffff;stop-opacity:0.85" />
      <stop offset="100%" style="stop-color:#e0f2fe;stop-opacity:0.7" />
    </linearGradient>

    <!-- Inner petal gradient -->
    <linearGradient id="innerPetal-${size}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="60%" style="stop-color:#ffffff;stop-opacity:0.95" />
      <stop offset="100%" style="stop-color:#f0f9ff;stop-opacity:0.8" />
    </linearGradient>

    <!-- Center gradient -->
    <radialGradient id="centerGradient-${size}">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="70%" style="stop-color:#fef9c3;stop-opacity:0.95" />
      <stop offset="100%" style="stop-color:#fde047;stop-opacity:0.8" />
    </radialGradient>
  </defs>

  <!-- Rounded background -->
  <rect width="${size}" height="${size}" rx="${cornerRadius}" fill="url(#bgGradient-${size})" />

  <!-- Lotus petals -->
  <g transform="translate(${cx}, ${cy})">
`;

  // Outer petals (8 petals)
  for (let i = 0; i < 8; i++) {
    const angle = (i * 360) / 8 - 90;
    const petalY = outerRadius * 0.7;

    svg += `    <ellipse cx="0" cy="${petalY}" rx="${petalWidth}" ry="${petalHeight}"
      fill="url(#outerPetal-${size})"
      stroke="rgba(255,255,255,0.3)"
      stroke-width="${0.5 * scale}"
      transform="rotate(${angle})" />\n`;
  }

  // Inner petals (5 petals)
  for (let i = 0; i < 5; i++) {
    const angle = (i * 360) / 5 - 90 + 18;
    const petalY = innerRadius * 0.7;

    svg += `    <ellipse cx="0" cy="${petalY}" rx="${innerPetalWidth}" ry="${innerPetalHeight}"
      fill="url(#innerPetal-${size})"
      stroke="rgba(255,255,255,0.4)"
      stroke-width="${0.5 * scale}"
      transform="rotate(${angle})" />\n`;
  }

  // Center circle
  svg += `    <circle cx="0" cy="0" r="${centerRadius}" fill="url(#centerGradient-${size})" />

    <!-- Center highlight -->
    <circle cx="${-2 * scale}" cy="${-2 * scale}" r="${highlightRadius}" fill="rgba(255,255,255,0.6)" />
  </g>
</svg>`;

  return svg;
}

// Generate SVG files for each size
sizes.forEach((size) => {
  const svg = generateLotusSVG(size);
  const filename = `icon-${size}.svg`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, svg);
  console.log(`✓ Generated ${filename}`);
});

console.log('\n✨ All icon SVG files generated successfully!');
console.log('\nTo convert to PNG, you can:');
console.log(
  '1. Open public/icons/generate-icons.html in a browser and download'
);
console.log('2. Use an online SVG to PNG converter');
console.log('3. Use ImageMagick: convert icon-128.svg icon-128.png');
console.log('\nSVG files work in Chrome extensions and will scale perfectly!');
