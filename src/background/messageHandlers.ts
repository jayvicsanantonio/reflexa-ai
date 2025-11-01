/**
 * Message handlers for all Gemini Nano APIs
 * Handles chrome.runtime.onMessage events
 */

import { unifiedAI } from './unifiedAIService';
import type {
  Message,
  AIResponse,
  TonePreset,
  ProofreadResult,
} from '../types';
import { createSuccessResponse, createErrorResponse } from '../types';

/**
 * Handle incoming messages from content scripts and popup
 */
export async function handleMessage(
  message: Message,
  _sender: chrome.runtime.MessageSender
): Promise<AIResponse> {
  console.log('[Background] Received message:', message.type);

  try {
    switch (message.type) {
      // Existing Prompt API handlers
      case 'summarize':
        return await handleSummarize(message.payload as { content: string });

      case 'reflect':
        return await handleReflect(message.payload as { summary: string[] });

      case 'proofread':
        return await handleProofread(message.payload as { text: string });

      // New API handlers
      case 'translate':
        return await handleTranslate(
          message.payload as {
            text: string;
            source: string;
            target: string;
          }
        );

      case 'rewrite':
        return await handleRewrite(
          message.payload as {
            text: string;
            options?: {
              tone?: 'as-is' | 'more-formal' | 'more-casual';
              format?: 'as-is' | 'plain-text' | 'markdown';
              length?: 'as-is' | 'shorter' | 'longer';
            };
          }
        );

      case 'write':
        return await handleWrite(
          message.payload as {
            prompt: string;
            options?: {
              tone?: 'formal' | 'neutral' | 'casual';
              format?: 'plain-text' | 'markdown';
              length?: 'short' | 'medium' | 'long';
            };
          }
        );

      case 'checkAI':
        return await handleCheckAI();

      case 'checkAllAI':
        return await handleCheckAllAI();

      default:
        return createErrorResponse(`Unknown message type: ${message.type}`, 0);
    }
  } catch (error) {
    console.error('[Background] Error handling message:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Unknown error',
      0
    );
  }
}

/**
 * Handle summarize request (existing)
 */
async function handleSummarize(payload: {
  content: string;
}): Promise<AIResponse<string[]>> {
  const startTime = Date.now();
  try {
    const summary = await unifiedAI.prompt.summarize(payload.content);

    if (summary.length === 0) {
      return createErrorResponse(
        'Failed to generate summary',
        Date.now() - startTime,
        'prompt'
      );
    }

    return createSuccessResponse(summary, 'prompt', Date.now() - startTime);
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Summarization failed',
      Date.now() - startTime,
      'prompt'
    );
  }
}

/**
 * Handle reflection prompt generation (existing)
 */
async function handleReflect(payload: {
  summary: string[];
}): Promise<AIResponse<string[]>> {
  const startTime = Date.now();
  try {
    const questions = await unifiedAI.prompt.generateReflectionPrompts(
      payload.summary
    );

    if (questions.length === 0) {
      return createErrorResponse(
        'Failed to generate reflection prompts',
        Date.now() - startTime,
        'prompt'
      );
    }

    return createSuccessResponse(questions, 'prompt', Date.now() - startTime);
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Reflection generation failed',
      Date.now() - startTime,
      'prompt'
    );
  }
}

/**
 * Handle proofread request
 * Uses native Proofreader API if available, falls back to Prompt API
 */
