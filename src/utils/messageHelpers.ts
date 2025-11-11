/**
 * Helper utilities for type-safe message passing
 */

import type { Message, AIResponse } from '../types';
import { createErrorResponse } from '../types';
import { ERROR_MESSAGES } from '../constants';
import { devError } from './logger';

/**
 * Type-safe wrapper for sending messages to the background script
 * @param message The message to send
 * @returns Promise resolving to the response
 */
export async function sendMessage<T = unknown>(
  message: Message
): Promise<AIResponse<T>> {
  try {
    const response = await chrome.runtime.sendMessage(message);
    return response as AIResponse<T>;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR;
    devError('Failed to send message:', error);
    return createErrorResponse(errorMessage, 0);
  }
}

/**
 * Type guard to check if a response is successful
 */
export function isSuccessResponse<T>(
  response: AIResponse<T>
): response is Extract<AIResponse<T>, { success: true }> {
  return response.success === true;
}

/**
 * Type guard to check if a response is an error
 */
export function isErrorResponse<T>(
  response: AIResponse<T>
): response is Extract<AIResponse<T>, { success: false }> {
  return response.success === false;
}

/**
 * Extract data from a successful response, or throw if error
 */
export function extractResponseData<T>(response: AIResponse<T>): T {
  if (isSuccessResponse(response)) {
    return response.data;
  }
  throw new Error(response.error);
}
