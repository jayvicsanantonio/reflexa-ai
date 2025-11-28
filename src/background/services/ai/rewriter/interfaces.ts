/**
 * Rewriter Manager Interfaces
 * Following Interface Segregation Principle (ISP)
 */

import type { TonePreset } from '../../../../types';

export interface RewriterLanguageOptions {
  expectedInputLanguages?: string[];
  expectedContextLanguages?: string[];
}

export interface RewriterSessionConfig {
  sharedContext?: string;
  tone?: 'as-is' | 'more-formal' | 'more-casual';
  format?: 'as-is' | 'markdown' | 'plain-text';
  length?: 'as-is' | 'shorter' | 'longer';
  outputLanguage?: string;
  languageOptions?: RewriterLanguageOptions;
}

export interface IRewriterManager {
  checkAvailability(): Promise<boolean>;
  isAvailable(): boolean;
  rewrite(
    text: string,
    preset: TonePreset,
    context?: string,
    outputLanguage?: string,
    languageOptions?: RewriterLanguageOptions
  ): Promise<{ original: string; rewritten: string }>;
  destroy(): void;
}
