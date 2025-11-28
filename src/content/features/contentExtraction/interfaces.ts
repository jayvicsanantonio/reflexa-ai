/**
 * Content Extraction Interfaces
 * Following Interface Segregation Principle (ISP) - small, focused interfaces
 */

import type { ExtractedContent, PageMetadata } from '../../../types';

/**
 * Configuration for content extraction selectors
 * Supports Open/Closed Principle (OCP) - configurable without modification
 */
export interface ContentExtractionConfig {
  excludeSelectors: string[];
  contentSelectors: string[];
  excludePatterns: string[];
  maxElementsToAnalyze: number;
  highScoreThreshold: number;
  minTextLength: number;
}

/**
 * Interface for DOM operations abstraction
 * Supports Dependency Inversion Principle (DIP)
 */
export interface IDOMAdapter {
  querySelector(selector: string): Element | null;
  querySelectorAll(selector: string): NodeListOf<Element>;
  getLocationHref(): string;
  getTitle(): string;
  getBody(): HTMLElement | null;
  cloneElement(element: HTMLElement): HTMLElement;
}

/**
 * Interface for content scoring operations
 * Supports Single Responsibility Principle (SRP)
 */
export interface IContentScorer {
  calculateScore(element: HTMLElement): number;
  findHighestScoringElement(elements: HTMLElement[]): HTMLElement | null;
  shouldExclude(element: HTMLElement): boolean;
}

/**
 * Interface for title extraction
 * Supports Single Responsibility Principle (SRP)
 */
export interface ITitleExtractor {
  extractTitle(): string;
}

/**
 * Interface for text extraction from elements
 * Supports Single Responsibility Principle (SRP)
 */
export interface ITextExtractor {
  extractText(element: HTMLElement): string;
  findContentContainer(): HTMLElement | null;
}

/**
 * Interface for content caching
 * Supports Single Responsibility Principle (SRP)
 */
export interface IContentCache {
  get(url: string): ExtractedContent | null;
  set(url: string, content: ExtractedContent): void;
  clear(): void;
}

/**
 * Interface for token/content limit handling
 * Supports Single Responsibility Principle (SRP)
 */
export interface IContentTruncator {
  checkTokenLimit(content: ExtractedContent): {
    exceeds: boolean;
    tokens: number;
  };
  truncate(content: ExtractedContent): ExtractedContent;
}

/**
 * Main content extractor interface
 * Supports Dependency Inversion Principle (DIP)
 */
export interface IContentExtractor {
  extractMainContent(): ExtractedContent;
  getPageMetadata(): PageMetadata;
  clearCache(): void;
  checkTokenLimit(content: ExtractedContent): {
    exceeds: boolean;
    tokens: number;
  };
  getTruncatedContent(content: ExtractedContent): ExtractedContent;
}
