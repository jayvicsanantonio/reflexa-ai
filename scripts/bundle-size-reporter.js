#!/usr/bin/env node

/**
 * Bundle Size Reporter
 *
 * This script analyzes the built bundles and reports their sizes,
 * comparing against configured thresholds and previous build sizes.
 *
 * Usage: node scripts/bundle-size-reporter.js [--fail-on-exceed]
 *
 * Requirements: 5.1, 5.2, 5.3
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

/**
 * Formats bytes into a human-readable string
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Formats a size difference with color and sign
 * @param {number} diff - Size difference in bytes
 * @returns {string} Formatted difference string
 */
function formatDiff(diff) {
  if (diff === 0) return `${colors.dim}(no change)${colors.reset}`;
  const sign = diff > 0 ? '+' : '';
  const color = diff > 0 ? colors.red : colors.green;
  return `${color}${sign}${formatBytes(diff)}${colors.reset}`;
}

/**
 * Loads the bundle size configuration
 * @returns {object} Configuration object
 */
function loadConfig() {
  const configPath = path.join(rootDir, 'bundle-size.config.json');
  if (!fs.existsSync(configPath)) {
    console.error(
      `${colors.red}Error: bundle-size.config.json not found${colors.reset}`
    );
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

/**
 * Loads the previous build size history
 * @param {string} historyFile - Path to history file
 * @returns {object|null} Previous sizes or null if not found
 */
function loadHistory(historyFile) {
  const historyPath = path.join(rootDir, historyFile);
  if (fs.existsSync(historyPath)) {
    try {
      return JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Saves the current build sizes to history
 * @param {string} historyFile - Path to history file
 * @param {object} sizes - Current bundle sizes
 */
function saveHistory(historyFile, sizes) {
  const historyPath = path.join(rootDir, historyFile);
  const history = {
    timestamp: new Date().toISOString(),
    sizes,
  };
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

/**
 * Gets the size of files matching a glob pattern
 * @param {string} pattern - Glob pattern
 * @returns {Promise<{files: string[], totalSize: number}>} Matching files and total size
 */
async function getFileSizes(pattern) {
  const fullPattern = path.join(rootDir, pattern);
  const files = [];
  let totalSize = 0;

  try {
    for await (const file of glob(fullPattern)) {
      const stats = fs.statSync(file);
      files.push({
        name: path.relative(rootDir, file),
        size: stats.size,
      });
      totalSize += stats.size;
    }
  } catch {
    // Pattern didn't match any files
  }

  return { files, totalSize };
}

/**
 * Analyzes all bundle sizes based on configuration
 * @param {object} config - Bundle size configuration
 * @returns {Promise<object>} Bundle analysis results
 */
async function analyzeBundles(config) {
  const results = {};
  const distPath = path.join(rootDir, 'dist');

  if (!fs.existsSync(distPath)) {
    console.error(
      `${colors.red}Error: dist folder not found. Run build first.${colors.reset}`
    );
    process.exit(1);
  }

  // Analyze each bundle type
  for (const [bundleType, pattern] of Object.entries(config.patterns || {})) {
    const { files, totalSize } = await getFileSizes(pattern);
    const threshold = config.thresholds[bundleType];

    results[bundleType] = {
      files,
      totalSize,
      threshold,
      exceeds: threshold ? totalSize > threshold : false,
    };
  }

  // Calculate total size of all JS bundles in dist/assets
  const { files: allJsFiles, totalSize: totalJsSize } =
    await getFileSizes('dist/assets/*.js');
  results.total = {
    files: allJsFiles,
    totalSize: totalJsSize,
    threshold: config.thresholds.total,
    exceeds: config.thresholds.total
      ? totalJsSize > config.thresholds.total
      : false,
  };

  return results;
}

/**
 * Prints the bundle size report to console
 * @param {object} results - Bundle analysis results
 * @param {object|null} previousSizes - Previous build sizes for comparison
 * @param {object} config - Bundle size configuration
 * @returns {boolean} Whether any thresholds were exceeded
 */
function printReport(results, previousSizes, config) {
  let hasExceeded = false;
  let hasWarnings = false;

  console.log(
    '\n' +
      colors.bold +
      colors.cyan +
      '📦 Bundle Size Report' +
      colors.reset +
      '\n'
  );
  console.log(colors.dim + '─'.repeat(60) + colors.reset);

  for (const [bundleType, data] of Object.entries(results)) {
    if (bundleType === 'total') continue;

    const { totalSize, threshold, exceeds, files } = data;
    const previousSize = previousSizes?.sizes?.[bundleType]?.totalSize;
    const diff = previousSize !== undefined ? totalSize - previousSize : null;

    // Status indicator
    let status = colors.green + '✓' + colors.reset;
    if (exceeds) {
      status = colors.red + '✗' + colors.reset;
      hasExceeded = true;
    } else if (diff !== null && diff > 0 && config.warnOnIncrease) {
      status = colors.yellow + '⚠' + colors.reset;
      hasWarnings = true;
    }

    // Bundle name and size
    console.log(
      `\n${status} ${colors.bold}${bundleType}${colors.reset}: ${formatBytes(totalSize)}`
    );

    // Threshold info
    if (threshold) {
      const percentage = ((totalSize / threshold) * 100).toFixed(1);
      const barLength = 20;
      const filledLength = Math.min(
        Math.round((totalSize / threshold) * barLength),
        barLength
      );
      const bar =
        colors.cyan +
        '█'.repeat(filledLength) +
        colors.dim +
        '░'.repeat(barLength - filledLength) +
        colors.reset;
      console.log(
        `   ${bar} ${percentage}% of ${formatBytes(threshold)} limit`
      );
    }

    // Comparison with previous build
    if (diff !== null) {
      console.log(
        `   Previous: ${formatBytes(previousSize)} ${formatDiff(diff)}`
      );
    }

    // List individual files
    if (files.length > 0) {
      console.log(colors.dim + '   Files:' + colors.reset);
      for (const file of files) {
        console.log(
          colors.dim +
            `     - ${file.name} (${formatBytes(file.size)})` +
            colors.reset
        );
      }
    }
  }

  // Total summary
  const totalData = results.total;
  if (totalData) {
    console.log('\n' + colors.dim + '─'.repeat(60) + colors.reset);
    const totalStatus = totalData.exceeds
      ? colors.red + '✗' + colors.reset
      : colors.green + '✓' + colors.reset;
    console.log(
      `\n${totalStatus} ${colors.bold}Total JS Bundle Size${colors.reset}: ${formatBytes(totalData.totalSize)}`
    );

    if (totalData.threshold) {
      const percentage = (
        (totalData.totalSize / totalData.threshold) *
        100
      ).toFixed(1);
      console.log(
        `   ${percentage}% of ${formatBytes(totalData.threshold)} limit`
      );
    }

    if (totalData.exceeds) {
      hasExceeded = true;
    }
  }

  console.log('\n' + colors.dim + '─'.repeat(60) + colors.reset);

  // Summary message
  if (hasExceeded) {
    console.log(
      `\n${colors.red}${colors.bold}⚠ Bundle size thresholds exceeded!${colors.reset}`
    );
    console.log(
      colors.dim +
        'Consider code splitting or removing unused dependencies.' +
        colors.reset
    );
  } else if (hasWarnings) {
    console.log(
      `\n${colors.yellow}${colors.bold}⚠ Bundle sizes increased from previous build${colors.reset}`
    );
  } else {
    console.log(
      `\n${colors.green}${colors.bold}✓ All bundle sizes within limits${colors.reset}`
    );
  }

  console.log('');

  return hasExceeded;
}

/**
 * Main function - runs the bundle size analysis
 */
async function main() {
  const args = process.argv.slice(2);
  const failOnExceed = args.includes('--fail-on-exceed');

  try {
    // Load configuration
    const config = loadConfig();

    // Load previous build history
    const historyFile = config.historyFile || '.bundle-size-history.json';
    const previousSizes = loadHistory(historyFile);

    // Analyze current bundles
    const results = await analyzeBundles(config);

    // Print report
    const hasExceeded = printReport(results, previousSizes, config);

    // Save current sizes to history
    const sizesToSave = {};
    for (const [bundleType, data] of Object.entries(results)) {
      sizesToSave[bundleType] = {
        totalSize: data.totalSize,
        fileCount: data.files.length,
      };
    }
    saveHistory(historyFile, sizesToSave);

    // Exit with error if thresholds exceeded and failOnExceed is set
    if (hasExceeded && (failOnExceed || config.failOnExceed)) {
      process.exit(1);
    }
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

main();
