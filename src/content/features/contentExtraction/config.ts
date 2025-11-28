/**
 * Content Extraction Configuration
 * Supports Open/Closed Principle (OCP) - extend behavior through configuration
 */

import type { ContentExtractionConfig } from './interfaces';

/**
 * Default selectors for elements to exclude from content extraction
 */
const DEFAULT_EXCLUDE_SELECTORS = [
  'nav',
  'header',
  'footer',
  'aside',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
  '[role="complementary"]',
  '.nav',
  '.navigation',
  '.menu',
  '.sidebar',
  '.advertisement',
  '.ad',
  '.ads',
  '.social',
  '.share',
  '.comments',
  '.related',
  '.recommended',
  '#comments',
  '#sidebar',
  '#footer',
  '#header',
  '.cookie-banner',
  '.popup',
  '.modal',
];

/**
 * Default selectors for elements that likely contain main content
 */
const DEFAULT_CONTENT_SELECTORS = [
  'article',
  '[role="article"]',
  '[role="main"]',
  'main',
  '.article',
  '.post',
  '.content',
  '.entry',
  '.story',
];

/**
 * Default patterns to check in class/id for exclusion
 */
const DEFAULT_EXCLUDE_PATTERNS = [
  'nav',
  'menu',
  'sidebar',
  'ad',
  'advertisement',
  'social',
  'share',
  'comment',
  'related',
  'recommended',
  'cookie',
  'popup',
  'modal',
];

/**
 * Default configuration for content extraction
 */
export const DEFAULT_EXTRACTION_CONFIG: ContentExtractionConfig = {
  excludeSelectors: DEFAULT_EXCLUDE_SELECTORS,
  contentSelectors: DEFAULT_CONTENT_SELECTORS,
  excludePatterns: DEFAULT_EXCLUDE_PATTERNS,
  maxElementsToAnalyze: 20,
  highScoreThreshold: 5000,
  minTextLength: 100,
};

/**
 * Create a custom configuration by merging with defaults
 */
export function createExtractionConfig(
  overrides: Partial<ContentExtractionConfig>
): ContentExtractionConfig {
  return {
    ...DEFAULT_EXTRACTION_CONFIG,
    ...overrides,
  };
}
