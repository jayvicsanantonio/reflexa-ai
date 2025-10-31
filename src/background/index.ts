/**
 * Background service worker entry point
 * Orchestrates AI operations, manages data persistence, and coordinates between components
 */

import { aiService } from './services/ai/aiService';
import { rateLimiter } from './services/ai/rateLimiter';
import { StorageManager, SettingsManager } from './services/storage';
import type {
  Message,
  MessageType,
  AIResponse,
  Reflection,
  Settings,
  SummaryFormat,
  TonePreset,
  ProofreadResult,
  LanguageDetection,
  WriterOptions,
  UsageStats,
  AICapabilities,
  StreakData,
} from '../types';
import { createSuccessResponse, createErrorResponse } from '../types';
import { ERROR_MESSAGES } from '../constants';

console.log('Reflexa AI background service worker initialized');

// Initialize managers
const storageManager = new StorageManager();
const settingsManager = new SettingsManager();

// Initialize AI Service
aiService.initialize();

// Track AI availability status
let aiAvailable = false;

/**
 * Type guard to validate message structure and type
 * @param message Unknown message object
 * @returns True if message is valid Message type
 */
function isValidMessage(message: unknown): message is Message {
  if (!message || typeof message !== 'object') {
    return false;
  }

  if (!('type' in message) || typeof message.type !== 'string') {
    return false;
  }

  // Validate message type is one of the allowed types
  const validTypes: MessageType[] = [
    'checkAI',
    'checkAllAI',
    'getCapabilities',
    'summarize',
    'reflect',
    'proofread',
    'write',
    'rewrite',
    'translate',
    'detectLanguage',
    'save',
    'load',
    'getSettings',
    'updateSettings',
    'resetSettings',
    'getUsageStats',
    'getPerformanceStats',
    'canTranslate',
    'checkTranslationAvailability',
    'getStreak',
    'deleteReflection',
    'exportReflections',
    'openDashboardInActiveTab',
    'startReflectInActiveTab',
  ];

  return validTypes.includes(message.type as MessageType);
}

/**
 * Message listener for communication with content scripts and popup
 * Handles all cross-component communication
 */
chrome.runtime.onMessage.addListener(
  (message: unknown, _sender, sendResponse) => {
    const startTime = Date.now();
    console.log('Received message:', message);

    // Validate message structure using type guard
    if (!isValidMessage(message)) {
      const duration = Date.now() - startTime;
      console.warn(`Invalid message rejected after ${duration}ms:`, message);
      sendResponse(
        createErrorResponse(
          'Invalid message format or type',
          duration
        ) as AIResponse
      );
      return true;
    }

    // Route message to appropriate handler
    handleMessage(message)
      .then((response) => {
        const duration = Date.now() - startTime;
        console.log(
          `Message '${message.type}' completed in ${duration}ms`,
          response.success ? '✓' : '✗'
        );
        sendResponse(response);
      })
      .catch((error) => {
        const duration = Date.now() - startTime;
        console.error(
          `Message '${message.type}' failed after ${duration}ms:`,
          error
        );
        sendResponse(
          createErrorResponse(
            error instanceof Error
              ? error.message
              : ERROR_MESSAGES.GENERIC_ERROR,
            duration
          ) as AIResponse
        );
      });

    // Return true to indicate async response
    return true;
  }
);

/**
 * Route messages to appropriate handlers
 * @param message Message object with type and payload
 * @returns Promise resolving to response object
 */