async function handleProofread(payload: {
  text: string;
}): Promise<AIResponse<ProofreadResult>> {
  const startTime = Date.now();
  try {
    // Try native Proofreader API first
    const proofreaderAvailable =
      await unifiedAI.proofreader.checkAvailability();

    let result: ProofreadResult;
    let apiUsed: string;

    if (proofreaderAvailable) {
      console.log('[Background] Using native Proofreader API');
      result = await unifiedAI.proofreader.proofread(payload.text);
      apiUsed = 'proofreader';
    } else {
      console.log('[Background] Falling back to Prompt API for proofreading');
      const correctedText = await unifiedAI.prompt.proofread(payload.text);
      // Prompt API returns just the corrected text, so we create a ProofreadResult
      result = {
        correctedText,
        corrections: [], // Prompt API doesn't provide detailed corrections
      };
      apiUsed = 'prompt';
    }

    return createSuccessResponse(result, apiUsed, Date.now() - startTime);
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Proofreading failed',
      Date.now() - startTime,
      'proofreader'
    );
  }
}

/**
 * Handle translation request
 */
async function handleTranslate(payload: {
  text: string;
  source: string;
  target: string;
}): Promise<AIResponse<string>> {
  const startTime = Date.now();
  try {
    const available = await unifiedAI.translator.canTranslate(
      payload.source,
      payload.target
    );

    if (!available) {
      return createErrorResponse(
        `Translation not available for ${payload.source} -> ${payload.target}`,
        Date.now() - startTime,
        'translator'
      );
    }

    const result = await unifiedAI.translator.translate(
      payload.text,
      payload.target,
      payload.source
    );

    return createSuccessResponse(result, 'translator', Date.now() - startTime);
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Translation failed',
      Date.now() - startTime,
      'translator'
    );
  }
}

/**
 * Handle rewrite request
 */
async function handleRewrite(payload: {
  text: string;
  preset?: TonePreset;
  context?: string;
}): Promise<AIResponse<{ original: string; rewritten: string }>> {
  const startTime = Date.now();
  try {
    const available = await unifiedAI.rewriter.checkAvailability();

    if (!available) {
      return createErrorResponse(
        'Rewriter API not available',
        Date.now() - startTime,
        'rewriter'
      );
    }

    // Default to 'calm' preset if not specified
    const preset = payload.preset ?? 'calm';

    const result = await unifiedAI.rewriter.rewrite(
      payload.text,
      preset,
      payload.context
    );

    return createSuccessResponse(result, 'rewriter', Date.now() - startTime);
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Rewriting failed',
      Date.now() - startTime,
      'rewriter'
    );
  }
}

/**
 * Handle write request
 */
async function handleWrite(payload: {
  prompt: string;
  options?: {
    tone?: 'formal' | 'neutral' | 'casual';
    format?: 'plain-text' | 'markdown';
    length?: 'short' | 'medium' | 'long';
  };
}): Promise<AIResponse<string>> {
  const startTime = Date.now();
  try {
    const available = await unifiedAI.writer.checkAvailability();

    if (!available) {
      return createErrorResponse(
        'Writer API not available',
        Date.now() - startTime,
        'writer'
      );
    }

    const result = await unifiedAI.writer.write(
      payload.prompt,
      payload.options
    );

    return createSuccessResponse(result, 'writer', Date.now() - startTime);
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Writing failed',
      Date.now() - startTime,
      'writer'
    );
  }
}

/**
 * Handle AI availability check (existing - Prompt API only)
 */
async function handleCheckAI(): Promise<AIResponse<boolean>> {
  const startTime = Date.now();
  try {
    const available = await unifiedAI.prompt.checkAvailability();
    return createSuccessResponse(available, 'prompt', Date.now() - startTime);
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Availability check failed',
      Date.now() - startTime,
      'prompt'
    );
  }
}

/**
 * Handle all AI APIs availability check
 */
async function handleCheckAllAI(): Promise<
  AIResponse<{
    prompt: boolean;
    proofreader: boolean;
    summarizer: boolean;
    translator: boolean;
    writer: boolean;
    rewriter: boolean;
  }>
> {
  const startTime = Date.now();
  try {
    const availability = await unifiedAI.checkAllAvailability();
    return createSuccessResponse(
      availability,
      'unified',
      Date.now() - startTime
    );
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Availability check failed',
      Date.now() - startTime,
      'unified'
    );
  }
}
