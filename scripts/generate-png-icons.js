#!/usr/bin/env node

/**
 * Generate PNG icons from the Reflexa AI SVG logo
 *
 * This script converts the reflexa-ai-logo.svg to PNG format in multiple sizes
 * required for Chrome extension icons (16x16, 32x32, 48x48, 128x128)
 *
 * Usage:
 *   node scripts/generate-png-icons.js
 *
 * Requirements:
 *   - Install sharp: npm install --save-dev sharp
 *   or
 *   - Use the HTML converter: open public/icons/convert-logo-to-png.html in browser
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('\n❌ Error: sharp package not found');
  console.error('\nPlease install sharp by running:');
  console.error('  npm install --save-dev sharp');
  console.error('\nOr use the browser-based converter:');
  console.error('  open public/icons/convert-logo-to-png.html\n');
  process.exit(1);
}

const sizes = [16, 32, 48, 128];
const inputSvg = path.join(__dirname, '../public/icons/reflexa-ai-logo.svg');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  console.log('🎨 Generating PNG icons from Reflexa AI logo...\n');

  // Check if input file exists
  if (!fs.existsSync(inputSvg)) {
    console.error(`❌ Error: ${inputSvg} not found`);
    process.exit(1);
  }

  // Read SVG file
  const svgBuffer = fs.readFileSync(inputSvg);

  // Generate each size
  for (const size of sizes) {
    const outputFile = path.join(outputDir, `icon-${size}.png`);

    try {
      await sharp(svgBuffer).resize(size, size).png().toFile(outputFile);

      console.log(`✓ Generated ${size}x${size} → icon-${size}.png`);
    } catch (error) {
      console.error(`❌ Error generating ${size}x${size}:`, error.message);
    }
  }

  console.log('\n✅ All PNG icons generated successfully!');
  console.log('\nNext steps:');
  console.log(
    '1. Update public/manifest.json to use .png files instead of .svg'
  );
  console.log('2. Reload the extension in Chrome\n');
}

generateIcons().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