async function handleMessage(message: Message): Promise<AIResponse> {
  switch (message.type) {
    case 'checkAI':
      return handleCheckAI();

    case 'checkAllAI':
      return handleCheckAllAI();

    case 'getCapabilities':
      return handleGetCapabilities(message.payload);

    case 'summarize':
      return handleSummarize(message.payload);

    case 'reflect':
      return handleReflect(message.payload);

    case 'proofread':
      return handleProofread(message.payload);

    case 'write':
      return handleWrite(message.payload);

    case 'rewrite':
      return handleRewrite(message.payload);

    case 'translate':
      return handleTranslate(message.payload);

    case 'detectLanguage':
      return handleDetectLanguage(message.payload);

    case 'getUsageStats':
      return handleGetUsageStats();

    case 'save':
      return handleSave(message.payload);

    case 'load':
      return handleLoad(message.payload);

    case 'getStreak':
      return handleGetStreak();

    case 'deleteReflection':
      return handleDeleteReflection(message.payload);

    case 'exportReflections':
      return handleExportReflections(message.payload);

    case 'getSettings':
      return handleGetSettings();

    case 'updateSettings':
      return handleUpdateSettings(message.payload);

    case 'resetSettings':
      return handleResetSettings();

    case 'openDashboardInActiveTab':
      return handleOpenDashboardInActiveTab();

    case 'startReflectInActiveTab':
      return handleStartReflectInActiveTab();

    default:
      return createErrorResponse(
        `Unknown message type: ${String(message.type)}`,
        0
      );
  }
}

/**
 * Handle AI availability check (Prompt API only)
 * @returns Response with availability status
 */
async function handleCheckAI(): Promise<AIResponse<boolean>> {
  const startTime = Date.now();
  try {
    const available = await aiService.prompt.checkAvailability();
    aiAvailable = available;

    return createSuccessResponse(available, 'prompt', Date.now() - startTime);
  } catch (error) {
    console.error('Error checking AI availability:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'prompt'
    );
  }
}

/**
 * Handle all AI APIs availability check
 * @returns Response with availability status for all APIs
 */
async function handleCheckAllAI(): Promise<
  AIResponse<{
    prompt: boolean;
    proofreader: boolean;
    summarizer: boolean;
    translator: boolean;
    writer: boolean;
    rewriter: boolean;
    languageDetector: boolean;
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
    console.error('Error checking all AI availability:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'unified'
    );
  }
}

/**
 * Handle get capabilities request
 * Supports optional refresh parameter to force fresh detection
 * @returns Response with capabilities object
 */
function handleGetCapabilities(payload?: unknown): AIResponse<AICapabilities> {
  const startTime = Date.now();
  try {
    // Parse payload for refresh and experimentalMode flags
    let refresh = false;
    let experimentalMode = false;

    if (payload && typeof payload === 'object') {
      const payloadObj = payload as {
        refresh?: boolean;
        experimentalMode?: boolean;
      };
      refresh = payloadObj.refresh ?? false;
      experimentalMode = payloadObj.experimentalMode ?? false;
    }

    let capabilities: AICapabilities;

    if (refresh) {
      console.log(
        `[GetCapabilities] Refreshing capabilities (experimental: ${experimentalMode})`
      );
      capabilities = aiService.refreshCapabilities(experimentalMode);
    } else {
      console.log('[GetCapabilities] Using cached capabilities');
      capabilities = aiService.getCapabilities();
    }

    return createSuccessResponse(
      capabilities,
      'unified',
      Date.now() - startTime
    );
  } catch (error) {
    console.error('Error getting capabilities:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'unified'
    );
  }
}

/**
 * Handle summarization request
 * @param payload Content to summarize with optional format
 * @returns Response with summary bullets or error
 */
