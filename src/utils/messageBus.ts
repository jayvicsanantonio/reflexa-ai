/**
 * Unified Message Bus for Chrome Extension Communication
 * Handles both simple messages and streaming AI operations
 */

import type { AIResponse, Message } from '../types';
import { devError, devWarn } from './logger';

/**
 * Send a message to the background script
 */
export function sendMessage<T>(message: Message): Promise<AIResponse<T>> {
  return new Promise((resolve) => {
    chrome.runtime
      .sendMessage(message)
      .then((response: unknown) => {
        resolve(response as AIResponse<T>);
      })
      .catch((error) => {
        devError('Failed to send message:', error);
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: 0,
        } as AIResponse<T>);
      });
  });
}

/**
 * Alias for sendMessage (backward compatibility)
 */
export const sendMessageToBackground = sendMessage;

/**
 * Handlers for AI streaming operations
 */
export interface AIStreamHandlers {
  onChunk?: (chunk: string) => void;
  onComplete?: (finalData?: string) => void;
  onError?: (error: string) => void;
}

/**
 * Start an AI streaming operation via Chrome port
 */
export function startAIStream(
  type: string,
  payload: unknown,
  handlers: AIStreamHandlers
): { requestId: string; cancel: () => void } {
  const port = chrome.runtime.connect({ name: 'ai-stream' });
  const requestId = `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let closed = false;

  const cleanup = () => {
    if (closed) return;
    closed = true;
    try {
      port.disconnect();
    } catch (disconnectError) {
      devWarn('AI stream disconnect warning:', disconnectError);
    }
  };

  port.onDisconnect.addListener(() => {
    if (closed) return;
    closed = true;
    handlers.onError?.('Stream disconnected');
  });

  port.onMessage.addListener((rawMessage) => {
    if (!rawMessage || typeof rawMessage !== 'object') return;

    const message = rawMessage as {
      requestId?: string;
      event?: string;
      data?: unknown;
      error?: unknown;
    };

    if (message.requestId !== requestId) return;

    switch (message.event) {
      case 'chunk':
        handlers.onChunk?.(
          typeof message.data === 'string' ? message.data : ''
        );
        break;
      case 'complete':
        handlers.onComplete?.(
          typeof message.data === 'string' ? message.data : undefined
        );
        cleanup();
        break;
      case 'error': {
        const errorMessage =
          typeof message.error === 'string'
            ? message.error
            : 'Unknown streaming error';
        handlers.onError?.(errorMessage);
        cleanup();
        break;
      }
      default:
        break;
    }
  });

  try {
    port.postMessage({ type, requestId, payload });
  } catch (error) {
    cleanup();
    handlers.onError?.(
      error instanceof Error ? error.message : 'Failed to start stream'
    );
  }

  return { requestId, cancel: cleanup };
}
