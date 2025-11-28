/**
 * AI-related type definitions
 */

/**
 * Summary format options for Summarizer API
 */
export type SummaryFormat = 'bullets' | 'paragraph' | 'headline-bullets';

/**
 * Tone preset options for text rewriting
 */
export type TonePreset = 'calm' | 'concise' | 'empathetic' | 'academic';

/**
 * AI capabilities detection for Chrome Built-in AI APIs
 */
export interface AICapabilities {
  summarizer: boolean;
  writer: boolean;
  rewriter: boolean;
  proofreader: boolean;
  languageDetector: boolean;
  translator: boolean;
  prompt: boolean;
  experimental: boolean;
}

/**
 * Options for summarization operations
 */
export interface SummarizeOptions {
  format: SummaryFormat;
  maxLength?: number;
}

/**
 * Options for Writer API draft generation
 */
export interface WriterOptions {
  tone: 'calm' | 'professional' | 'casual';
  length: 'short' | 'medium' | 'long';
}

/**
 * Result from proofreading operation
 */
export interface ProofreadResult {
  correctedText: string;
  corrections: {
    startIndex: number;
    endIndex: number;
    original: string;
  }[];
}

/**
 * Individual text change from proofreading
 */
export interface TextChange {
  original: string;
  corrected: string;
  type: 'grammar' | 'clarity' | 'spelling';
  position: { start: number; end: number };
}

/**
 * Language detection result
 */
export interface LanguageDetection {
  detectedLanguage: string;
  confidence: number;
  languageName: string;
}

/**
 * Options for translation operations
 */
export interface TranslateOptions {
  sourceLanguage?: string;
  targetLanguage: string;
}

/**
 * AI metadata stored with reflections
 */
export interface AIMetadata {
  summarizerUsed: boolean;
  writerUsed: boolean;
  rewriterUsed: boolean;
  proofreaderUsed: boolean;
  translatorUsed: boolean;
  promptFallback: boolean;
  processingTime: number;
}

/**
 * Usage statistics for AI operations
 */
export interface UsageStats {
  summarizations: number;
  drafts: number;
  rewrites: number;
  proofreads: number;
  translations: number;
  languageDetections: number;
  sessionStart: number;
}

/**
 * Performance statistics for AI operations
 */
export interface PerformanceStats {
  averageResponseTime: number;
  slowestOperation: {
    operationType: string;
    apiUsed: string;
    duration: number;
    timestamp: number;
  } | null;
  fastestOperation: {
    operationType: string;
    apiUsed: string;
    duration: number;
    timestamp: number;
  } | null;
  totalOperations: number;
  slowOperationsCount: number;
  operationsByType: Record<string, { count: number; averageDuration: number }>;
  operationsByAPI: Record<string, { count: number; averageDuration: number }>;
}

/**
 * Capability cache for storing API availability checks
 */
export interface CapabilityCache {
  capabilities: AICapabilities;
  lastChecked: number;
  ttl: number;
}