async function handleSummarize(
  payload: unknown
): Promise<AIResponse<string[]>> {
  const startTime = Date.now();

  try {
    // Validate payload - support both string and object formats
    let content: string;
    let format: SummaryFormat = 'bullets'; // default format

    if (typeof payload === 'string') {
      content = payload;
    } else if (payload && typeof payload === 'object' && 'content' in payload) {
      const payloadObj = payload as { content: string; format?: SummaryFormat };
      content = payloadObj.content;
      if (payloadObj.format) {
        format = payloadObj.format;
      }
    } else {
      console.error('[Summarize] Invalid payload:', typeof payload);
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

    // Get user settings to check if native Summarizer should be used
    const settings = await settingsManager.getSettings();
    console.log(
      `[Summarize] useNativeSummarizer setting: ${settings.useNativeSummarizer}`
    );

    // Check if Summarizer API is available and enabled in settings
    const summarizerApiAvailable =
      await aiService.summarizer.checkAvailability();
    console.log(
      `[Summarize] Summarizer API available: ${summarizerApiAvailable}`
    );

    const summarizerAvailable =
      settings.useNativeSummarizer && summarizerApiAvailable;
    let summary: string[];
    let apiUsed: string;

    if (summarizerAvailable) {
      console.log(
        `[Summarize] Using Summarizer API with format: ${format}, language: ${settings.targetLanguage}`
      );

      // Use specialized Summarizer API with format parameter, language, and rate limiting
      summary = await rateLimiter.executeWithRetry(
        () =>
          aiService.summarizer.summarize(
            content,
            format,
            settings.targetLanguage
          ),
        'summarizations'
      );
      apiUsed = 'summarizer';
    } else {
      // Fallback to Prompt API
      console.log(
        `[Summarize] Falling back to Prompt API with format: ${format}`
      );

      // Check Prompt API availability
      if (!aiAvailable) {
        const available = await aiService.prompt.checkAvailability();
        aiAvailable = available;

        if (!available) {
          console.error('[Summarize] AI unavailable');
          return createErrorResponse(
            ERROR_MESSAGES.AI_UNAVAILABLE,
            Date.now() - startTime,
            'prompt'
          );
        }
      }

      summary = await rateLimiter.executeWithRetry(
        () => aiService.prompt.summarize(content, format),
        'summarizations'
      );
      apiUsed = 'prompt';
    }

    const duration = Date.now() - startTime;

    // Check if summarization failed
    if (!summary || summary.length === 0) {
      console.error(`[Summarize] Failed after ${duration}ms - empty result`);
      return createErrorResponse(ERROR_MESSAGES.AI_TIMEOUT, duration, apiUsed);
    }

    console.log(`[Summarize] Success in ${duration}ms using ${apiUsed}`);
    return createSuccessResponse(summary, apiUsed, duration);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Summarize] Error after ${duration}ms:`, error);
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      duration,
      'summarizer'
    );
  }
}

/**
 * Handle reflection prompt generation request
 * @param payload Summary bullets to generate prompts from
 * @returns Response with reflection questions or error
 */
async function handleReflect(payload: unknown): Promise<AIResponse<string[]>> {
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
      console.error('[Reflect] Invalid payload:', payload);
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
    if (!aiAvailable) {
      console.log('[Reflect] Checking AI availability...');
      const available = await aiService.prompt.checkAvailability();
      aiAvailable = available;

      if (!available) {
        console.error('[Reflect] AI unavailable');
        return createErrorResponse(
          ERROR_MESSAGES.AI_UNAVAILABLE,
          Date.now() - startTime,
          'prompt'
        );
      }
    }

    // Call Prompt manager to generate reflection prompts
    console.log('[Reflect] Calling Prompt manager...');
    const prompts = await aiService.prompt.generateReflectionPrompts(summary);
    const duration = Date.now() - startTime;

    // Check if generation failed
    if (!prompts || prompts.length === 0) {
      console.error(`[Reflect] Failed after ${duration}ms - empty result`);
      return createErrorResponse(ERROR_MESSAGES.AI_TIMEOUT, duration, 'prompt');
    }

    console.log(`[Reflect] Success in ${duration}ms`);
    return createSuccessResponse(prompts, 'prompt', duration);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Reflect] Error after ${duration}ms:`, error);
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      duration,
      'prompt'
    );
  }
}

/**
 * Handle proofreading request
 * @param payload Text to proofread
 * @returns Response with proofread result or error
 */
