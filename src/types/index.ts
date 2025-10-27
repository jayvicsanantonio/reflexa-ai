/**
 * Core type definitions for Reflexa AI Chrome Extension
 */

// Re-export error types for convenience
export * from './errors';

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
  | 'checkAI';

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
  | { success: true; data: T }
  | { success: false; error: string };
