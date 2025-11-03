/**
 * AI operation handlers
 * Handles all AI-related operations: summarize, write, rewrite, proofread, translate, detectLanguage, reflect
 */

import { aiService } from '../../services/ai/aiService';
import { rateLimiter } from '../../services/ai/rateLimiter';
import { performanceMonitor } from '../../services/ai/performanceMonitor';
import {
  ensureAIAvailable,
  getSettings,
  getOutputLanguage,
  getExpectedLanguages,
  createHandlerErrorResponse,
} from '../utils/shared';
import { createSuccessResponse, createErrorResponse } from '../../../types';
import type {
  AIResponse,
  SummaryFormat,
  TonePreset,
  ProofreadResult,
  LanguageDetection,
  WriterOptions,
} from '../../../types';
import { ERROR_MESSAGES } from '../../../constants';
import { devLog, devWarn, devError } from '../../../utils/logger';

/**
 * Handle summarization request
 */
export async function handleSummarize(
  payload: unknown
): Promise<AIResponse<string[]>> {
  const startTime = Date.now();

  try {
    // Validate payload - support both string and object formats
    let content: string;
    let format: SummaryFormat = 'bullets';
    let detectedLanguage: string | undefined;
    let outputLanguageOverride: string | undefined;

    if (typeof payload === 'string') {
      content = payload;
    } else if (payload && typeof payload === 'object' && 'content' in payload) {
      const payloadObj = payload as {
        content: string;
        format?: SummaryFormat;
        detectedLanguage?: string;
        targetLanguage?: string;
        outputLanguage?: string;
      };
      content = payloadObj.content;
      format = payloadObj.format ?? format;
      detectedLanguage = payloadObj.detectedLanguage;
      if (payloadObj.outputLanguage?.trim()) {
        outputLanguageOverride = payloadObj.outputLanguage.trim();
      } else if (payloadObj.targetLanguage?.trim()) {
        outputLanguageOverride = payloadObj.targetLanguage.trim();
      }
    } else {
      devError('[Summarize] Invalid payload:', typeof payload);
      return createErrorResponse(
        'Invalid content for summarization',
        Date.now() - startTime,
        'summarizer'
      );
    }

    if (!content?.trim()) {
      return createErrorResponse(
        'Empty content for summarization',
        Date.now() - startTime,
        'summarizer'
      );
    }

    // Get user settings
    const settingsResult = await getSettings();
    if (!settingsResult.success) {
      return createHandlerErrorResponse(
        settingsResult.error,
        Date.now() - startTime,
        'summarizer'
      );
    }
    const settings = settingsResult.settings;

    devLog(
      `[Summarize] useNativeSummarizer setting: ${settings.useNativeSummarizer}`
    );

    // Determine output language
    const outputLanguage =
      outputLanguageOverride ?? (await getOutputLanguage()) ?? detectedLanguage;
    const { input: expectedInputLanguages, context: expectedContextLanguages } =
      await getExpectedLanguages(detectedLanguage);

    devLog(
      `[Summarize] Preferred language: ${settings.preferredTranslationLanguage ?? 'none'}, Output language: ${outputLanguage ?? 'auto-detect'}, Detected language: ${detectedLanguage ?? 'not provided'}`
    );

    // Check if Summarizer API is available and enabled
    const summarizerApiAvailable =
      await aiService.summarizer.checkAvailability();
    devLog(`[Summarize] Summarizer API available: ${summarizerApiAvailable}`);

    const summarizerAvailable =
      settings.useNativeSummarizer && summarizerApiAvailable;
    let summary: string[];
    let apiUsed: string;

    if (summarizerAvailable) {
      devLog(
        `[Summarize] Using Summarizer API with format: ${format}, language: ${outputLanguage ?? 'auto'}`
      );

      summary = await rateLimiter.executeWithRetry(
        () =>
          aiService.summarizer.summarize(content, format, outputLanguage, {
            expectedInputLanguages,
            expectedContextLanguages,
          }),
        'summarizations'
      );
      apiUsed = 'summarizer';
    } else {
      devLog(`[Summarize] Falling back to Prompt API with format: ${format}`);

      summary = await rateLimiter.executeWithRetry(
        () => aiService.prompt.summarize(content, format, outputLanguage),
        'summarizations'
      );
      apiUsed = 'prompt';
    }

    const duration = Date.now() - startTime;

    if (!summary || summary.length === 0) {
      devError(`[Summarize] Failed after ${duration}ms - empty result`);
      return createErrorResponse(ERROR_MESSAGES.AI_TIMEOUT, duration, apiUsed);
    }

    devLog(`[Summarize] Success in ${duration}ms using ${apiUsed}`);
    try {
      performanceMonitor.recordMetric('summarize', apiUsed, duration, true);
    } catch {
      // ignore metrics errors
    }
    return createSuccessResponse(summary, apiUsed, duration);
  } catch (error) {
    const duration = Date.now() - startTime;
    devError(`[Summarize] Error after ${duration}ms:`, error);
    try {
      performanceMonitor.recordMetric('summarize', 'unified', duration, false);
    } catch {
      // ignore metrics errors
    }
    return createHandlerErrorResponse(error, duration, 'summarizer');
  }
}