async function handleProofread(
  payload: unknown
): Promise<AIResponse<ProofreadResult>> {
  const startTime = Date.now();
  try {
    // Validate payload - support both string and object formats
    let text: string;

    if (typeof payload === 'string') {
      text = payload;
    } else if (payload && typeof payload === 'object' && 'text' in payload) {
      const payloadObj = payload as { text: string };
      text = payloadObj.text;
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
    const settings = await settingsManager.getSettings();
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
    let result: ProofreadResult;
    let apiUsed: string;

    if (proofreaderAvailable) {
      console.log('[Proofread] Using Proofreader API');
      result = await aiService.proofreader.proofread(text);
      apiUsed = 'proofreader';
    } else {
      // Fallback to Prompt API
      console.log('[Proofread] Falling back to Prompt API');

      // Check Prompt API availability
      if (!aiAvailable) {
        const available = await aiService.prompt.checkAvailability();
        aiAvailable = available;

        if (!available) {
          return createErrorResponse(
            ERROR_MESSAGES.AI_UNAVAILABLE,
            Date.now() - startTime,
            'prompt'
          );
        }
      }

      const correctedText = await aiService.prompt.proofread(text);
      result = {
        correctedText,
        corrections: [], // Prompt API doesn't provide detailed corrections
      };
      apiUsed = 'prompt';
    }

    console.log(`[Proofread] Success using ${apiUsed}`);
    return createSuccessResponse(result, apiUsed, Date.now() - startTime);
  } catch (error) {
    console.error('Error in handleProofread:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'proofreader'
    );
  }
}

/**
 * Handle write/draft generation request
 * @param payload Prompt and options for draft generation
 * @returns Response with generated text or error
 */
async function handleWrite(payload: unknown): Promise<AIResponse<string>> {
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

    // Get user settings for target language
    const settings = await settingsManager.getSettings();

    // Check if Writer API is available
    const writerAvailable = await aiService.writer.checkAvailability();
    let result: string;
    let apiUsed: string;

    if (writerAvailable) {
      console.log(
        `[Write] Using Writer API (language: ${settings.targetLanguage})`
      );
      result = await aiService.writer.write(payloadObj.prompt, {
        ...payloadObj.options,
        outputLanguage: settings.targetLanguage,
      });
      apiUsed = 'writer';
    } else {
      // Fallback to Prompt API
      console.log('[Write] Falling back to Prompt API');

      // Check Prompt API availability
      if (!aiAvailable) {
        const available = await aiService.prompt.checkAvailability();
        aiAvailable = available;

        if (!available) {
          return createErrorResponse(
            ERROR_MESSAGES.AI_UNAVAILABLE,
            Date.now() - startTime,
            'prompt'
          );
        }
      }

      // Use Prompt API's generateDraft method
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

    console.log(`[Write] Success using ${apiUsed}`);
    return createSuccessResponse(result, apiUsed, Date.now() - startTime);
  } catch (error) {
    console.error('Error in handleWrite:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'writer'
    );
  }
}

/**
 * Handle rewrite request
 * @param payload Text and tone preset for rewriting
 * @returns Response with rewritten text or error
 */
async function handleRewrite(
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

    // Get user settings for target language
    const settings = await settingsManager.getSettings();

    // Check if Rewriter API is available
    const rewriterAvailable = await aiService.rewriter.checkAvailability();
    let result: { original: string; rewritten: string };
    let apiUsed: string;

    if (rewriterAvailable) {
      console.log(
        `[Rewrite] Using Rewriter API with preset: ${preset} (language: ${settings.targetLanguage})`
      );
      result = await aiService.rewriter.rewrite(
        payloadObj.text,
        preset,
        payloadObj.context,
        settings.targetLanguage
      );
      apiUsed = 'rewriter';
    } else {
      // Fallback to Prompt API
      console.log(
        `[Rewrite] Falling back to Prompt API with preset: ${preset}`
      );

      // Check Prompt API availability
      if (!aiAvailable) {
        const available = await aiService.prompt.checkAvailability();
        aiAvailable = available;

        if (!available) {
          return createErrorResponse(
            ERROR_MESSAGES.AI_UNAVAILABLE,
            Date.now() - startTime,
            'prompt'
          );
        }
      }

      const rewritten = await aiService.prompt.rewrite(payloadObj.text, preset);
      result = {
        original: payloadObj.text,
        rewritten,
      };
      apiUsed = 'prompt';
    }

    console.log(`[Rewrite] Success using ${apiUsed}`);
    return createSuccessResponse(result, apiUsed, Date.now() - startTime);
  } catch (error) {
    console.error('Error in handleRewrite:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'rewriter'
    );
  }
}

