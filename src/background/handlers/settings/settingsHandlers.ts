/**
 * Settings operation handlers
 * Handles all settings-related operations: getSettings, updateSettings, resetSettings
 */

import { settingsManager } from '../utils/shared';
import { createSuccessResponse, createErrorResponse } from '../../../types';
import type { AIResponse, Settings } from '../../../types';
import { ERROR_MESSAGES } from '../../../constants';

/**
 * Handle get settings request
 */
export async function handleGetSettings(): Promise<AIResponse<Settings>> {
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
 * Handle update settings request
 */
export async function handleUpdateSettings(
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
 */
export async function handleResetSettings(): Promise<AIResponse<Settings>> {
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
