/**
 * Messaging-related type definitions
 */

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
  | 'checkTranslationAvailability'
  | 'getStreak'
  | 'deleteReflection'
  | 'exportReflections'
  | 'openDashboardInActiveTab'
  | 'startReflectInActiveTab';

/**
 * Message structure for background worker communication
 */
export interface Message {
  type: MessageType;
  payload?: unknown;
}

/**
 * AI response structure using discriminated union for type safety
 */
export type AIResponse<T = unknown> =
  | { success: true; data: T; apiUsed: string; duration: number }
  | { success: false; error: string; apiUsed?: string; duration: number };

/**
 * Create a successful AIResponse
 */
export function createSuccessResponse<T>(
  data: T,
  apiUsed: string,
  duration: number
): AIResponse<T> {
  return { success: true, data, apiUsed, duration };
}

/**
 * Create a failed AIResponse
 */
export function createErrorResponse<T = never>(
  error: string,
  duration: number,
  apiUsed?: string
): AIResponse<T> {
  return { success: false, error, apiUsed, duration };
}
