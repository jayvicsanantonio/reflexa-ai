/**
 * Lighthouse Configuration for Reflexa AI Extension
 * Audits popup and options pages for performance, accessibility, and best practices
 */

export default {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices'],
    formFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    screenEmulation: {
      mobile: false,
      width: 400,
      height: 600,
      deviceScaleFactor: 1,
      disabled: false,
    },
  },
  audits: [
    'first-contentful-paint',
    'largest-contentful-paint',
    'total-blocking-time',
    'cumulative-layout-shift',
    'speed-index',
    'interactive',
    'max-potential-fid',
  ],
};
