/**
 * Summarizer Manager - Re-export for backward compatibility
 *
 * This file maintains backward compatibility with existing imports.
 * The actual implementation has been refactored to follow SOLID principles
 * and is located in the ./summarizer directory.
 */

export { SummarizerManager } from './summarizer';

export type {
  ISummarizerManager,
  ISummaryStrategy,
  ISessionPool,
  IRetryHandler,
  ISummarizerAPI,
  SummarizerSessionConfig,
  SummarizerLanguageOptions,
} from './summarizer';
