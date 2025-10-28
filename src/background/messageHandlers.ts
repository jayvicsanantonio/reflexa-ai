/**
 * Message handlers for all Gemini Nano APIs
 * Handles chrome.runtime.onMessage events
 */

import { unifiedAI } from './unifiedAIService';
import type { Message, AIResponse } from '../types';

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
        return {
          success: false,
          error: `Unknown message type: ${message.type}`,
        };
    }
  } catch (error) {
    console.error('[Background] Error handling message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle summarize request (existing)
 */
async function handleSummarize(payload: {
  content: string;
}): Promise<AIResponse<string[]>> {
  try {
    const summary = await unifiedAI.prompt.summarize(payload.content);

    if (summary.length === 0) {
      return {
        success: false,
        error: 'Failed to generate summary',
      };
    }

    return {
      success: true,
      data: summary,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Summarization failed',
    };
  }
}

/**
 * Handle reflection prompt generation (existing)
 */
async function handleReflect(payload: {
  summary: string[];
}): Promise<AIResponse<string[]>> {
  try {
    const questions = await unifiedAI.prompt.generateReflectionPrompts(
      payload.summary
    );

    if (questions.length === 0) {
      return {
        success: false,
        error: 'Failed to generate reflection prompts',
      };
    }

    return {
      success: true,
      data: questions,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Reflection generation failed',
    };
  }
}

/**
 * Handle proofread request
 * Uses native Proofreader API if available, falls back to Prompt API
 */
async function handleProofread(payload: {
  text: string;
}): Promise<AIResponse<string>> {
  try {
    // Try native Proofreader API first
    const proofreaderAvailable =
      await unifiedAI.proofreader.checkAvailability();

    let result: string;

    if (proofreaderAvailable) {
      console.log('[Background] Using native Proofreader API');
      result = await unifiedAI.proofreader.proofread(payload.text);
    } else {
      console.log('[Background] Falling back to Prompt API for proofreading');
      result = await unifiedAI.prompt.proofread(payload.text);
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Proofreading failed',
    };
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
  try {
    const available = await unifiedAI.translator.checkAvailability(
      payload.source,
      payload.target
    );

    if (!available) {
      return {
        success: false,
        error: `Translation not available for ${payload.source} -> ${payload.target}`,
      };
    }

    const result = await unifiedAI.translator.translate(
      payload.text,
      payload.source,
      payload.target
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Translation failed',
    };
  }
}

/**
 * Handle rewrite request
 */
async function handleRewrite(payload: {
  text: string;
  options?: {
    tone?: 'as-is' | 'more-formal' | 'more-casual';
    format?: 'as-is' | 'plain-text' | 'markdown';
    length?: 'as-is' | 'shorter' | 'longer';
  };
}): Promise<AIResponse<string>> {
  try {
    const available = await unifiedAI.rewriter.checkAvailability();

    if (!available) {
      return {
        success: false,
        error: 'Rewriter API not available',
      };
    }

    const result = await unifiedAI.rewriter.rewrite(
      payload.text,
      payload.options
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Rewriting failed',
    };
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
  try {
    const available = await unifiedAI.writer.checkAvailability();

    if (!available) {
      return {
        success: false,
        error: 'Writer API not available',
      };
    }

    const result = await unifiedAI.writer.write(
      payload.prompt,
      payload.options
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Writing failed',
    };
  }
}

/**
 * Handle AI availability check (existing - Prompt API only)
 */
async function handleCheckAI(): Promise<AIResponse<boolean>> {
  try {
    const available = await unifiedAI.prompt.checkAvailability();
    return {
      success: true,
      data: available,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Availability check failed',
    };
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
  try {
    const availability = await unifiedAI.checkAllAvailability();
    return {
      success: true,
      data: availability,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Availability check failed',
    };
  }
}
