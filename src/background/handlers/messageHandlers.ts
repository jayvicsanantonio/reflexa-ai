/**
 * Message handlers for all Gemini Nano APIs
 * Handles chrome.runtime.onMessage events
 */

import { aiService } from '../services/ai';
import type {
  Message,
  AIResponse,
  TonePreset,
  ProofreadResult,
} from '../../types';
import { createSuccessResponse, createErrorResponse } from '../../types';
import { rateLimiter } from '../services/ai/rateLimiter';
import { getUserFriendlyMessage, AIError } from '../services/ai/errorHandler';

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

      case 'getUsageStats':
        return handleGetUsageStats();

      case 'canTranslate':
        return await handleCanTranslate(
          message.payload as {
            source: string;
            target: string;
          }
        );

      case 'checkTranslationAvailability':
        return await handleCheckTranslationAvailability(
          message.payload as {
            source: string;
            targets: string[];
          }
        );

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
    // Execute with rate limiting and retry logic
    const summary = await rateLimiter.executeWithRetry(
      () => aiService.prompt.summarize(payload.content),
      'summarizations'
    );

    if (summary.length === 0) {
      return createErrorResponse(
        'Failed to generate summary',
        Date.now() - startTime,
        'prompt'
      );
    }

    return createSuccessResponse(summary, 'prompt', Date.now() - startTime);
  } catch (error) {
    const message =
      error instanceof AIError ? error.message : getUserFriendlyMessage(error);
    return createErrorResponse(message, Date.now() - startTime, 'prompt');
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
    // Execute with rate limiting and retry logic
    const questions = await rateLimiter.executeWithRetry(
      () => aiService.prompt.generateReflectionPrompts(payload.summary),
      'drafts'
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
    const message =
      error instanceof AIError ? error.message : getUserFriendlyMessage(error);
    return createErrorResponse(message, Date.now() - startTime, 'prompt');
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
      await aiService.proofreader.checkAvailability();

    let result: ProofreadResult;
    let apiUsed: string;

    if (proofreaderAvailable) {
      console.log('[Background] Using native Proofreader API');
      // Execute with rate limiting and retry logic
      result = await rateLimiter.executeWithRetry(
        () => aiService.proofreader.proofread(payload.text),
        'proofreads'
      );
      apiUsed = 'proofreader';
    } else {
      console.log('[Background] Falling back to Prompt API for proofreading');
      // Execute with rate limiting and retry logic
      const correctedText = await rateLimiter.executeWithRetry(
        () => aiService.prompt.proofread(payload.text),
        'proofreads'
      );
      // Prompt API returns just the corrected text, so we create a ProofreadResult
      result = {
        correctedText,
        corrections: [], // Prompt API doesn't provide detailed corrections
      };
      apiUsed = 'prompt';
    }

    return createSuccessResponse(result, apiUsed, Date.now() - startTime);
  } catch (error) {
    const message =
      error instanceof AIError ? error.message : getUserFriendlyMessage(error);
    return createErrorResponse(message, Date.now() - startTime, 'proofreader');
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
    const available = await aiService.translator.canTranslate(
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

    // Execute with rate limiting and retry logic
    const result = await rateLimiter.executeWithRetry(
      () =>
        aiService.translator.translate(
          payload.text,
          payload.target,
          payload.source
        ),
      'translations'
    );

    return createSuccessResponse(result, 'translator', Date.now() - startTime);
  } catch (error) {
    const message =
      error instanceof AIError ? error.message : getUserFriendlyMessage(error);
    return createErrorResponse(message, Date.now() - startTime, 'translator');
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
    const available = await aiService.rewriter.checkAvailability();

    if (!available) {
      return createErrorResponse(
        'Rewriter API not available',
        Date.now() - startTime,
        'rewriter'
      );
    }

    // Default to 'calm' preset if not specified
    const preset = payload.preset ?? 'calm';

    // Execute with rate limiting and retry logic
    const result = await rateLimiter.executeWithRetry(
      () => aiService.rewriter.rewrite(payload.text, preset, payload.context),
      'rewrites'
    );

    return createSuccessResponse(result, 'rewriter', Date.now() - startTime);
  } catch (error) {
    const message =
      error instanceof AIError ? error.message : getUserFriendlyMessage(error);
    return createErrorResponse(message, Date.now() - startTime, 'rewriter');
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
    const available = await aiService.writer.checkAvailability();

    if (!available) {
      return createErrorResponse(
        'Writer API not available',
        Date.now() - startTime,
        'writer'
      );
    }

    // Execute with rate limiting and retry logic
    const result = await rateLimiter.executeWithRetry(
      () => aiService.writer.write(payload.prompt, payload.options),
      'drafts'
    );

    return createSuccessResponse(result, 'writer', Date.now() - startTime);
  } catch (error) {
    const message =
      error instanceof AIError ? error.message : getUserFriendlyMessage(error);
    return createErrorResponse(message, Date.now() - startTime, 'writer');
  }
}

/**
 * Handle AI availability check (existing - Prompt API only)
 */
async function handleCheckAI(): Promise<AIResponse<boolean>> {
  const startTime = Date.now();
  try {
    const available = await aiService.prompt.checkAvailability();
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
    const availability = await aiService.checkAllAvailability();
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

/**
 * Handle usage statistics request
 */
function handleGetUsageStats(): AIResponse<{
  stats: {
    summarizations: number;
    drafts: number;
    rewrites: number;
    proofreads: number;
    translations: number;
    languageDetections: number;
    sessionStart: number;
    totalOperations: number;
  };
  approachingQuota: boolean;
}> {
  const startTime = Date.now();
  try {
    const stats = rateLimiter.getUsageStats();
    const totalOperations = rateLimiter.getTotalOperations();
    const approachingQuota = rateLimiter.isApproachingQuota();

    return createSuccessResponse(
      {
        stats: {
          ...stats,
          totalOperations,
        },
        approachingQuota,
      },
      'unified',
      Date.now() - startTime
    );
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to get usage stats',
      Date.now() - startTime,
      'unified'
    );
  }
}

/**
 * Handle canTranslate check for a specific language pair
 */
async function handleCanTranslate(payload: {
  source: string;
  target: string;
}): Promise<AIResponse<boolean>> {
  const startTime = Date.now();
  try {
    const available = await aiService.translator.canTranslate(
      payload.source,
      payload.target
    );

    return createSuccessResponse(
      available,
      'translator',
      Date.now() - startTime
    );
  } catch (error) {
    return createErrorResponse(
      error instanceof Error
        ? error.message
        : 'Failed to check translation availability',
      Date.now() - startTime,
      'translator'
    );
  }
}

/**
 * Handle batch translation availability check
 * Checks multiple target languages at once
 */
async function handleCheckTranslationAvailability(payload: {
  source: string;
  targets: string[];
}): Promise<
  AIResponse<{
    source: string;
    available: string[];
    unavailable: string[];
  }>
> {
  const startTime = Date.now();
  try {
    const available: string[] = [];
    const unavailable: string[] = [];

    // Check each target language
    for (const target of payload.targets) {
      const canTranslate = await aiService.translator.canTranslate(
        payload.source,
        target
      );

      if (canTranslate) {
        available.push(target);
      } else {
        unavailable.push(target);
      }
    }

    return createSuccessResponse(
      {
        source: payload.source,
        available,
        unavailable,
      },
      'translator',
      Date.now() - startTime
    );
  } catch (error) {
    return createErrorResponse(
      error instanceof Error
        ? error.message
        : 'Failed to check translation availability',
      Date.now() - startTime,
      'translator'
    );
  }
}
