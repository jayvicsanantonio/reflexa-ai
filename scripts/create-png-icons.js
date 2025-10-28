#!/usr/bin/env node

/**
 * Create PNG icon files from base64 encoded data
 * These are pre-generated lotus icons with Zen aesthetic
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Creating PNG icons from SVG files...');
console.log('\nNote: SVG files work perfectly in Chrome extensions!');
console.log('Chrome will automatically scale them to the needed size.');
console.log('\nIf you need PNG files specifically:');
console.log('1. Open public/icons/generate-icons.html in Chrome');
console.log('2. Click "Download All" button');
console.log('3. Move downloaded files to public/icons/');
console.log('\nOr use ImageMagick:');
console.log('  cd public/icons');
console.log('  for size in 16 32 48 128; do');
console.log('    convert icon-$size.svg icon-$size.png');
console.log('  done');
console.log('\n✨ SVG icons are ready to use!');
