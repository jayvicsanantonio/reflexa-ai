/**
 * Text Extractor - Extracts text content from DOM elements
 * Follows Single Responsibility Principle (SRP) - only handles text extraction
 */

import type {
  ITextExtractor,
  IDOMAdapter,
  IContentScorer,
  ContentExtractionConfig,
} from '../interfaces';
import { sanitizeText } from '../../../../utils';

export class TextExtractor implements ITextExtractor {
  constructor(
    private readonly domAdapter: IDOMAdapter,
    private readonly scorer: IContentScorer,
    private readonly config: ContentExtractionConfig
  ) {}

  /**
   * Extract text from an element, excluding unwanted child elements
   */
  extractText(element: HTMLElement): string {
    const clone = this.domAdapter.cloneElement(element);

    // Remove excluded elements
    const excludedElements = clone.querySelectorAll(
      this.config.excludeSelectors.join(',')
    );
    excludedElements.forEach((el) => el.remove());

    // Remove script and style tags
    const scripts = clone.querySelectorAll('script, style, noscript');
    scripts.forEach((el) => el.remove());

    // Get and sanitize text content
    const text = clone.textContent || '';
    return sanitizeText(text);
  }

  /**
   * Find the main content container using heuristics
   */
  findContentContainer(): HTMLElement | null {
    // Try semantic content selectors first
    for (const selector of this.config.contentSelectors) {
      const elements = this.domAdapter.querySelectorAll(selector);

      if (elements.length === 1) {
        return elements[0] as HTMLElement;
      } else if (elements.length > 1) {
        return this.scorer.findHighestScoringElement(
          Array.from(elements) as HTMLElement[]
        );
      }
    }

    // Fallback: analyze content density across all elements
    const body = this.domAdapter.getBody();
    if (!body) return null;

    const divSections = body.querySelectorAll('div, section');
    return this.scorer.findHighestScoringElement(
      Array.from(divSections) as HTMLElement[]
    );
  }
}
