/**
 * Shared utilities for message handlers
 * Provides common functionality used across multiple handlers
 */

import { aiService } from '../../services/ai/aiService';
import { SettingsManager } from '../../services/storage';
import { createErrorResponse } from '../../../types';
import { ERROR_MESSAGES } from '../../../constants';

// Shared instances
export const settingsManager = new SettingsManager();

// Track AI availability status
let aiAvailable = false;

/**
 * Check if Prompt API is available, caching the result
 */
export async function ensureAIAvailable(): Promise<boolean> {
  if (aiAvailable) {
    return true;
  }

  const available = await aiService.prompt.checkAvailability();
  aiAvailable = available;
  return available;
}

/**
 * Reset AI availability cache (for testing or when API state changes)
 */
export function resetAIAvailability(): void {
  aiAvailable = false;
}

/**
 * Get user settings with error handling
 */
export async function getSettings(): Promise<
  | {
      success: true;
      settings: Awaited<ReturnType<SettingsManager['getSettings']>>;
    }
  | { success: false; error: string }
> {
  try {
    const settings = await settingsManager.getSettings();
    return { success: true, settings };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
    };
  }
}

/**
 * Get output language from settings, considering translation settings
 */
export async function getOutputLanguage(
  override?: string
): Promise<string | undefined> {
  const settingsResult = await getSettings();
  if (!settingsResult.success) {
    return undefined;
  }

  const settings = settingsResult.settings;
  const translationEnabled =
    settings.enableTranslation ?? settings.translationEnabled;

  if (override && override.trim().length > 0) {
    return override.trim();
  }

  return translationEnabled
    ? (settings.preferredTranslationLanguage ?? settings.targetLanguage)
    : undefined;
}

/**
 * Get expected languages for AI operations
 */
export async function getExpectedLanguages(
  detectedLanguage?: string
): Promise<{ input?: string[]; context?: string[] }> {
  const outputLanguage = await getOutputLanguage();
  const expectedLanguages = outputLanguage
    ? [outputLanguage]
    : detectedLanguage
      ? [detectedLanguage]
      : undefined;

  return {
    input: expectedLanguages,
    context: expectedLanguages,
  };
}

/**
 * Helper to create error response with consistent formatting
 */
export function createHandlerErrorResponse(
  error: unknown,
  duration: number,
  apiUsed: string
) {
  return createErrorResponse(
    error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
    duration,
    apiUsed
  );
}
