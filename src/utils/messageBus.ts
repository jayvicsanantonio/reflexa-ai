/**
 * Message bus for secure communication with service worker
 * Handles message validation and error handling
 */

import type { AIResponse, Message } from '../types';
import { devError } from './logger';

/**
 * Validate if a response looks like an AIResponse
 * Ensures the response has the expected structure
 *
 * @param response Unknown response to validate
 * @returns true if response has AIResponse structure
 */
function isValidAIResponse(response: unknown): response is AIResponse {
  if (!response || typeof response !== 'object') {
    return false;
  }

  const obj = response as Record<string, unknown>;
  return (
    typeof obj.success === 'boolean' &&
    typeof obj.duration === 'number' &&
    (obj.success ? 'data' in obj : 'error' in obj)
  );
}

/**
 * Send a message to the background service worker
 * Automatically handles error conversion and type validation
 *
 * @param message Message to send
 * @returns Promise resolving to AIResponse
 */
export function sendMessage<T>(message: Message): Promise<AIResponse<T>> {
  return new Promise((resolve) => {
    void chrome.runtime
      .sendMessage(message)
      .then((response: unknown) => {
        // Validate response structure
        if (isValidAIResponse(response)) {
          resolve(response as AIResponse<T>);
        } else {
          devError('Received invalid AIResponse structure:', response);
          resolve({
            success: false,
            error: 'Invalid response format from service worker',
            duration: 0,
          } as AIResponse<T>);
        }
      })
      .catch((error: unknown) => {
        devError('Failed to send message:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        resolve({
          success: false,
          error: errorMessage,
          duration: 0,
        } as AIResponse<T>);
      });
  });
}
