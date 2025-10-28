#!/usr/bin/env node

/**
 * Package Extension Script
 *
 * Creates a distributable ZIP file of the Chrome extension from the build output.
 * The ZIP file is ready for upload to the Chrome Web Store.
 */

import { createWriteStream, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import archiver from 'archiver';

const DIST_DIR = 'dist';
const OUTPUT_DIR = 'build';
const EXTENSION_NAME = 'reflexa-ai-chrome-extension';

// Get version from package.json
const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
const version = packageJson.version;

// Create output directory if it doesn't exist
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Check if dist directory exists
if (!existsSync(DIST_DIR)) {
  console.error(
    `❌ Error: ${DIST_DIR} directory not found. Run 'npm run build' first.`
  );
  process.exit(1);
}

// Create timestamp for filename
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const zipFilename = `${EXTENSION_NAME}-v${version}-${timestamp}.zip`;
const zipPath = join(OUTPUT_DIR, zipFilename);

console.log(`📦 Packaging extension...`);
console.log(`   Source: ${DIST_DIR}/`);
console.log(`   Output: ${zipPath}`);

// Create archive
const output = createWriteStream(zipPath);
const archive = archiver('zip', {
  zlib: { level: 9 }, // Maximum compression
});

// Handle archive events
output.on('close', () => {
  const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`✅ Extension packaged successfully!`);
  console.log(`   File: ${zipFilename}`);
  console.log(`   Size: ${sizeInMB} MB`);
  console.log(`   Total files: ${archive.pointer()} bytes`);
});

archive.on('error', (err) => {
  console.error('❌ Error creating archive:', err);
  process.exit(1);
});

archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.warn('⚠️  Warning:', err);
  } else {
    throw err;
  }
});

// Pipe archive data to the file
archive.pipe(output);

// Add all files from dist directory
archive.directory(DIST_DIR, false);

// Finalize the archive
await archive.finalize();
