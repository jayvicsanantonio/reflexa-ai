/**
 * ContentExtractor - Analyzes DOM structure and extracts main article content
 * Implements heuristics to identify readable content and exclude navigation, ads, etc.
 */

import type { ExtractedContent, PageMetadata } from '../types';
import {
  countWords,
  estimateTokens,
  sanitizeText,
  extractDomain,
} from '../utils';
import { CONTENT_LIMITS } from '../constants';

/**
 * Selectors for elements to exclude from content extraction
 */
const EXCLUDE_SELECTORS = [
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
 * Selectors for elements that likely contain main content
 */
const CONTENT_SELECTORS = [
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
 * ContentExtractor class for analyzing and extracting page content
 */
export class ContentExtractor {
  private document: Document;
  private cachedContent: ExtractedContent | null = null;
  private cachedUrl: string | null = null;

  constructor(doc: Document = document) {
    this.document = doc;
  }

  /**
   * Extract main readable content from the page
   * @returns ExtractedContent object with title, text, url, and word count
   */
  extractMainContent(): ExtractedContent {
    const startTime = performance.now();
    const currentUrl = this.document.location.href;

    // Return cached content if URL hasn't changed
    if (this.cachedContent && this.cachedUrl === currentUrl) {
      const duration = performance.now() - startTime;
      console.log(
        `Content extraction (cached) completed in ${duration.toFixed(2)}ms`
      );
      return this.cachedContent;
    }

    // Perform extraction
    const title = this.extractTitle();
    const url = currentUrl;
    const text = this.extractText();
    const wordCount = countWords(text);

    const content: ExtractedContent = {
      title,
      text,
      url,
      wordCount,
    };

    // Cache the result
    this.cachedContent = content;
    this.cachedUrl = url;

    const duration = performance.now() - startTime;
    console.log(
      `Content extraction completed in ${duration.toFixed(2)}ms`,
      duration > 100 ? '⚠️' : '✓'
    );

    if (duration > 100) {
      console.warn(
        `Content extraction took longer than expected (${duration.toFixed(2)}ms). Consider optimizing for this page structure.`
      );
    }

    return content;
  }

  /**
   * Extract page metadata
   * @returns PageMetadata object
   */
  getPageMetadata(): PageMetadata {
    const startTime = performance.now();

    const title = this.extractTitle();
    const url = this.document.location.href;
    const domain = extractDomain(url);
    const timestamp = Date.now();

    const duration = performance.now() - startTime;
    console.log(`Metadata extraction completed in ${duration.toFixed(2)}ms ✓`);

    return {
      title,
      url,
      domain,
      timestamp,
    };
  }

  /**
   * Clear cached content (useful for testing or forced re-extraction)
   */
  clearCache(): void {
    this.cachedContent = null;
    this.cachedUrl = null;
  }

  /**
   * Extract page title from document.title or meta tags
   * @returns Page title string
   */
  private extractTitle(): string {
    // Try document.title first
    if (this.document.title?.trim()) {
      return this.document.title.trim();
    }

    // Try og:title meta tag
    const ogTitle = this.document.querySelector('meta[property="og:title"]');
    const ogContent = ogTitle?.getAttribute('content');
    if (ogContent) {
      return ogContent.trim();
    }

    // Try twitter:title meta tag
    const twitterTitle = this.document.querySelector(
      'meta[name="twitter:title"]'
    );
    const twitterContent = twitterTitle?.getAttribute('content');
    if (twitterContent) {
      return twitterContent.trim();
    }

    // Try first h1 tag
    const h1 = this.document.querySelector('h1');
    if (h1?.textContent) {
      return h1.textContent.trim();
    }

    // Fallback to URL
    return this.document.location.href;
  }

  /**
   * Extract main text content using heuristics
   * @returns Extracted and sanitized text
   */
  private extractText(): string {
    // Try to find main content container
    const contentContainer = this.findContentContainer();

    if (contentContainer) {
      return this.extractTextFromElement(contentContainer);
    }

    // Fallback: extract from body with exclusions
    return this.extractTextFromElement(this.document.body);
  }

  /**
   * Find the main content container using heuristics
   * @returns HTMLElement containing main content or null
   */
  private findContentContainer(): HTMLElement | null {
    // Try semantic content selectors first
    for (const selector of CONTENT_SELECTORS) {
      const elements = this.document.querySelectorAll(selector);

      if (elements.length === 1) {
        // Single match is likely the main content
        return elements[0] as HTMLElement;
      } else if (elements.length > 1) {
        // Multiple matches: find the one with highest content density
        return this.findHighestDensityElement(
          Array.from(elements) as HTMLElement[]
        );
      }
    }

    // Fallback: analyze content density across all elements
    const divSections = this.document.body.querySelectorAll('div, section');
    return this.findHighestDensityElement(
      Array.from(divSections) as HTMLElement[]
    );
  }

  /**
   * Find element with highest content density (text vs markup ratio)
   * Optimized to limit DOM traversal by early exit and sampling
   * @param elements Array of HTMLElements to analyze
   * @returns Element with highest density or null
   */
  private findHighestDensityElement(
    elements: HTMLElement[]
  ): HTMLElement | null {
    let bestElement: HTMLElement | null = null;
    let highestScore = 0;

    // Limit analysis to first 20 elements to reduce DOM traversal
    const maxElements = Math.min(elements.length, 20);

    for (let i = 0; i < maxElements; i++) {
      const element = elements[i];
      const score = this.calculateContentScore(element);

      if (score > highestScore) {
        highestScore = score;
        bestElement = element;

        // Early exit if we find a very high score (likely the main content)
        if (score > 5000) {
          console.log(
            `Found high-scoring element early (score: ${score}), stopping search`
          );
          break;
        }
      }
    }

    return highestScore > 0 ? bestElement : null;
  }

  /**
   * Calculate content score for an element based on various heuristics
   * @param element HTMLElement to score
   * @returns Numeric score (higher is better)
   */
  private calculateContentScore(element: HTMLElement): number {
    // Skip if element should be excluded
    if (this.shouldExclude(element)) {
      return 0;
    }

    let score = 0;

    // Get text content length
    const text = element.textContent || '';
    const textLength = text.trim().length;

    if (textLength < 100) {
      // Too short to be main content
      return 0;
    }

    // Base score from text length
    score += textLength;

    // Bonus for paragraph tags
    const paragraphs = element.querySelectorAll('p');
    score += paragraphs.length * 50;

    // Bonus for semantic HTML
    if (element.tagName === 'ARTICLE') score += 200;
    if (element.tagName === 'MAIN') score += 150;
    if (element.getAttribute('role') === 'article') score += 200;
    if (element.getAttribute('role') === 'main') score += 150;

    // Penalty for links (high link density suggests navigation)
    const links = element.querySelectorAll('a');
    const linkText = Array.from(links).reduce((sum, link) => {
      return sum + (link.textContent?.length || 0);
    }, 0);
    const linkDensity = textLength > 0 ? linkText / textLength : 0;
    if (linkDensity > 0.5) {
      score *= 0.3; // Heavy penalty for high link density
    }

    // Penalty for excluded child elements
    const excludedChildren = element.querySelectorAll(
      EXCLUDE_SELECTORS.join(',')
    );
    score -= excludedChildren.length * 30;

    return Math.max(0, score);
  }

  /**
   * Check if element should be excluded from content extraction
   * @param element HTMLElement to check
   * @returns True if element should be excluded
   */
  private shouldExclude(element: HTMLElement): boolean {
    // Check tag name
    const tagName = element.tagName.toLowerCase();
    if (
      [
        'nav',
        'header',
        'footer',
        'aside',
        'script',
        'style',
        'noscript',
      ].includes(tagName)
    ) {
      return true;
    }

    // Check role attribute
    const role = element.getAttribute('role');
    if (
      role &&
      ['navigation', 'banner', 'contentinfo', 'complementary'].includes(role)
    ) {
      return true;
    }

    // Check class and id for common patterns
    const className = element.className.toLowerCase();
    const id = element.id.toLowerCase();
    const excludePatterns = [
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

    for (const pattern of excludePatterns) {
      if (className.includes(pattern) || id.includes(pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Extract text from an element, excluding unwanted child elements
   * @param element HTMLElement to extract text from
   * @returns Extracted and sanitized text
   */
  private extractTextFromElement(element: HTMLElement): string {
    // Clone element to avoid modifying the DOM
    const clone = element.cloneNode(true) as HTMLElement;

    // Remove excluded elements
    const excludedElements = clone.querySelectorAll(
      EXCLUDE_SELECTORS.join(',')
    );
    excludedElements.forEach((el) => el.remove());

    // Remove script and style tags
    const scripts = clone.querySelectorAll('script, style, noscript');
    scripts.forEach((el) => el.remove());

    // Get text content
    let text = clone.textContent || '';

    // Sanitize text
    text = sanitizeText(text);

    return text;
  }

  /**
   * Check if extracted content exceeds token limit
   * @param content ExtractedContent to check
   * @returns Object with exceeds flag and token count
   */
  checkTokenLimit(content: ExtractedContent): {
    exceeds: boolean;
    tokens: number;
  } {
    const tokens = estimateTokens(content.text);
    const exceeds = tokens > CONTENT_LIMITS.MAX_TOKENS;

    return { exceeds, tokens };
  }

  /**
   * Get truncated content if it exceeds token limit
   * @param content ExtractedContent to potentially truncate
   * @returns Content with text truncated if necessary
   */
  getTruncatedContent(content: ExtractedContent): ExtractedContent {
    const { exceeds } = this.checkTokenLimit(content);

    if (!exceeds) {
      return content;
    }

    // Truncate text to TRUNCATE_TOKENS limit
    const words = content.text.trim().split(/\s+/);
    const maxWords = Math.floor(
      CONTENT_LIMITS.TRUNCATE_TOKENS * CONTENT_LIMITS.WORDS_PER_TOKEN
    );
    const truncatedText = words.slice(0, maxWords).join(' ') + '...';

    return {
      ...content,
      text: truncatedText,
      wordCount: countWords(truncatedText),
    };
  }
}
