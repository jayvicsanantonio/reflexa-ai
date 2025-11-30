/**
 * Streaming handlers for AI operations
 * Handles real-time streaming of AI responses via chrome.runtime.Port
 */

import { aiService } from '../../services/ai/aiService';
import { settingsManager } from '../utils/shared';
import type { SummaryFormat, WriterOptions } from '../../../types';
import { ERROR_MESSAGES } from '../../../constants';
import { devLog, devWarn, devError } from '../../../utils/logger';

/**
 * Safe post message to streaming port with disconnection check
 */
export function safePostStreamMessage(
  port: chrome.runtime.Port,
  isDisconnected: () => boolean,
  message: Record<string, unknown>
): void {
  if (isDisconnected()) return;
  try {
    port.postMessage(message);
  } catch (error) {
    devWarn('Failed to post stream message:', error);
  }
}

/**
 * Handle summarize streaming request
 */
export async function handleSummarizeStreamRequest(
  port: chrome.runtime.Port,
  requestId: string,
  payload: unknown,
  isDisconnected: () => boolean
): Promise<void> {
  if (!payload || typeof payload !== 'object') {
    safePostStreamMessage(port, isDisconnected, {
      event: 'error',
      requestId,
      error: 'Invalid summarize payload',
    });
    return;
  }

  const { content, format, detectedLanguage } = payload as {
    content?: unknown;
    format?: unknown;
    detectedLanguage?: unknown;
  };

  if (typeof content !== 'string' || !content.trim()) {
    safePostStreamMessage(port, isDisconnected, {
      event: 'error',
      requestId,
      error: 'Empty content for summarization',
    });
    return;
  }

  if (typeof format !== 'string') {
    safePostStreamMessage(port, isDisconnected, {
      event: 'error',
      requestId,
      error: 'Missing summary format',
    });
    return;
  }

  try {
    devLog('[Stream] Starting summarization stream for requestId:', requestId);
    const settings = await settingsManager.getSettings();
    const translationEnabled =
      settings.enableTranslation ?? settings.translationEnabled;
    // Only use preferred language if translation is enabled
    const outputLanguage = translationEnabled
      ? (settings.preferredTranslationLanguage ?? settings.targetLanguage)
      : typeof detectedLanguage === 'string'
        ? detectedLanguage
        : undefined;

    const expectedLanguages =
      typeof detectedLanguage === 'string' ? [detectedLanguage] : undefined;

    devLog('[Stream] Calling aiService.summarizer.summarizeStreaming');
    const aggregate = await aiService.summarizer.summarizeStreaming(
      content,
      format as SummaryFormat,
      outputLanguage,
      {
        expectedInputLanguages: expectedLanguages,
        expectedContextLanguages: expectedLanguages,
      },
      (chunk) => {
        devLog('[Stream] Received chunk, length:', chunk.length);
        safePostStreamMessage(port, isDisconnected, {
          event: 'chunk',
          requestId,
          data: chunk,
        });
      }
    );

    devLog(
      '[Stream] Summarization complete, aggregate length:',
      aggregate.length
    );
    safePostStreamMessage(port, isDisconnected, {
      event: 'complete',
      requestId,
      data: aggregate,
    });
  } catch (error) {
    devError('[Stream] Error in summarize stream:', error);

    // Try fallback to non-streaming Prompt API
    devError('[Stream] Attempting fallback to non-streaming Prompt API...');
    try {
      const { handleSummarize } = await import('../ai/aiHandlers');
      const fallbackResult = await handleSummarize(payload);

      if (fallbackResult.success && fallbackResult.data) {
        devError(
          '[Stream] Fallback successful, sending result as single chunk'
        );
        // Send the result as a single chunk to simulate streaming
        const resultText = fallbackResult.data.join('\n');
        safePostStreamMessage(port, isDisconnected, {
          event: 'chunk',
          requestId,
          data: resultText,
        });
        safePostStreamMessage(port, isDisconnected, {
          event: 'complete',
          requestId,
          data: resultText,
        });
        return;
      }
    } catch (fallbackError) {
      devError('[Stream] Fallback also failed:', fallbackError);
    }

    // If fallback fails, send error
    const errorMessage =
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR;
    devError('[Stream] Sending error message to client:', errorMessage);
    safePostStreamMessage(port, isDisconnected, {
      event: 'error',
      requestId,
      error: errorMessage,
    });
    devError('[Stream] Error message sent');
  }
}

/**
 * Handle writer streaming request
 */
export async function handleWriterStreamRequest(
  port: chrome.runtime.Port,
  requestId: string,
  payload: unknown,
  isDisconnected: () => boolean
): Promise<void> {
  if (!payload || typeof payload !== 'object') {
    safePostStreamMessage(port, isDisconnected, {
      event: 'error',
      requestId,
      error: 'Invalid writer payload',
    });
    return;
  }

  const { prompt, options, context } = payload as {
    prompt?: unknown;
    options?: {
      tone?: 'formal' | 'neutral' | 'casual';
      length?: 'short' | 'medium' | 'long';
    };
    context?: unknown;
  };

  if (typeof prompt !== 'string' || !prompt.trim()) {
    safePostStreamMessage(port, isDisconnected, {
      event: 'error',
      requestId,
      error: 'Empty prompt for writer stream',
    });
    return;
  }

  const writerOptions: WriterOptions = {
    tone:
      options?.tone === 'formal'
        ? 'professional'
        : options?.tone === 'casual'
          ? 'casual'
          : 'calm',
    length: options?.length ?? 'medium',
  };

  const contextString = typeof context === 'string' ? context : undefined;

  try {
    const settings = await settingsManager.getSettings();
    const translationEnabled =
      settings.enableTranslation ?? settings.translationEnabled;
    const outputLanguage = translationEnabled
      ? (settings.preferredTranslationLanguage ?? settings.targetLanguage)
      : undefined;
    const expectedLanguages = outputLanguage
      ? [outputLanguage]
      : settings.preferredTranslationLanguage
        ? [settings.preferredTranslationLanguage]
        : undefined;

    const result = await aiService.writer.generateStreaming(
      prompt,
      writerOptions,
      contextString,
      (chunk) => {
        safePostStreamMessage(port, isDisconnected, {
          event: 'chunk',
          requestId,
          data: chunk,
        });
      },
      outputLanguage,
      {
        expectedInputLanguages: expectedLanguages,
        expectedContextLanguages: expectedLanguages,
      }
    );

    safePostStreamMessage(port, isDisconnected, {
      event: 'complete',
      requestId,
      data: result,
    });
  } catch (error) {
    devError('Error in writer stream:', error);
    safePostStreamMessage(port, isDisconnected, {
      event: 'error',
      requestId,
      error:
        error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
    });
  }
}