/**
 * Handle translation request
 * @param payload Text and language options for translation
 * @returns Response with translated text or error
 */
async function handleTranslate(payload: unknown): Promise<AIResponse<string>> {
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
    const settings = await settingsManager.getSettings();
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

    console.log(
      `[Translate] Translating from ${payloadObj.source} to ${payloadObj.target}`
    );
    const result = await aiService.translator.translate(
      payloadObj.text,
      payloadObj.target,
      payloadObj.source
    );

    console.log('[Translate] Success');
    return createSuccessResponse(result, 'translator', Date.now() - startTime);
  } catch (error) {
    console.error('Error in handleTranslate:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'translator'
    );
  }
}

/**
 * Handle language detection request
 * @param payload Text to detect language from
 * @returns Response with language detection result or error
 */
async function handleDetectLanguage(
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

    console.log('[DetectLanguage] Detecting language...');
    const result = await aiService.languageDetector.detect(
      payloadObj.text,
      payloadObj.pageUrl
    );

    console.log(`[DetectLanguage] Detected: ${result.languageName}`);
    return createSuccessResponse(
      result,
      'languageDetector',
      Date.now() - startTime
    );
  } catch (error) {
    console.error('Error in handleDetectLanguage:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'languageDetector'
    );
  }
}

/**
 * Handle get usage statistics request
 * @returns Response with usage statistics
 */
function handleGetUsageStats(): AIResponse<{
  stats: UsageStats;
  total: number;
  approachingQuota: boolean;
}> {
  const startTime = Date.now();
  try {
    const stats = rateLimiter.getUsageStats();
    const total = rateLimiter.getTotalOperations();
    const approachingQuota = rateLimiter.isApproachingQuota();

    return createSuccessResponse(
      { stats, total, approachingQuota },
      'unified',
      Date.now() - startTime
    );
  } catch (error) {
    console.error('Error in handleGetUsageStats:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'unified'
    );
  }
}

/**
 * Handle save reflection request
 * @param payload Reflection object to save
 * @returns Response with success status or error
 */