/**
 * Handle reflection prompt generation request
 */
export async function handleReflect(
  payload: unknown
): Promise<AIResponse<string[]>> {
  const startTime = Date.now();

  try {
    // Validate payload - support both array and object formats
    let summary: string[];

    if (Array.isArray(payload)) {
      summary = payload as string[];
    } else if (payload && typeof payload === 'object' && 'summary' in payload) {
      const payloadObj = payload as { summary: string[] };
      summary = payloadObj.summary;
    } else {
      devError('[Reflect] Invalid payload:', payload);
      return createErrorResponse(
        'Invalid summary for reflection prompts',
        Date.now() - startTime,
        'prompt'
      );
    }

    if (!summary || summary.length === 0) {
      return createErrorResponse(
        'Empty summary for reflection prompts',
        Date.now() - startTime,
        'prompt'
      );
    }

    // Check AI availability
    const available = await ensureAIAvailable();
    if (!available) {
      devError('[Reflect] AI unavailable');
      return createErrorResponse(
        ERROR_MESSAGES.AI_UNAVAILABLE,
        Date.now() - startTime,
        'prompt'
      );
    }

    // Call Prompt manager to generate reflection prompts
    devLog('[Reflect] Calling Prompt manager...');
    const prompts = await aiService.prompt.generateReflectionPrompts(summary);
    const duration = Date.now() - startTime;

    if (!prompts || prompts.length === 0) {
      devError(`[Reflect] Failed after ${duration}ms - empty result`);
      return createErrorResponse(ERROR_MESSAGES.AI_TIMEOUT, duration, 'prompt');
    }

    devLog(`[Reflect] Success in ${duration}ms`);
    return createSuccessResponse(prompts, 'prompt', duration);
  } catch (error) {
    const duration = Date.now() - startTime;
    devError(`[Reflect] Error after ${duration}ms:`, error);
    return createHandlerErrorResponse(error, duration, 'prompt');
  }
}

/**
 * Handle proofreading request
 */
