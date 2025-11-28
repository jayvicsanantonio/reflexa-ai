/**
 * Summarizer Interfaces
 * Following Interface Segregation Principle (ISP) - small, focused interfaces
 */

import type { SummaryFormat } from '../../../../types';
import type { AISummarizer } from '../../../../types/chrome-ai';

/**
 * Language options for summarization
 */
export interface SummarizerLanguageOptions {
  expectedInputLanguages?: string[];
  expectedContextLanguages?: string[];
}

/**
 * Session configuration for creating summarizer sessions
 */
export interface SummarizerSessionConfig {
  type: 'tldr' | 'key-points' | 'teaser' | 'headline';
  format: 'plain-text' | 'markdown';
  length: 'short' | 'medium' | 'long';
  outputLanguage?: string;
  languageOptions?: SummarizerLanguageOptions;
}

/**
 * Interface for summarizer API abstraction
 * Supports Dependency Inversion Principle (DIP)
 */
export interface ISummarizerAPI {
  isAvailable(): boolean;
  create(config: SummarizerSessionConfig): Promise<AISummarizer | null>;
}

/**
 * Interface for session pool management
 * Supports Single Responsibility Principle (SRP)
 */
export interface ISessionPool {
  getOrCreate(config: SummarizerSessionConfig): Promise<AISummarizer | null>;
  destroy(key: string): void;
  destroyAll(): void;
}

/**
 * Interface for summary format strategy
 * Supports Open/Closed Principle (OCP) - add new formats without modifying existing code
 */
export interface ISummaryStrategy {
  readonly format: SummaryFormat;
  summarize(
    text: string,
    sessionPool: ISessionPool,
    outputLanguage?: string,
    languageOptions?: SummarizerLanguageOptions
  ): Promise<string[]>;
}

/**
 * Interface for retry handling
 * Supports Single Responsibility Principle (SRP)
 */
export interface IRetryHandler {
  executeWithRetry<T>(
    operation: () => Promise<T>,
    initialTimeout: number,
    retryTimeout: number
  ): Promise<T>;
}

/**
 * Main summarizer manager interface
 * Supports Dependency Inversion Principle (DIP)
 */
export interface ISummarizerManager {
  checkAvailability(): Promise<boolean>;
  isAvailable(): boolean;
  summarize(
    text: string,
    format: SummaryFormat,
    outputLanguage?: string,
    languageOptions?: SummarizerLanguageOptions
  ): Promise<string[]>;
  destroy(): void;
}
