/**
 * Background service worker entry point
 * Orchestrates AI operations, manages data persistence, and coordinates between components
 */

import { AIManager } from './aiManager';
import { StorageManager } from './storageManager';
import { SettingsManager } from './settingsManager';
import type {
  Message,
  MessageType,
  AIResponse,
  Reflection,
  Settings,
} from '../types';
import { ERROR_MESSAGES } from '../constants';

console.log('Reflexa AI background service worker initialized');

// Initialize managers
const aiManager = new AIManager();
const storageManager = new StorageManager();
const settingsManager = new SettingsManager();

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
    'summarize',
    'reflect',
    'proofread',
    'save',
    'load',
    'getSettings',
    'updateSettings',
    'resetSettings',
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
      sendResponse({
        success: false,
        error: 'Invalid message format or type',
      } as AIResponse);
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
        sendResponse({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : ERROR_MESSAGES.GENERIC_ERROR,
        } as AIResponse);
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

    case 'summarize':
      return handleSummarize(message.payload);

    case 'reflect':
      return handleReflect(message.payload);

    case 'proofread':
      return handleProofread(message.payload);

    case 'save':
      return handleSave(message.payload);

    case 'load':
      return handleLoad(message.payload);

    case 'getSettings':
      return handleGetSettings();

    case 'updateSettings':
      return handleUpdateSettings(message.payload);

    case 'resetSettings':
      return handleResetSettings();

    default:
      return {
        success: false,
        error: `Unknown message type: ${String(message.type)}`,
      };
  }
}

/**
 * Handle AI availability check
 * @returns Response with availability status
 */
async function handleCheckAI(): Promise<AIResponse<boolean>> {
  try {
    const available = await aiManager.checkAvailability();
    aiAvailable = available;

    return {
      success: true,
      data: available,
    };
  } catch (error) {
    console.error('Error checking AI availability:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
    };
  }
}

/**
 * Handle summarization request
 * @param payload Content to summarize
 * @returns Response with summary bullets or error
 */
async function handleSummarize(
  payload: unknown
): Promise<AIResponse<string[]>> {
  try {
    // Validate payload
    if (typeof payload !== 'string' || !payload.trim()) {
      return {
        success: false,
        error: 'Invalid content for summarization',
      };
    }

    // Check AI availability
    if (!aiAvailable) {
      const available = await aiManager.checkAvailability();
      aiAvailable = available;

      if (!available) {
        return {
          success: false,
          error: ERROR_MESSAGES.AI_UNAVAILABLE,
        };
      }
    }

    // Call AI manager to summarize
    const summary = await aiManager.summarize(payload);

    // Check if summarization failed
    if (!summary || summary.length === 0) {
      return {
        success: false,
        error: ERROR_MESSAGES.AI_TIMEOUT,
      };
    }

    return {
      success: true,
      data: summary,
    };
  } catch (error) {
    console.error('Error in handleSummarize:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
    };
  }
}

/**
 * Handle reflection prompt generation request
 * @param payload Summary bullets to generate prompts from
 * @returns Response with reflection questions or error
 */
async function handleReflect(payload: unknown): Promise<AIResponse<string[]>> {
  try {
    // Validate payload
    if (!Array.isArray(payload) || payload.length === 0) {
      return {
        success: false,
        error: 'Invalid summary for reflection prompts',
      };
    }

    // Check AI availability
    if (!aiAvailable) {
      const available = await aiManager.checkAvailability();
      aiAvailable = available;

      if (!available) {
        return {
          success: false,
          error: ERROR_MESSAGES.AI_UNAVAILABLE,
        };
      }
    }

    // Call AI manager to generate reflection prompts
    const prompts = await aiManager.generateReflectionPrompts(
      payload as string[]
    );

    // Check if generation failed
    if (!prompts || prompts.length === 0) {
      return {
        success: false,
        error: ERROR_MESSAGES.AI_TIMEOUT,
      };
    }

    return {
      success: true,
      data: prompts,
    };
  } catch (error) {
    console.error('Error in handleReflect:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
    };
  }
}

