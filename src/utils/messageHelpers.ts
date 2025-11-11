/**
 * Type-safe message helpers for Chrome Extension communication
 * Provides utilities for sending messages with proper type checking
 */

import type { Message, MessageType, AIResponse } from '../types';
import { devError } from './logger';

/**
 * Type-safe message sender
 * @param type Message type
 * @param payload Optional message payload
 * @returns Promise resolving to AIResponse
 */
export async function sendMessage<T = unknown>(
  type: MessageType,
  payload?: unknown
): Promise<AIResponse<T>> {
  try {
    const response = await chrome.runtime.sendMessage({
      type,
      payload,
    } as Message);

    // Validate response structure
    if (
      response &&
      typeof response === 'object' &&
      'success' in response &&
      'duration' in response
    ) {
      return response as AIResponse<T>;
    }

    // Invalid response structure
    return {
      success: false,
      error: 'Invalid response format from background service worker',
      duration: 0,
    };
  } catch (error) {
    devError(`Failed to send message '${type}':`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: 0,
    };
  }
}

/**
 * Type guard to check if response is successful
 * @param response AIResponse to check
 * @returns True if response is successful
 */
export function isSuccessResponse<T>(
  response: AIResponse<T>
): response is { success: true; data: T; apiUsed: string; duration: number } {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 * @param response AIResponse to check
 * @returns True if response is an error
 */
export function isErrorResponse<T>(
  response: AIResponse<T>
): response is { success: false; error: string; apiUsed?: string; duration: number } {
  return response.success === false;
}

/**
 * Extract data from successful response, or throw error
 * @param response AIResponse to extract data from
 * @returns Data from successful response
 * @throws Error if response is not successful
 */
export function extractDataOrThrow<T>(response: AIResponse<T>): T {
  if (isSuccessResponse(response)) {
    return response.data;
  }
  throw new Error(response.error);
}