export async function handleProofread(
  payload: unknown
): Promise<AIResponse<ProofreadResult>> {
  const startTime = Date.now();
  try {
    // Validate payload - support both string and object formats
    let text: string;
    let expectedLanguage: string | undefined;

    if (typeof payload === 'string') {
      text = payload;
    } else if (payload && typeof payload === 'object' && 'text' in payload) {
      const payloadObj = payload as {
        text: string;
        expectedLanguage?: string;
      };
      text = payloadObj.text;
      expectedLanguage = payloadObj.expectedLanguage;
    } else {
      return createErrorResponse(
        'Invalid text for proofreading',
        Date.now() - startTime,
        'proofreader'
      );
    }

    if (!text?.trim()) {
      return createErrorResponse(
        'Empty text for proofreading',
        Date.now() - startTime,
        'proofreader'
      );
    }

    // Check if proofreading is enabled in settings
    const settingsResult = await getSettings();
    if (!settingsResult.success) {
      return createHandlerErrorResponse(
        settingsResult.error,
        Date.now() - startTime,
        'proofreader'
      );
    }
    const settings = settingsResult.settings;

    if (!settings.proofreadEnabled && !settings.enableProofreading) {
      return createErrorResponse(
        'Proofreading is disabled in settings',
        Date.now() - startTime,
        'proofreader'
      );
    }

    // Check if Proofreader API is available
    const proofreaderAvailable =
      await aiService.proofreader.checkAvailability();
    let result: ProofreadResult | undefined;
    let apiUsed = 'prompt';
    let useProofreader = proofreaderAvailable;

    if (useProofreader) {
      try {
        const languages = expectedLanguage ? [expectedLanguage] : ['en'];
        devLog(
          `[Proofread] Using Proofreader API with languages: ${languages.join(', ')}`
        );
        result = await aiService.proofreader.proofread(text, {
          expectedInputLanguages: languages,
        });
        apiUsed = 'proofreader';
      } catch (proofreaderError) {
        devWarn(
          '[Proofread] Proofreader API failed, falling back to Prompt API:',
          proofreaderError
        );
        useProofreader = false;
      }
    }

    if (!useProofreader || !result) {
      // Fallback to Prompt API
      devLog('[Proofread] Falling back to Prompt API');

      const available = await ensureAIAvailable();
      if (!available) {
        return createErrorResponse(
          ERROR_MESSAGES.AI_UNAVAILABLE,
          Date.now() - startTime,
          'prompt'
        );
      }

      const correctedText = await aiService.prompt.proofread(text);
      result = {
        correctedText,
        corrections: [], // Prompt API doesn't provide detailed corrections
      };
      apiUsed = 'prompt';
    }

    devLog(`[Proofread] Success using ${apiUsed}`);
    return createSuccessResponse(result, apiUsed, Date.now() - startTime);
  } catch (error) {
    devError('Error in handleProofread:', error);
    return createHandlerErrorResponse(
      error,
      Date.now() - startTime,
      'proofreader'
    );
  }
}

/**
 * Handle write/draft generation request
 */
export async function handleWrite(
  payload: unknown
): Promise<AIResponse<string>> {
  const startTime = Date.now();
  try {
    // Validate payload
    if (!payload || typeof payload !== 'object' || !('prompt' in payload)) {
      return createErrorResponse(
        'Invalid payload for write operation',
        Date.now() - startTime,
        'writer'
      );
    }

    const payloadObj = payload as {
      prompt: string;
      options?: {
        tone?: 'formal' | 'neutral' | 'casual';
        format?: 'plain-text' | 'markdown';
        length?: 'short' | 'medium' | 'long';
        outputLanguage?: string;
      };
    };

    if (!payloadObj.prompt?.trim()) {
      return createErrorResponse(
        'Empty prompt for write operation',
        Date.now() - startTime,
        'writer'
      );
    }

    // Get output language and expected languages
    const outputLanguage = await getOutputLanguage(
      payloadObj.options?.outputLanguage
    );
    const { input: expectedInputLanguages, context: expectedContextLanguages } =
      await getExpectedLanguages(outputLanguage);

    // Check if Writer API is available
    const writerAvailable = await aiService.writer.checkAvailability();
    let result: string;
    let apiUsed: string;

    if (writerAvailable) {
      devLog(
        `[Write] Using Writer API (language: ${outputLanguage ?? 'auto'})`
      );
      result = await aiService.writer.write(payloadObj.prompt, {
        ...payloadObj.options,
        outputLanguage,
        expectedInputLanguages,
        expectedContextLanguages,
      });
      apiUsed = 'writer';
    } else {
      // Fallback to Prompt API
      devLog('[Write] Falling back to Prompt API');

      const available = await ensureAIAvailable();
      if (!available) {
        return createErrorResponse(
          ERROR_MESSAGES.AI_UNAVAILABLE,
          Date.now() - startTime,
          'prompt'
        );
      }

      const writerOptions: WriterOptions = {
        tone:
          payloadObj.options?.tone === 'formal'
            ? 'professional'
            : payloadObj.options?.tone === 'casual'
              ? 'casual'
              : 'calm',
        length: payloadObj.options?.length ?? 'medium',
      };
      result = await aiService.prompt.generateDraft(
        payloadObj.prompt,
        writerOptions
      );
      apiUsed = 'prompt';
    }

    devLog(`[Write] Success using ${apiUsed}`);
    devLog(`[Write] Generated result:`, result);
    devLog(`[Write] Result type:`, typeof result);
    devLog(`[Write] Result length:`, result?.length);
    return createSuccessResponse(result, apiUsed, Date.now() - startTime);
  } catch (error) {
    devError('Error in handleWrite:', error);
    const rawMessage =
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR;
    const friendlyMessage =
      /not available|Failed to create prompt session/i.test(rawMessage)
        ? 'AI not available'
        : rawMessage;
    return createErrorResponse(
      friendlyMessage,
      Date.now() - startTime,
      'writer'
    );
  }
}

