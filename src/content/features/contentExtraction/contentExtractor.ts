/**
 * ContentExtractor - Orchestrates content extraction from web pages
 *
 * SOLID Principles Applied:
 * - SRP: Delegates specific tasks to specialized services
 * - OCP: Configurable through ContentExtractionConfig
 * - LSP: All services implement their interfaces correctly
 * - ISP: Small, focused interfaces for each service
 * - DIP: Depends on abstractions (interfaces), not concrete implementations
 */

import type { ExtractedContent, PageMetadata } from '../../../types';
import type {
  IContentExtractor,
  IDOMAdapter,
  ITitleExtractor,
  ITextExtractor,
  IContentCache,
  IContentTruncator,
  ContentExtractionConfig,
} from './interfaces';
import { BrowserDOMAdapter } from './adapters/DOMAdapter';
import { ContentScorer } from './services/ContentScorer';
import { TitleExtractor } from './services/TitleExtractor';
import { TextExtractor } from './services/TextExtractor';
import { ContentCache } from './services/ContentCache';
import { ContentTruncator } from './services/ContentTruncator';
import { DEFAULT_EXTRACTION_CONFIG } from './config';
import { countWords, extractDomain } from '../../../utils';
import { devLog, devWarn } from '../../../utils/logger';

/**
 * Factory function to create ContentExtractor with default dependencies
 */
export function createContentExtractor(
  doc: Document = document,
  config: ContentExtractionConfig = DEFAULT_EXTRACTION_CONFIG
): ContentExtractor {
  const domAdapter = new BrowserDOMAdapter(doc);
  const scorer = new ContentScorer(config);
  const titleExtractor = new TitleExtractor(domAdapter);
  const textExtractor = new TextExtractor(domAdapter, scorer, config);
  const cache = new ContentCache();
  const truncator = new ContentTruncator();

  return new ContentExtractor(
    domAdapter,
    titleExtractor,
    textExtractor,
    cache,
    truncator
  );
}

/**
 * ContentExtractor class - orchestrates content extraction
 * Uses dependency injection for all services
 */
export class ContentExtractor implements IContentExtractor {
  constructor(
    private readonly domAdapter: IDOMAdapter,
    private readonly titleExtractor: ITitleExtractor,
    private readonly textExtractor: ITextExtractor,
    private readonly cache: IContentCache,
    private readonly truncator: IContentTruncator
  ) {}

  /**
   * Extract main readable content from the page
   */
  extractMainContent(): ExtractedContent {
    const startTime = performance.now();
    const currentUrl = this.domAdapter.getLocationHref();

    // Return cached content if available
    const cached = this.cache.get(currentUrl);
    if (cached) {
      const duration = performance.now() - startTime;
      devLog(
        `Content extraction (cached) completed in ${duration.toFixed(2)}ms`
      );
      return cached;
    }

    // Perform extraction
    const title = this.titleExtractor.extractTitle();
    const text = this.extractText();
    const wordCount = countWords(text);

    const content: ExtractedContent = {
      title,
      text,
      url: currentUrl,
      wordCount,
    };

    // Cache the result
    this.cache.set(currentUrl, content);

    const duration = performance.now() - startTime;
    console.log(
      `Content extraction completed in ${duration.toFixed(2)}ms`,
      duration > 100 ? '⚠️' : '✓'
    );

    if (duration > 100) {
      devWarn(
        `Content extraction took longer than expected (${duration.toFixed(2)}ms). Consider optimizing for this page structure.`
      );
    }

    return content;
  }

  /**
   * Extract page metadata
   */
  getPageMetadata(): PageMetadata {
    const startTime = performance.now();

    const title = this.titleExtractor.extractTitle();
    const url = this.domAdapter.getLocationHref();
    const domain = extractDomain(url);
    const timestamp = Date.now();

    const duration = performance.now() - startTime;
    console.log(`Metadata extraction completed in ${duration.toFixed(2)}ms ✓`);

    return { title, url, domain, timestamp };
  }

  /**
   * Clear cached content
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Check if extracted content exceeds token limit
   */
  checkTokenLimit(content: ExtractedContent): {
    exceeds: boolean;
    tokens: number;
  } {
    return this.truncator.checkTokenLimit(content);
  }

  /**
   * Get truncated content if it exceeds token limit
   */
  getTruncatedContent(content: ExtractedContent): ExtractedContent {
    return this.truncator.truncate(content);
  }

  private extractText(): string {
    const body = this.domAdapter.getBody();
    if (!body) return '';

    const contentContainer = this.textExtractor.findContentContainer();
    return this.textExtractor.extractText(contentContainer ?? body);
  }
}
