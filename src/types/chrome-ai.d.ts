/**
 * Type declarations for Chrome Built-in AI APIs
 * These APIs are experimental and may not be available in all Chrome versions
 */

/**
 * Summarizer API types
 */
export interface AISummarizer {
  summarize(
    input: string,
    options?: { context?: string; signal?: AbortSignal }
  ): Promise<string>;
  summarizeStreaming(
    input: string,
    options?: { context?: string }
  ): ReadableStream;
  destroy(): void;
}

export interface AISummarizerFactory {
  create(options?: {
    sharedContext?: string;
    type?: 'tldr' | 'key-points' | 'teaser' | 'headline';
    format?: 'plain-text' | 'markdown';
    length?: 'short' | 'medium' | 'long';
    expectedInputLanguages?: string[];
    outputLanguage?: string;
    expectedContextLanguages?: string[];
    monitor?: (monitor: {
      addEventListener: (
        event: string,
        callback: (e: { loaded: number; total: number }) => void
      ) => void;
    }) => void;
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
 * Note: The Proofreader API returns a ProofreadResult object, not a string
 */
export interface ProofreadResult {
  correction: string; // Fully corrected text
  corrections: {
    startIndex: number;
    endIndex: number;
  }[];
}

export interface AIProofreader {
  proofread(
    input: string,
    options?: { signal?: AbortSignal }
  ): Promise<ProofreadResult>;
  destroy(): void;
}

export interface AIProofreaderFactory {
  create(options?: {
    expectedInputLanguages?: string[];
    monitor?: (monitor: {
      addEventListener: (
        event: string,
        callback: (e: { loaded: number; total: number }) => void
      ) => void;
    }) => void;
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
  create(options?: {
    monitor?: (monitor: {
      addEventListener: (
        event: string,
        callback: (e: { loaded: number; total: number }) => void
      ) => void;
    }) => void;
    signal?: AbortSignal;
  }): Promise<AILanguageDetector>;
  availability(): Promise<
    'available' | 'downloadable' | 'downloading' | 'unavailable'
  >;
}

/**
 * Translator API types
 */
export interface AITranslator {
  translate(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  translateStreaming(input: string): ReadableStream<string>;
  destroy(): void;
}

export interface AITranslatorFactory {
  create(options: {
    sourceLanguage: string;
    targetLanguage: string;
    monitor?: (monitor: {
      addEventListener: (
        event: string,
        callback: (e: { loaded: number; total: number }) => void
      ) => void;
    }) => void;
    signal?: AbortSignal;
  }): Promise<AITranslator>;
  availability(options: {
    sourceLanguage: string;
    targetLanguage: string;
  }): Promise<'available' | 'downloadable' | 'downloading' | 'unavailable'>;
}

/**
 * Prompt API (Language Model) types
 */
export interface AILanguageModel {
  prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  promptStreaming(input: string): ReadableStream<string>;
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
    monitor?: (monitor: {
      addEventListener: (
        event: string,
        callback: (e: { loaded: number; total: number }) => void
      ) => void;
    }) => void;
    signal?: AbortSignal;
  }): Promise<AILanguageModel>;
  capabilities(): Promise<{
    available: 'readily' | 'after-download' | 'no';
    defaultTopK: number;
    maxTopK: number;
    defaultTemperature: number;
  }>;
  availability(): Promise<
    'available' | 'downloadable' | 'downloading' | 'unavailable'
  >;
}

/**
 * Chrome AI namespace - currently empty as all APIs are globals
 * Note: All Chrome Built-in AI APIs are available as global objects, not under the ai namespace
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ChromeAI {
  // Empty - all APIs are globals
}

/**
 * Extend the global Window interface to include Chrome AI APIs
 */
declare global {
  interface Window {
    ai?: ChromeAI;
    // All Chrome Built-in AI APIs are available as globals (not under ai namespace)
    Summarizer?: AISummarizerFactory;
    Writer?: AIWriterFactory;
    Rewriter?: AIRewriterFactory;
    Proofreader?: AIProofreaderFactory;
    LanguageModel?: AILanguageModelFactory;
    Translator?: AITranslatorFactory;
    LanguageDetector?: AILanguageDetectorFactory;
  }

  // For service workers and global scope
  var ai: ChromeAI | undefined;
  var Summarizer: AISummarizerFactory | undefined;
  var Writer: AIWriterFactory | undefined;
  var Rewriter: AIRewriterFactory | undefined;
  var Proofreader: AIProofreaderFactory | undefined;
  var LanguageModel: AILanguageModelFactory | undefined;
  var Translator: AITranslatorFactory | undefined;
  var LanguageDetector: AILanguageDetectorFactory | undefined;
}

export {};