/**
 * Handle rewrite request
 */
export async function handleRewrite(
  payload: unknown
): Promise<AIResponse<{ original: string; rewritten: string }>> {
  const startTime = Date.now();
  try {
    // Validate payload
    if (!payload || typeof payload !== 'object' || !('text' in payload)) {
      return createErrorResponse(
        'Invalid payload for rewrite operation',
        Date.now() - startTime,
        'rewriter'
      );
    }

    const payloadObj = payload as {
      text: string;
      preset?: TonePreset;
      context?: string;
    };

    if (!payloadObj.text?.trim()) {
      return createErrorResponse(
        'Empty text for rewrite operation',
        Date.now() - startTime,
        'rewriter'
      );
    }

    const preset = payloadObj.preset ?? 'calm';

    // Get output language and expected languages
    const outputLanguage = await getOutputLanguage();
    const { input: expectedInputLanguages, context: expectedContextLanguages } =
      await getExpectedLanguages(outputLanguage);

    // Check if Rewriter API is available
    const rewriterAvailable = await aiService.rewriter.checkAvailability();
    let result: { original: string; rewritten: string };
    let apiUsed: string;

    if (rewriterAvailable) {
      devLog(
        `[Rewrite] Using Rewriter API with preset: ${preset} (language: ${outputLanguage ?? 'auto'})`
      );
      result = await aiService.rewriter.rewrite(
        payloadObj.text,
        preset,
        payloadObj.context,
        outputLanguage,
        {
          expectedInputLanguages,
          expectedContextLanguages,
        }
      );
      apiUsed = 'rewriter';
    } else {
      // Fallback to Prompt API
      devLog(`[Rewrite] Falling back to Prompt API with preset: ${preset}`);

      const available = await ensureAIAvailable();
      if (!available) {
        return createErrorResponse(
          ERROR_MESSAGES.AI_UNAVAILABLE,
          Date.now() - startTime,
          'prompt'
        );
      }

      const rewritten = await aiService.prompt.rewrite(payloadObj.text, preset);
      result = {
        original: payloadObj.text,
        rewritten,
      };
      apiUsed = 'prompt';
    }

    devLog(`[Rewrite] Success using ${apiUsed}`);
    return createSuccessResponse(result, apiUsed, Date.now() - startTime);
  } catch (error) {
    devError('Error in handleRewrite:', error);
    return createHandlerErrorResponse(
      error,
      Date.now() - startTime,
      'rewriter'
    );
  }
}

/**
 * Handle translation request
 */
export async function handleTranslate(
  payload: unknown
): Promise<AIResponse<string>> {
  const startTime = Date.now();
  try {
    // Validate payload
    if (
      !payload ||
      typeof payload !== 'object' ||
      !('text' in payload) ||
      !('target' in payload)
    ) {
      return createErrorResponse(
        'Invalid payload for translate operation',
        Date.now() - startTime,
        'translator'
      );
    }

    const payloadObj = payload as {
      text: string;
      source: string;
      target: string;
    };

    if (!payloadObj.text?.trim()) {
      return createErrorResponse(
        'Empty text for translation',
        Date.now() - startTime,
        'translator'
      );
    }

    if (!payloadObj.target) {
      return createErrorResponse(
        'Missing target language for translation',
        Date.now() - startTime,
        'translator'
      );
    }

    // Check if translation is enabled in settings
    const settingsResult = await getSettings();
    if (!settingsResult.success) {
      return createHandlerErrorResponse(
        settingsResult.error,
        Date.now() - startTime,
        'translator'
      );
    }
    const settings = settingsResult.settings;

    if (!settings.translationEnabled && !settings.enableTranslation) {
      return createErrorResponse(
        'Translation is disabled in settings',
        Date.now() - startTime,
        'translator'
      );
    }

    // Check if Translator API is available for this language pair
    const canTranslate = await aiService.translator.canTranslate(
      payloadObj.source,
      payloadObj.target
    );

    if (!canTranslate) {
      return createErrorResponse(
        `Translation not available for ${payloadObj.source} -> ${payloadObj.target}`,
        Date.now() - startTime,
        'translator'
      );
    }

    devLog(
      `[Translate] Translating from ${payloadObj.source} to ${payloadObj.target}`
    );
    const result = await aiService.translator.translate(
      payloadObj.text,
      payloadObj.target,
      payloadObj.source
    );

    devLog('[Translate] Success');
    return createSuccessResponse(result, 'translator', Date.now() - startTime);
  } catch (error) {
    devError('Error in handleTranslate:', error);
    return createHandlerErrorResponse(
      error,
      Date.now() - startTime,
      'translator'
    );
  }
}

