import { useCallback } from 'react';
import type { Message, AIResponse } from '../../types';

/**
 * Hook for sending messages to the background service worker
 * Provides type-safe messaging with error handling
 */
export function useChromeMessage() {
  const sendMessage = useCallback(
    async <T = unknown>(message: Message): Promise<AIResponse<T>> => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const response = await chrome.runtime.sendMessage(message);

        if (!response || typeof response !== 'object') {
          return {
            success: false,
            error: 'No response from background script',
            duration: 0,
          };
        }

        // Type guard for AIResponse
        if ('success' in response) {
          return response as AIResponse<T>;
        }

        return {
          success: false,
          error: 'Invalid response format',
          duration: 0,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to send message to background script';

        return {
          success: false,
          error: errorMessage,
          duration: 0,
        };
      }
    },
    []
  );

  return { sendMessage };
}
