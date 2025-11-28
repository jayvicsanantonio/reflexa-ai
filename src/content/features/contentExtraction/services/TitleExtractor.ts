/**
 * Title Extractor - Extracts page title from various sources
 * Follows Single Responsibility Principle (SRP) - only handles title extraction
 */

import type { ITitleExtractor, IDOMAdapter } from '../interfaces';

export class TitleExtractor implements ITitleExtractor {
  constructor(private readonly domAdapter: IDOMAdapter) {}

  /**
   * Extract page title from document.title or meta tags
   */
  extractTitle(): string {
    // Try document.title first
    const docTitle = this.domAdapter.getTitle();
    if (docTitle?.trim()) {
      return docTitle.trim();
    }

    // Try og:title meta tag
    const ogTitle = this.domAdapter.querySelector('meta[property="og:title"]');
    const ogContent = ogTitle?.getAttribute('content');
    if (ogContent) {
      return ogContent.trim();
    }

    // Try twitter:title meta tag
    const twitterTitle = this.domAdapter.querySelector(
      'meta[name="twitter:title"]'
    );
    const twitterContent = twitterTitle?.getAttribute('content');
    if (twitterContent) {
      return twitterContent.trim();
    }

    // Try first h1 tag
    const h1 = this.domAdapter.querySelector('h1');
    if (h1?.textContent) {
      return h1.textContent.trim();
    }

    // Fallback to URL
    return this.domAdapter.getLocationHref();
  }
}