/**
 * Handle proofreading request
 * @param payload Text to proofread
 * @returns Response with proofread text or error
 */
async function handleProofread(payload: unknown): Promise<AIResponse<string>> {
  try {
    // Validate payload
    if (typeof payload !== 'string' || !payload.trim()) {
      return {
        success: false,
        error: 'Invalid text for proofreading',
      };
    }

    // Check if proofreading is enabled in settings
    const settings = await settingsManager.getSettings();
    if (!settings.proofreadEnabled) {
      return {
        success: false,
        error: 'Proofreading is disabled in settings',
      };
    }

    // Check AI availability
    if (!aiAvailable) {
      const available = await aiManager.checkAvailability();
      aiAvailable = available;

      if (!available) {
        return {
          success: false,
          error: ERROR_MESSAGES.AI_UNAVAILABLE,
        };
      }
    }

    // Call AI manager to proofread
    const proofreadText = await aiManager.proofread(payload);

    return {
      success: true,
      data: proofreadText,
    };
  } catch (error) {
    console.error('Error in handleProofread:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
    };
  }
}

/**
 * Handle save reflection request
 * @param payload Reflection object to save
 * @returns Response with success status or error
 */
async function handleSave(payload: unknown): Promise<AIResponse<void>> {
  try {
    // Validate payload
    if (!payload || typeof payload !== 'object') {
      return {
        success: false,
        error: 'Invalid reflection data',
      };
    }

    const reflection = payload as Reflection;

    // Validate required fields
    if (!reflection.url || !reflection.title || !reflection.createdAt) {
      return {
        success: false,
        error: 'Missing required reflection fields',
      };
    }

    // Save reflection using storage manager
    await storageManager.saveReflection(reflection);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('Error in handleSave:', error);

    // Check if it's a storage full error
    if (error instanceof Error && error.message.includes('storage')) {
      return {
        success: false,
        error: ERROR_MESSAGES.STORAGE_FULL,
      };
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
    };
  }
}

/**
 * Handle load reflections request
 * @param payload Optional limit on number of reflections
 * @returns Response with reflections array or error
 */
async function handleLoad(payload: unknown): Promise<AIResponse<Reflection[]>> {
  try {
    // Parse limit if provided
    const limit =
      typeof payload === 'number' && payload > 0 ? payload : undefined;

    // Load reflections using storage manager
    const reflections = await storageManager.getReflections(limit);

    return {
      success: true,
      data: reflections,
    };
  } catch (error) {
    console.error('Error in handleLoad:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
    };
  }
}

/**
 * Handle get settings request
 * @returns Response with settings object or error
 */
async function handleGetSettings(): Promise<AIResponse<Settings>> {
  try {
    const settings = await settingsManager.getSettings();

    return {
      success: true,
      data: settings,
    };
  } catch (error) {
    console.error('Error in handleGetSettings:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
    };
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
  try {
    // Validate payload
    if (!payload || typeof payload !== 'object') {
      return {
        success: false,
        error: 'Invalid settings data',
      };
    }

    // Update settings using settings manager
    const updatedSettings = await settingsManager.updateSettings(
      payload as Partial<Settings>
    );

    return {
      success: true,
      data: updatedSettings,
    };
  } catch (error) {
    console.error('Error in handleUpdateSettings:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
    };
  }
}

/**
 * Handle reset settings request
 * @returns Response with default settings or error
 */
async function handleResetSettings(): Promise<AIResponse<Settings>> {
  try {
    // Reset settings to defaults using settings manager
    const defaultSettings = await settingsManager.resetToDefaults();

    return {
      success: true,
      data: defaultSettings,
    };
  } catch (error) {
    console.error('Error in handleResetSettings:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
    };
  }
}

/**
 * Check AI availability on extension startup
 */
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Reflexa AI extension installed');

  // Check if Gemini Nano is available
  const available = await aiManager.checkAvailability();
  aiAvailable = available;

  console.log('Gemini Nano available:', available);

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

  // Check if Gemini Nano is available
  const available = await aiManager.checkAvailability();
  aiAvailable = available;

  console.log('Gemini Nano available:', available);
});
