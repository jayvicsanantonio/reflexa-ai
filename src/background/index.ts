/**
 * Background service worker entry point
 * Orchestrates AI operations, manages data persistence, and coordinates between components
 */

import { aiService } from './services/ai/aiService';
import type { Message, MessageType, AIResponse } from '../types';
import { createErrorResponse } from '../types';
import { ERROR_MESSAGES, STORAGE_KEYS } from '../constants';
import { devLog, devWarn, devError } from '../utils/logger';

// Import all handlers
import {
  handleCheckAI,
  handleCheckAllAI,
  handleGetCapabilities,
  handleSummarize,
  handleReflect,
  handleProofread,
  handleWrite,
  handleRewrite,
  handleTranslate,
  handleCanTranslate,
  handleCheckTranslationAvailability,
  handleDetectLanguage,
  handleGetUsageStats,
  handleGetPerformanceStats,
  handleSave,
  handleLoad,
  handleGetStreak,
  handleDeleteReflection,
  handleExportReflections,
  handleGetSettings,
  handleUpdateSettings,
  handleResetSettings,
  handleOpenDashboardInActiveTab,
  handleStartReflectInActiveTab,
  handleSummarizeStreamRequest,
  handleWriterStreamRequest,
  safePostStreamMessage,
  resetAIAvailability,
} from './handlers';

devLog('Background service worker initialized');

// Initialize AI Service
aiService.initialize();

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
    devLog('Received message:', message);

    // Validate message structure using type guard
    if (!isValidMessage(message)) {
      const duration = Date.now() - startTime;
      devWarn(`Invalid message rejected after ${duration}ms:`, message);
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
        devLog(
          `Message '${message.type}' completed in ${duration}ms`,
          response.success ? '✓' : '✗'
        );
        sendResponse(response);
      })
      .catch((error) => {
        const duration = Date.now() - startTime;
        devError(
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

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'ai-stream') return;

  let disconnected = false;
  const isDisconnected = () => disconnected;

  port.onDisconnect.addListener(() => {
    disconnected = true;
  });

  port.onMessage.addListener((message) => {
    if (isDisconnected()) return;
    if (!message || typeof message !== 'object') {
      return;
    }

    const { type, requestId, payload } = message as {
      type?: string;
      requestId?: string;
      payload?: unknown;
    };

    if (!type || !requestId) {
      safePostStreamMessage(port, isDisconnected, {
        event: 'error',
        requestId,
        error: 'Invalid stream message',
      });
      return;
    }

    switch (type) {
      case 'summarize-stream':
        void handleSummarizeStreamRequest(
          port,
          requestId,
          payload,
          isDisconnected
        );
        break;
      case 'writer-stream':
        void handleWriterStreamRequest(
          port,
          requestId,
          payload,
          isDisconnected
        );
        break;
      default:
        safePostStreamMessage(port, isDisconnected, {
          event: 'error',
          requestId,
          error: `Unknown stream type: ${type}`,
        });
        break;
    }
  });
});

/**
 * Route messages to appropriate handlers
 * @param message Message object with type and payload
 * @returns Promise resolving to response object
 */
export async function handleMessage(
  message: Message,
  _sender?: chrome.runtime.MessageSender
): Promise<AIResponse> {
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

    case 'canTranslate':
      return handleCanTranslate(message.payload);

    case 'checkTranslationAvailability':
      return handleCheckTranslationAvailability(message.payload);

    case 'getUsageStats':
      return handleGetUsageStats();

    case 'getPerformanceStats':
      return handleGetPerformanceStats();

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
 * Check AI availability on extension startup
 */
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Reflexa AI extension installed');

  // Initialize AI Service
  aiService.initialize();

  // Migrate storage keys to namespaced versions if needed
  await migrateStorageKeysIfNeeded();

  // Check if Gemini Nano is available
  const available = await aiService.prompt.checkAvailability();
  if (available) {
    resetAIAvailability(); // Reset cache to mark as available
  }

  console.log('Gemini Nano available:', available);

  // Log all API capabilities
  const capabilities = aiService.getCapabilities();
  console.log('AI Capabilities:', capabilities);

  // Set first launch flag if not already set
  const result = await chrome.storage.local.get(STORAGE_KEYS.FIRST_LAUNCH);
  if (!result[STORAGE_KEYS.FIRST_LAUNCH]) {
    await chrome.storage.local.set({ [STORAGE_KEYS.FIRST_LAUNCH]: true });
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

  // Opportunistically migrate storage keys on startup as well
  await migrateStorageKeysIfNeeded();

  // Check if Gemini Nano is available
  const available = await aiService.prompt.checkAvailability();
  if (available) {
    resetAIAvailability(); // Reset cache to mark as available
  }

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

/**
 * Migrate un-namespaced storage keys to namespaced keys.
 * This preserves existing user data while adopting safer key names.
 */
async function migrateStorageKeysIfNeeded(): Promise<void> {
  try {
    const legacyKeys = {
      REFLECTIONS: 'reflections',
      SETTINGS: 'settings',
      LAST_SYNC: 'lastSync',
      STREAK: 'streak',
      FIRST_LAUNCH: 'firstLaunch',
    } as const;

    const [legacyValues, namespacedValues] = await Promise.all([
      chrome.storage.local.get(Object.values(legacyKeys)),
      chrome.storage.local.get([
        STORAGE_KEYS.REFLECTIONS,
        STORAGE_KEYS.SETTINGS,
        STORAGE_KEYS.LAST_SYNC,
        STORAGE_KEYS.STREAK,
        STORAGE_KEYS.FIRST_LAUNCH,
      ]),
    ]);

    const updates: Record<string, unknown> = {};
    const removals: string[] = [];

    // For each legacy key: if value exists and namespaced is missing, migrate
    (Object.keys(legacyKeys) as (keyof typeof legacyKeys)[]).forEach((k) => {
      const legacyKey = legacyKeys[k];
      const namespacedKey = (STORAGE_KEYS as Record<string, string>)[k];
      const legacyHasValue = legacyValues[legacyKey] !== undefined;
      const namespacedHasValue = namespacedValues[namespacedKey] !== undefined;
      if (legacyHasValue && !namespacedHasValue) {
        updates[namespacedKey] = legacyValues[legacyKey];
        removals.push(legacyKey);
      }
    });

    if (Object.keys(updates).length > 0) {
      await chrome.storage.local.set(updates);
      await chrome.storage.local.remove(removals);
      console.log('[Storage] Migrated legacy keys to namespaced keys');
    }
  } catch (e) {
    console.warn('[Storage] Key migration failed:', e);
  }
}
