/**
 * Content Cache - Caches extracted content by URL
 * Follows Single Responsibility Principle (SRP) - only handles caching
 */

import type { IContentCache } from '../interfaces';
import type { ExtractedContent } from '../../../../types';

export class ContentCache implements IContentCache {
  private cache = new Map<string, ExtractedContent>();

  get(url: string): ExtractedContent | null {
    return this.cache.get(url) ?? null;
  }

  set(url: string, content: ExtractedContent): void {
    this.cache.set(url, content);
  }

  clear(): void {
    this.cache.clear();
  }
}
