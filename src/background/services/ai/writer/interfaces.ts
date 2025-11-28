/**
 * Writer Manager Interfaces
 * Following Interface Segregation Principle (ISP)
 */

import type { WriterOptions } from '../../../../types';
import type { AIWriter } from '../../../../types/chrome-ai';

export interface WriterLanguageOptions {
  expectedInputLanguages?: string[];
  expectedContextLanguages?: string[];
}

export interface WriterSessionConfig {
  sharedContext?: string;
  tone?: 'formal' | 'neutral' | 'casual';
  format?: 'plain-text' | 'markdown';
  length?: 'short' | 'medium' | 'long';
  outputLanguage?: string;
  expectedInputLanguages?: string[];
  expectedContextLanguages?: string[];
  languageOptions?: WriterLanguageOptions;
}

export interface IWriterAPI {
  isAvailable(): boolean;
  create(config: WriterSessionConfig): Promise<AIWriter | null>;
}

export interface IWriterManager {
  checkAvailability(): Promise<boolean>;
  isAvailable(): boolean;
  write(prompt: string, options?: WriterSessionConfig): Promise<string>;
  generate(
    topic: string,
    options: WriterOptions,
    context?: string,
    outputLanguage?: string,
    languageOptions?: WriterLanguageOptions
  ): Promise<string>;
  destroy(): void;
}
