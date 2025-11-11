/**
 * Background service worker entry point
 * Orchestrates AI operations, manages data persistence, and coordinates between components
 *
 * Key responsibilities:
 * - Handle message routing between content scripts and background services
 * - Manage streaming operations
 * - Maintain storage and settings
 * - Coordinate AI capability detection
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
 * Valid message types - source of truth for accepted messages
 */
const VALID_MESSAGE_TYPES = new Set<MessageType>([
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
]);

/**
 * Type guard to validate message structure and type
 * Uses a Set for better performance and single source of truth
 *
 * @param message Unknown message object
 * @returns True if message is valid Message type with known type
 */
function isValidMessage(message: unknown): message is Message {
  if (!message || typeof message !== 'object') {
    return false;
  }

  if (!('type' in message) || typeof message.type !== 'string') {
    return false;
  }

  return VALID_MESSAGE_TYPES.has(message.type as MessageType);
}

/**
 * Message listener for communication with content scripts and popup
 * Routes messages to appropriate handlers and manages response lifecycle
 *
 * @param message - Unknown message from sender
 * @param _sender - Message sender metadata (unused)
 * @param sendResponse - Callback to send response back to sender
 * @returns true to indicate async response will be sent
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
    void handleMessage(message)
      .then((response) => {
        const duration = Date.now() - startTime;
        devLog(
          `Message '${message.type}' completed in ${duration}ms`,
          response.success ? '✓' : '✗'
        );
        sendResponse(response);
      })
      .catch((error: unknown) => {
        const duration = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR;
        devError(
          `Message '${message.type}' failed after ${duration}ms:`,
          error
        );
        sendResponse(createErrorResponse(errorMessage, duration) as AIResponse);
      });

    // Return true to indicate async response will be sent
    return true;
  }
);

/**
 * Stream connection handler for long-running AI operations
 * Manages persistent connections for streaming responses
 */
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'ai-stream') return;

  let disconnected = false;
  const isDisconnected = () => disconnected;

  port.onDisconnect.addListener(() => {
    disconnected = true;
  });

  port.onMessage.addListener((message: unknown) => {
    if (isDisconnected()) return;

    // Validate message is object
    if (!message || typeof message !== 'object') {
      devWarn('Received non-object stream message:', message);
      return;
    }

    const { type, requestId, payload } = message as {
      type?: string;
      requestId?: string;
      payload?: unknown;
    };

    // Validate required fields
    if (!type || !requestId || typeof type !== 'string') {
      safePostStreamMessage(port, isDisconnected, {
        event: 'error',
        requestId: requestId ?? 'unknown',
        error: 'Invalid stream message: missing type or requestId',
      });
      return;
    }

    // Route to appropriate stream handler
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
 * Initialize extension on first install or update
 * Performs data migrations and capability checks
 */
chrome.runtime.onInstalled.addListener(async () => {
  try {
    devLog('Reflexa AI extension installed');

    // Initialize AI Service
    aiService.initialize();

    // Migrate storage keys to namespaced versions if needed
    await migrateStorageKeysIfNeeded();

    // Check if Gemini Nano is available
    const available = await aiService.prompt.checkAvailability();
    if (available) {
      resetAIAvailability(); // Reset cache to mark as available
    }

    devLog('Gemini Nano available:', available);

    // Log all API capabilities
    const capabilities = aiService.getCapabilities();
    devLog('AI Capabilities:', capabilities);

    // Set first launch flag if not already set
    const result = await chrome.storage.local.get(STORAGE_KEYS.FIRST_LAUNCH);
    if (!result[STORAGE_KEYS.FIRST_LAUNCH]) {
      await chrome.storage.local.set({ [STORAGE_KEYS.FIRST_LAUNCH]: true });
      devLog('First launch detected');
    }
  } catch (error) {
    devError('Error during extension installation:', error);
  }
});

/**
 * Initialize service worker on browser startup
 * Restores state and performs capability checks
 */
chrome.runtime.onStartup.addListener(async () => {
  try {
    devLog('Reflexa AI service worker started');

    // Initialize AI Service
    aiService.initialize();

    // Opportunistically migrate storage keys on startup as well
    await migrateStorageKeysIfNeeded();

    // Check if Gemini Nano is available
    const available = await aiService.prompt.checkAvailability();
    if (available) {
      resetAIAvailability(); // Reset cache to mark as available
    }

    devLog('Gemini Nano available:', available);

    // Log all API capabilities
    const capabilities = aiService.getCapabilities();
    devLog('AI Capabilities:', capabilities);
  } catch (error) {
    devError('Error during service worker startup:', error);
  }
});

/**
 * Suppress benign Chrome extension errors
 * These are expected errors that don't affect functionality
 */
self.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason as Error | undefined;
  const message = reason?.message ?? '';

  // List of benign error patterns to suppress
  const benignPatterns = [
    // FrameDoesNotExistError - happens when iframes are destroyed
    /frame.*does not exist/i,
    // Connection errors when content script is unloaded
    /Could not establish connection/i,
    // Port errors when connection is closed unexpectedly
    /The port closed before a response was received/i,
  ];

  // Check if error matches any benign pattern
  if (benignPatterns.some((pattern) => pattern.test(message))) {
    devLog('Suppressed benign error:', message);
    event.preventDefault();
    return;
  }

  // Log unexpected unhandled rejections for debugging
  devWarn('Unhandled rejection:', reason);
});

/**
 * Migrate un-namespaced storage keys to namespaced keys.
 * This preserves existing user data while adopting safer key names.
 *
 * Migration is idempotent and safe to run multiple times.
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

    // Fetch both legacy and namespaced values in parallel
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

    // Check each legacy key and migrate if needed
    (Object.keys(legacyKeys) as (keyof typeof legacyKeys)[]).forEach((k) => {
      const legacyKey = legacyKeys[k];
      const namespacedKey = (STORAGE_KEYS as Record<string, string>)[k];
      const legacyHasValue = legacyValues[legacyKey] !== undefined;
      const namespacedHasValue = namespacedValues[namespacedKey] !== undefined;

      // Only migrate if legacy exists and namespaced doesn't
      if (legacyHasValue && !namespacedHasValue) {
        updates[namespacedKey] = legacyValues[legacyKey];
        removals.push(legacyKey);
      }
    });

    // Apply migrations if any keys need updating
    if (Object.keys(updates).length > 0) {
      await chrome.storage.local.set(updates);
      await chrome.storage.local.remove(removals);
      devLog(
        '[Storage] Migrated legacy keys to namespaced keys:',
        Object.keys(updates).length
      );
    }
  } catch (error) {
    devWarn('[Storage] Key migration failed:', error);
    // Don't throw - migration failure shouldn't block extension
  }
}
