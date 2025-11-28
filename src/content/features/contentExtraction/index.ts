/**
 * Content Extraction Module Exports
 */

export { ContentExtractor, createContentExtractor } from './contentExtractor';
export { DEFAULT_EXTRACTION_CONFIG, createExtractionConfig } from './config';
export type {
  IContentExtractor,
  IDOMAdapter,
  IContentScorer,
  ITitleExtractor,
  ITextExtractor,
  IContentCache,
  IContentTruncator,
  ContentExtractionConfig,
} from './interfaces';

// Service exports for custom composition
export { BrowserDOMAdapter } from './adapters/DOMAdapter';
export { ContentScorer } from './services/ContentScorer';
export { TitleExtractor } from './services/TitleExtractor';
export { TextExtractor } from './services/TextExtractor';
export { ContentCache } from './services/ContentCache';
export { ContentTruncator } from './services/ContentTruncator';
