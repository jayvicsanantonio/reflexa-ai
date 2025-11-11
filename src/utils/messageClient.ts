/**
 * Type-safe message passing client for Chrome Extension communication
 * Provides a type-safe wrapper around chrome.runtime.sendMessage
 */

import type { Message, MessageType, AIResponse } from '../types';
import { devError } from './logger';

/**
 * Type-safe message sender that infers response types based on message type
 */
export async function sendMessage<T extends MessageType>(
  type: T,
  payload?: Message['payload']
): Promise<AIResponse> {
  try {
    const response = await chrome.runtime.sendMessage({
      type,
      payload,
    } as Message);

    if (!response || typeof response !== 'object') {
      return {
        success: false,
        error: 'Invalid response format',
        duration: 0,
      };
    }

    return response as AIResponse;
  } catch (error) {
    devError(`Failed to send message ${type}:`, error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to communicate with extension',
      duration: 0,
    };
  }
}

/**
 * Type-safe message sender with typed response data
 */
export async function sendMessageTyped<T>(
  type: MessageType,
  payload?: Message['payload']
): Promise<AIResponse<T>> {
  return sendMessage(type, payload) as Promise<AIResponse<T>>;
}