/**
 * Handle canTranslate request
 */
export async function handleCanTranslate(
  payload: unknown
): Promise<AIResponse<boolean>> {
  const startTime = Date.now();
  try {
    if (
      !payload ||
      typeof payload !== 'object' ||
      !('source' in payload) ||
      !('target' in payload)
    ) {
      return createErrorResponse(
        'Invalid payload for canTranslate',
        Date.now() - startTime,
        'translator'
      );
    }
    const { source, target } = payload as { source: string; target: string };
    const available = await aiService.translator.canTranslate(source, target);
    return createSuccessResponse(
      available,
      'translator',
      Date.now() - startTime
    );
  } catch (error) {
    return createHandlerErrorResponse(
      error,
      Date.now() - startTime,
      'translator'
    );
  }
}

/**
 * Handle checkTranslationAvailability for multiple targets
 */
export async function handleCheckTranslationAvailability(
  payload: unknown
): Promise<
  AIResponse<{ source: string; available: string[]; unavailable: string[] }>
> {
  const startTime = Date.now();
  try {
    if (
      !payload ||
      typeof payload !== 'object' ||
      !('source' in payload) ||
      !('targets' in payload)
    ) {
      return createErrorResponse(
        'Invalid payload for checkTranslationAvailability',
        Date.now() - startTime,
        'translator'
      );
    }
    const { source, targets } = payload as {
      source: string;
      targets: string[];
    };
    const available: string[] = [];
    const unavailable: string[] = [];
    for (const target of targets) {
      const ok = await aiService.translator.canTranslate(source, target);
      (ok ? available : unavailable).push(target);
    }
    return createSuccessResponse(
      { source, available, unavailable },
      'translator',
      Date.now() - startTime
    );
  } catch (error) {
    return createHandlerErrorResponse(
      error,
      Date.now() - startTime,
      'translator'
    );
  }
}

/**
 * Handle language detection request
 */
export async function handleDetectLanguage(
  payload: unknown
): Promise<AIResponse<LanguageDetection>> {
  const startTime = Date.now();
  try {
    // Validate payload
    if (!payload || typeof payload !== 'object' || !('text' in payload)) {
      return createErrorResponse(
        'Invalid payload for language detection',
        Date.now() - startTime,
        'languageDetector'
      );
    }

    const payloadObj = payload as {
      text: string;
      pageUrl?: string;
    };

    if (!payloadObj.text?.trim()) {
      return createErrorResponse(
        'Empty text for language detection',
        Date.now() - startTime,
        'languageDetector'
      );
    }

    // Check if Language Detector API is available
    const available = await aiService.languageDetector.checkAvailability();

    if (!available) {
      return createErrorResponse(
        'Language Detector API is not available',
        Date.now() - startTime,
        'languageDetector'
      );
    }

    devLog('[DetectLanguage] Detecting language...');
    const result = await aiService.languageDetector.detect(
      payloadObj.text,
      payloadObj.pageUrl
    );

    devLog(`[DetectLanguage] Detected: ${result.languageName}`);
    return createSuccessResponse(
      result,
      'languageDetector',
      Date.now() - startTime
    );
  } catch (error) {
    devError('Error in handleDetectLanguage:', error);
    return createHandlerErrorResponse(
      error,
      Date.now() - startTime,
      'languageDetector'
    );
  }
}
