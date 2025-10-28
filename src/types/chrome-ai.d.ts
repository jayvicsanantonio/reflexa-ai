/**
 * Type declarations for Chrome Built-in AI APIs
 * These APIs are experimental and may not be available in all Chrome versions
 */

/**
 * Summarizer API types
 */
export interface AISummarizer {
  summarize(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  summarizeStreaming(input: string): ReadableStream;
  destroy(): void;
}

export interface AISummarizerFactory {
  create(options?: {
    type?: 'tl;dr' | 'key-points' | 'teaser' | 'headline';
    format?: 'plain-text' | 'markdown';
    length?: 'short' | 'medium' | 'long';
    signal?: AbortSignal;
  }): Promise<AISummarizer>;
  availability(): Promise<
    'available' | 'downloadable' | 'downloading' | 'unavailable'
  >;
}

/**
 * Writer API types
 */
export interface AIWriter {
  write(
    input: string,
    options?: { context?: string; signal?: AbortSignal }
  ): Promise<string>;
  writeStreaming(
    input: string,
    options?: { context?: string }
  ): ReadableStream & AsyncIterable<string>;
  destroy(): void;
}

export interface AIWriterFactory {
  create(options?: {
    sharedContext?: string;
    tone?: 'formal' | 'neutral' | 'casual';
    format?: 'plain-text' | 'markdown';
    length?: 'short' | 'medium' | 'long';
    expectedInputLanguages?: string[];
    expectedContextLanguages?: string[];
    outputLanguage?: string;
    monitor?: (monitor: {
      addEventListener: (
        event: string,
        callback: (e: { loaded: number; total: number }) => void
      ) => void;
    }) => void;
    signal?: AbortSignal;
  }): Promise<AIWriter>;
  availability(): Promise<
    'available' | 'downloadable' | 'downloading' | 'unavailable'
  >;
}

/**
 * Rewriter API types
 */
export interface AIRewriter {
  rewrite(
    input: string,
    options?: { context?: string; signal?: AbortSignal }
  ): Promise<string>;
  rewriteStreaming(
    input: string,
    options?: { context?: string }
  ): ReadableStream & AsyncIterable<string>;
  destroy(): void;
}

export interface AIRewriterFactory {
  create(options?: {
    sharedContext?: string;
    tone?: 'as-is' | 'more-formal' | 'more-casual';
    format?: 'as-is' | 'markdown' | 'plain-text';
    length?: 'as-is' | 'shorter' | 'longer';
    expectedInputLanguages?: string[];
    expectedContextLanguages?: string[];
    outputLanguage?: string;
    monitor?: (monitor: {
      addEventListener: (
        event: string,
        callback: (e: { loaded: number; total: number }) => void
      ) => void;
    }) => void;
    signal?: AbortSignal;
  }): Promise<AIRewriter>;
  availability(): Promise<
    'available' | 'downloadable' | 'downloading' | 'unavailable'
  >;
}

/**
 * Proofreader API types
 */
export interface AIProofreader {
  proofread(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  proofreadStreaming(input: string): ReadableStream;
  destroy(): void;
}

export interface AIProofreaderFactory {
  create(options?: {
    sharedContext?: string;
    signal?: AbortSignal;
  }): Promise<AIProofreader>;
  availability(): Promise<
    'available' | 'downloadable' | 'downloading' | 'unavailable'
  >;
}

/**
 * Language Detector API types
 */
export interface LanguageDetectionResult {
  detectedLanguage: string; // ISO 639-1 language code
  confidence: number; // 0-1 confidence score
}

export interface AILanguageDetector {
  detect(
    input: string,
    options?: { signal?: AbortSignal }
  ): Promise<LanguageDetectionResult[]>;
  destroy(): void;
}

export interface AILanguageDetectorFactory {
  create(options?: { signal?: AbortSignal }): Promise<AILanguageDetector>;
  availability(): Promise<
    'available' | 'downloadable' | 'downloading' | 'unavailable'
  >;
}

/**
 * Translator API types
 */
export interface AITranslator {
  translate(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  destroy(): void;
}

export interface AITranslatorFactory {
  create(
    sourceLanguage: string,
    targetLanguage: string,
    options?: { signal?: AbortSignal }
  ): Promise<AITranslator>;
  canTranslate(
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<'available' | 'downloadable' | 'downloading' | 'unavailable'>;
  availability(): Promise<
    'available' | 'downloadable' | 'downloading' | 'unavailable'
  >;
}

/**
 * Prompt API (Language Model) types
 */
export interface AILanguageModel {
  prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  promptStreaming(input: string): ReadableStream;
  countPromptTokens(input: string): Promise<number>;
  maxTokens: number;
  tokensSoFar: number;
  tokensLeft: number;
  topK: number;
  temperature: number;
  destroy(): void;
  clone(): Promise<AILanguageModel>;
}

export interface AILanguageModelFactory {
  create(options?: {
    systemPrompt?: string;
    initialPrompts?: {
      role: 'system' | 'user' | 'assistant';
      content: string;
    }[];
    topK?: number;
    temperature?: number;
    signal?: AbortSignal;
  }): Promise<AILanguageModel>;
  availability(): Promise<
    'available' | 'downloadable' | 'downloading' | 'unavailable'
  >;
}

/**
 * Chrome AI namespace containing all built-in AI APIs
 */
interface ChromeAI {
  summarizer?: AISummarizerFactory;
  writer?: AIWriterFactory;
  rewriter?: AIRewriterFactory;
  proofreader?: AIProofreaderFactory;
  languageDetector?: AILanguageDetectorFactory;
  translator?: AITranslatorFactory;
  languageModel?: AILanguageModelFactory;
}

/**
 * Extend the global Window interface to include Chrome AI APIs
 */
declare global {
  interface Window {
    ai?: ChromeAI;
    // Writer and Rewriter APIs are also available as globals
    Writer?: AIWriterFactory;
    Rewriter?: AIRewriterFactory;
  }

  // For service workers and global scope
  const ai: ChromeAI | undefined;
  const Writer: AIWriterFactory | undefined;
  const Rewriter: AIRewriterFactory | undefined;
}
