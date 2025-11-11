/**
 * Type-safe message definitions for Chrome Extension communication
 * Provides compile-time type safety for message payloads and responses
 */

import type {
  MessageType,
  AIResponse,
  Settings,
  Reflection,
  ExtractedContent,
  SummarizeOptions,
  TranslateOptions,
  WriterOptions,
  AICapabilities,
  StreakData,
} from './index';

/**
 * Base message interface with type discrimination
 */
export interface BaseMessage<T extends MessageType> {
  type: T;
}

/**
 * Message payloads for each message type
 */
export interface MessagePayloads {
  checkAI: undefined;
  checkAllAI: undefined;
  getCapabilities: { refresh?: boolean; experimentalMode?: boolean } | undefined;
  summarize: { content: string; options?: SummarizeOptions };
  reflect: { summary: string[] };
  proofread: { text: string };
  write: { prompt: string; options?: WriterOptions };
  rewrite: { text: string; tone?: string };
  translate: { text: string; options: TranslateOptions };
  detectLanguage: { text: string };
  canTranslate: { sourceLanguage: string; targetLanguage: string };
  checkTranslationAvailability: { sourceLanguage: string; targetLanguage: string };
  save: { reflection: Reflection };
  load: { id?: string };
  getSettings: undefined;
  updateSettings: Settings;
  resetSettings: undefined;
  getUsageStats: undefined;
  getPerformanceStats: undefined;
  getStreak: undefined;
  deleteReflection: { id: string };
  exportReflections: { format?: 'json' | 'markdown' };
  openDashboardInActiveTab: undefined;
  startReflectInActiveTab: undefined;
}

/**
 * Typed message interface
 */
export interface TypedMessage<T extends MessageType = MessageType>
  extends BaseMessage<T> {
  payload?: MessagePayloads[T];
}

/**
 * Response types for each message type
 */
export interface MessageResponses {
  checkAI: AIResponse<boolean>;
  checkAllAI: AIResponse<AICapabilities>;
  getCapabilities: AIResponse<AICapabilities>;
  summarize: AIResponse<string[]>;
  reflect: AIResponse<string[]>;
  proofread: AIResponse<{ correctedText: string; corrections: unknown[] }>;
  write: AIResponse<string>;
  rewrite: AIResponse<string>;
  translate: AIResponse<string>;
  detectLanguage: AIResponse<{ detectedLanguage: string; confidence: number }>;
  canTranslate: AIResponse<boolean>;
  checkTranslationAvailability: AIResponse<boolean>;
  save: AIResponse<void>;
  load: AIResponse<Reflection | Reflection[]>;
  getSettings: AIResponse<Settings>;
  updateSettings: AIResponse<Settings>;
  resetSettings: AIResponse<Settings>;
  getUsageStats: AIResponse<unknown>;
  getPerformanceStats: AIResponse<unknown>;
  getStreak: AIResponse<StreakData>;
  deleteReflection: AIResponse<void>;
  exportReflections: AIResponse<string>;
  openDashboardInActiveTab: AIResponse<void>;
  startReflectInActiveTab: AIResponse<void>;
}

/**
 * Type helper to extract response type for a message
 */
export type MessageResponse<T extends MessageType> = MessageResponses[T];

/**
 * Type helper to extract payload type for a message
 */
export type MessagePayload<T extends MessageType> = MessagePayloads[T];
