/**
 * Core type definitions for Reflexa AI Chrome Extension
 */

// Re-export error types for convenience
export * from './errors';

/**
 * Voice input metadata for individual reflections
 */
export interface VoiceInputMetadata {
  isVoiceTranscribed: boolean;
  transcriptionLanguage?: string;
  transcriptionTimestamp?: number;
  wordCount?: number;
}

/**
 * Reflection data structure stored for each user reflection session
 */
export interface Reflection {
  id: string; // UUID v4
  url: string; // Full page URL
  title: string; // Page title
  createdAt: number; // Unix timestamp
  summary: string[]; // [Insight, Surprise, Apply]
  reflection: string[]; // User answers to prompts
  proofreadVersion?: string; // Optional proofread text
  tags?: string[]; // Optional user tags
  embedding?: number[]; // Optional 128-d vector
  // Chrome AI APIs integration fields
  summaryFormat?: SummaryFormat;
  detectedLanguage?: string;
  originalLanguage?: string;
  translatedTo?: string;
  toneUsed?: TonePreset;
  proofreadChanges?: TextChange[];
  aiMetadata?: AIMetadata;
  // Voice input metadata for each reflection field
  voiceMetadata?: VoiceInputMetadata[];
}

/**
 * User settings and preferences
 */
export interface Settings {
  dwellThreshold: number; // 30-300 seconds, default 60
  enableSound: boolean; // default true
  reduceMotion: boolean; // default false
  proofreadEnabled: boolean; // default false
  privacyMode: 'local' | 'sync'; // default 'local'
  // New AI API settings
  useNativeSummarizer: boolean; // Use Summarizer API instead of Prompt API
  useNativeProofreader: boolean; // Use Proofreader API instead of Prompt API
  translationEnabled: boolean; // Enable translation feature
  targetLanguage: string; // Target language code (e.g., 'en', 'es')
  // Chrome AI APIs integration settings
  defaultSummaryFormat: SummaryFormat;
  enableProofreading: boolean;
  enableTranslation: boolean;
  preferredTranslationLanguage: string;
  experimentalMode: boolean;
  autoDetectLanguage: boolean;
  // Voice input settings
  voiceInputEnabled?: boolean; // Enable/disable voice input (default true)
  voiceLanguage?: string; // Voice recognition language (default: browser language)
  voiceAutoStopDelay?: number; // Auto-stop delay in milliseconds (default 3000)
}

/**
 * Extracted content from a web page
 */
export interface ExtractedContent {
  title: string;
  text: string;
  url: string;
  wordCount: number;
}

/**
 * Page metadata for tracking and storage
 */
export interface PageMetadata {
  title: string;
  url: string;
  domain: string;
  timestamp: number;
}

/**
 * Calm statistics for dashboard visualization
 */
export interface CalmStats {
  totalReflections: number;
  averagePerDay: number;
  totalReadingTime: number;
  totalReflectionTime: number;
  reflectionRatio: number;
}

/**
 * Streak tracking data
 */
export interface StreakData {
  current: number;
  lastReflectionDate: string; // ISO date string
}

/**
 * Message types for chrome.runtime communication
 */
export type MessageType =
  | 'summarize'
  | 'reflect'
  | 'proofread'
  | 'save'
  | 'load'
  | 'getSettings'
  | 'updateSettings'
  | 'resetSettings'
  | 'checkAI'
  | 'checkAllAI'
  | 'getCapabilities'
  | 'translate'
  | 'rewrite'
  | 'write'
  | 'detectLanguage'
  | 'getUsageStats'
  | 'getPerformanceStats'
  | 'canTranslate'
  | 'checkTranslationAvailability';

/**
 * Message structure for background worker communication
 */
export interface Message {
  type: MessageType;
  payload?: unknown;
}

/**
 * AI response structure using discriminated union for type safety
 * Success response includes data, failure response includes error
 */
export type AIResponse<T = unknown> =
  | { success: true; data: T; apiUsed: string; duration: number }
  | { success: false; error: string; apiUsed?: string; duration: number };

/**
 * Chrome AI APIs Integration Types
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
 * Result from proofreading operation (application format)
 * This extends the Chrome API result with additional metadata
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
 * Individual text change from proofreading (legacy format)
 * Note: The Chrome API doesn't provide type categorization
 * This is kept for backward compatibility
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
  detectedLanguage: string; // ISO 639-1 code
  confidence: number; // 0-1
  languageName: string; // Human-readable name
}

/**
 * Options for translation operations
 */
export interface TranslateOptions {
  sourceLanguage?: string; // Auto-detect if not provided
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
  operationsByType: Record<
    string,
    {
      count: number;
      averageDuration: number;
    }
  >;
  operationsByAPI: Record<
    string,
    {
      count: number;
      averageDuration: number;
    }
  >;
}

/**
 * Capability cache for storing API availability checks
 */
export interface CapabilityCache {
  capabilities: AICapabilities;
  lastChecked: number;
  ttl: number; // Time to live in milliseconds
}

/**
 * Helper functions for creating AIResponse objects
 */

/**
 * Create a successful AIResponse
 */
export function createSuccessResponse<T>(
  data: T,
  apiUsed: string,
  duration: number
): AIResponse<T> {
  return {
    success: true,
    data,
    apiUsed,
    duration,
  };
}

/**
 * Create a failed AIResponse
 */
export function createErrorResponse<T = never>(
  error: string,
  duration: number,
  apiUsed?: string
): AIResponse<T> {
  return {
    success: false,
    error,
    apiUsed,
    duration,
  };
}