async function handleSave(payload: unknown): Promise<AIResponse<void>> {
  const startTime = Date.now();

  try {
    // Validate payload
    if (!payload || typeof payload !== 'object') {
      console.error('[Save] Invalid payload:', typeof payload);
      return createErrorResponse(
        'Invalid reflection data',
        Date.now() - startTime,
        'storage'
      );
    }

    const reflection = payload as Reflection;

    // Validate required fields
    if (!reflection.url || !reflection.title || !reflection.createdAt) {
      console.error('[Save] Missing required fields:', reflection);
      return createErrorResponse(
        'Missing required reflection fields',
        Date.now() - startTime,
        'storage'
      );
    }

    // Check storage quota before saving
    const isNearLimit = await storageManager.isStorageNearLimit();
    if (isNearLimit) {
      console.warn('[Save] Storage near limit (>90%)');
    }

    // Save reflection using storage manager
    console.log('[Save] Saving reflection...');
    await storageManager.saveReflection(reflection);
    const duration = Date.now() - startTime;

    console.log(`[Save] Success in ${duration}ms`);
    return createSuccessResponse(undefined as void, 'storage', duration);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Save] Error after ${duration}ms:`, error);

    // Check if it's a storage full error
    if (
      error instanceof Error &&
      (error.message.includes('storage') ||
        error.message.includes('QUOTA') ||
        error.name === 'StorageFullError')
    ) {
      console.error('[Save] Storage quota exceeded');
      return createErrorResponse(
        ERROR_MESSAGES.STORAGE_FULL,
        duration,
        'storage'
      );
    }

    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      duration,
      'storage'
    );
  }
}

/**
 * Handle load reflections request
 * @param payload Optional limit on number of reflections
 * @returns Response with reflections array or error
 */
async function handleLoad(payload: unknown): Promise<AIResponse<Reflection[]>> {
  const startTime = Date.now();
  try {
    // Parse limit if provided
    const limit =
      typeof payload === 'number' && payload > 0 ? payload : undefined;

    // Load reflections using storage manager
    const reflections = await storageManager.getReflections(limit);

    return createSuccessResponse(
      reflections,
      'storage',
      Date.now() - startTime
    );
  } catch (error) {
    console.error('Error in handleLoad:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'storage'
    );
  }
}

/**
 * Handle get settings request
 * @returns Response with settings object or error
 */
async function handleGetSettings(): Promise<AIResponse<Settings>> {
  const startTime = Date.now();
  try {
    const settings = await settingsManager.getSettings();

    return createSuccessResponse(settings, 'storage', Date.now() - startTime);
  } catch (error) {
    console.error('Error in handleGetSettings:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'storage'
    );
  }
}

/**
 * Handle get streak request
 */
async function handleGetStreak(): Promise<AIResponse<StreakData>> {
  const startTime = Date.now();
  try {
    const streak = await storageManager.getStreak();
    return createSuccessResponse(streak, 'storage', Date.now() - startTime);
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'storage'
    );
  }
}

/** Delete a reflection by ID and update streak */
async function handleDeleteReflection(
  payload: unknown
): Promise<AIResponse<boolean>> {
  const startTime = Date.now();
  try {
    if (!payload || typeof payload !== 'string') {
      return createErrorResponse(
        'Invalid reflection id',
        Date.now() - startTime,
        'storage'
      );
    }
    await storageManager.deleteReflection(payload);
    return createSuccessResponse(true, 'storage', Date.now() - startTime);
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'storage'
    );
  }
}

/** Export reflections in given format */
async function handleExportReflections(
  payload: unknown
): Promise<AIResponse<string>> {
  const startTime = Date.now();
  try {
    const format = payload === 'markdown' ? 'markdown' : 'json';
    const data = await storageManager.exportReflections(format);
    return createSuccessResponse(data, 'storage', Date.now() - startTime);
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'storage'
    );
  }
}

/**
 * Ask the active tab's content script to open the Dashboard modal.
 */
async function handleOpenDashboardInActiveTab(): Promise<AIResponse<boolean>> {
  const startTime = Date.now();
  try {
    const delivered = await new Promise<boolean>((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const tab = tabs[0];
        const tabId = typeof tab?.id === 'number' ? tab.id : null;
        const url = tab?.url ?? '';
        // Guard against restricted pages (chrome://, edge://, chrome web store)
        if (
          !tabId ||
          url.startsWith('chrome://') ||
          url.startsWith('edge://') ||
          url.includes('chrome.google.com/webstore')
        ) {
          resolve(false);
          return;
        }
        try {
          const resp: unknown = await chrome.tabs.sendMessage(tabId, {
            type: 'openDashboard',
          });
          const ok =
            resp && typeof resp === 'object' && 'success' in resp
              ? Boolean((resp as { success?: boolean }).success)
              : false;
          resolve(ok);
        } catch {
          // No content script or cannot connect
          resolve(false);
        }
      });
    });

    if (delivered) {
      return createSuccessResponse(true, 'ui', Date.now() - startTime);
    }
    return createErrorResponse(
      'Unable to open overlay on this page',
      Date.now() - startTime,
      'ui'
    );
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'ui'
    );
  }
}

/**
 * Ask the active tab's content script to start the reflection flow.
 */
async function handleStartReflectInActiveTab(): Promise<AIResponse<boolean>> {
  const startTime = Date.now();
  try {
    const delivered = await new Promise<boolean>((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const tab = tabs[0];
        const tabId = typeof tab?.id === 'number' ? tab.id : null;
        const url = tab?.url ?? '';
        if (
          !tabId ||
          url.startsWith('chrome://') ||
          url.startsWith('edge://') ||
          url.includes('chrome.google.com/webstore')
        ) {
          resolve(false);
          return;
        }
        try {
          const resp: unknown = await chrome.tabs.sendMessage(tabId, {
            type: 'startReflection',
          });
          const ok =
            resp &&
            typeof resp === 'object' &&
            resp !== null &&
            'success' in resp
              ? Boolean((resp as { success?: boolean }).success)
              : false;
          resolve(ok);
        } catch {
          resolve(false);
        }
      });
    });

    if (delivered) {
      return createSuccessResponse(true, 'ui', Date.now() - startTime);
    }
    return createErrorResponse(
      'Unable to start reflection on this page',
      Date.now() - startTime,
      'ui'
    );
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'ui'
    );
  }
}

/**
 * Handle update settings request
 * @param payload Partial settings object to update
 * @returns Response with updated settings or error
 */
async function handleUpdateSettings(
  payload: unknown
): Promise<AIResponse<Settings>> {
  const startTime = Date.now();
  try {
    // Validate payload
    if (!payload || typeof payload !== 'object') {
      return createErrorResponse(
        'Invalid settings data',
        Date.now() - startTime,
        'storage'
      );
    }

    // Update settings using settings manager
    const updatedSettings = await settingsManager.updateSettings(
      payload as Partial<Settings>
    );

    // Broadcast settings update to all tabs so content scripts can react live
    try {
      chrome.tabs.query({}, (tabs) => {
        for (const tab of tabs) {
          if (typeof tab.id === 'number') {
            // Best-effort fire-and-forget; ignore failures for tabs without our content script
            void chrome.tabs
              .sendMessage(tab.id, {
                type: 'settingsUpdated',
                data: updatedSettings,
              })
              .catch(() => undefined);
          }
        }
      });
    } catch (e) {
      console.warn('Broadcast of settingsUpdated failed:', e);
    }

    return createSuccessResponse(
      updatedSettings,
      'storage',
      Date.now() - startTime
    );
  } catch (error) {
    console.error('Error in handleUpdateSettings:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'storage'
    );
  }
}

/**
 * Handle reset settings request
 * @returns Response with default settings or error
 */
async function handleResetSettings(): Promise<AIResponse<Settings>> {
  const startTime = Date.now();
  try {
    // Reset settings to defaults using settings manager
    const defaultSettings = await settingsManager.resetToDefaults();

    return createSuccessResponse(
      defaultSettings,
      'storage',
      Date.now() - startTime
    );
  } catch (error) {
    console.error('Error in handleResetSettings:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'storage'
    );
  }
}

/**
 * Check AI availability on extension startup
 */
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Reflexa AI extension installed');

  // Initialize AI Service
  aiService.initialize();

  // Check if Gemini Nano is available
  const available = await aiService.prompt.checkAvailability();
  aiAvailable = available;

  console.log('Gemini Nano available:', available);

  // Log all API capabilities
  const capabilities = aiService.getCapabilities();
  console.log('AI Capabilities:', capabilities);

  // Set first launch flag if not already set
  const result = await chrome.storage.local.get('firstLaunch');
  if (!result.firstLaunch) {
    await chrome.storage.local.set({ firstLaunch: true });
    console.log('First launch detected');
  }
});

/**
 * Check AI availability on service worker startup
 */
chrome.runtime.onStartup.addListener(async () => {
  console.log('Reflexa AI service worker started');

  // Initialize AI Service
  aiService.initialize();

  // Check if Gemini Nano is available
  const available = await aiService.prompt.checkAvailability();
  aiAvailable = available;

  console.log('Gemini Nano available:', available);

  // Log all API capabilities
  const capabilities = aiService.getCapabilities();
  console.log('AI Capabilities:', capabilities);
});

/**
 * Suppress benign Chrome extension errors
 * These errors are common and don't affect functionality
 */
self.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason as Error | undefined;
  const message = reason?.message ?? '';

  // Suppress FrameDoesNotExistError - happens when iframes are destroyed
  if (message.includes('Frame') && message.includes('does not exist')) {
    event.preventDefault();
    return;
  }

  // Suppress "Could not establish connection" errors
  if (message.includes('Could not establish connection')) {
    event.preventDefault();
    return;
  }
});
