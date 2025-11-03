#!/usr/bin/env node
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import archiver from 'archiver';

async function main() {
  const cwd = process.cwd();
  const distDir = path.resolve(cwd, 'dist');
  const buildDir = path.resolve(cwd, 'build');

  // Ensure dist exists
  try {
    await fsp.access(distDir);
  } catch {
    console.error('dist/ not found. Run `npm run build` first.');
    process.exit(1);
  }

  // Ensure build dir exists
  await fsp.mkdir(buildDir, { recursive: true });

  // Read version from package.json
  const pkgRaw = await fsp.readFile(path.resolve(cwd, 'package.json'), 'utf8');
  const pkg = JSON.parse(pkgRaw);
  const version = pkg.version || '0.0.0';

  // Format date YYYY-MM-DD
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const date = `${yyyy}-${mm}-${dd}`;

  const filename = `reflexa-ai-chrome-extension-v${version}-${date}.zip`;
  const outputPath = path.resolve(buildDir, filename);

  // Create archive
  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    console.log(`Created: ${outputPath} (${archive.pointer()} total bytes)`);
  });

  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      console.warn(err);
    } else {
      throw err;
    }
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);
  // Include everything under dist/ at top-level of the zip
  archive.directory(distDir, false);
  await archive.finalize();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


