/**
 * Utility operation handlers
 * Handles utility operations: checkAI, checkAllAI, getCapabilities, getUsageStats, getPerformanceStats, tab operations
 */

import { aiService } from '../../services/ai/aiService';
import { rateLimiter } from '../../services/ai/rateLimiter';
import { performanceMonitor } from '../../services/ai/performanceMonitor';
import { ensureAIAvailable, resetAIAvailability } from './shared';
import { createSuccessResponse, createErrorResponse } from '../../../types';
import { devLog, devError } from '../../../utils/logger';
import type {
  AIResponse,
  AICapabilities,
  UsageStats,
  PerformanceStats,
} from '../../../types';
import { ERROR_MESSAGES } from '../../../constants';

// Export reset function for external use
export { resetAIAvailability };

/**
 * Handle AI availability check (Prompt API only)
 */
export async function handleCheckAI(): Promise<AIResponse<boolean>> {
  const startTime = Date.now();
  try {
    const available = await ensureAIAvailable();

    return createSuccessResponse(available, 'prompt', Date.now() - startTime);
  } catch (error) {
    devError('Error checking AI availability:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'prompt'
    );
  }
}

/**
 * Handle all AI APIs availability check
 */
export async function handleCheckAllAI(): Promise<
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
    devError('Error checking all AI availability:', error);
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
 */
export function handleGetCapabilities(
  payload?: unknown
): AIResponse<AICapabilities> {
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
      devLog(
        `[GetCapabilities] Refreshing capabilities (experimental: ${experimentalMode})`
      );
      capabilities = aiService.refreshCapabilities(experimentalMode);
    } else {
      devLog('[GetCapabilities] Using cached capabilities');
      capabilities = aiService.getCapabilities();
    }

    return createSuccessResponse(
      capabilities,
      'unified',
      Date.now() - startTime
    );
  } catch (error) {
    devError('Error getting capabilities:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'unified'
    );
  }
}

/**
 * Handle get usage statistics request
 */
export function handleGetUsageStats(): AIResponse<{
  stats: UsageStats;
  total: number;
  approachingQuota: boolean;
}> {
  const startTime = Date.now();
  try {
    const stats = rateLimiter.getUsageStats();
    const total = rateLimiter.getTotalOperations();
    const approachingQuota = rateLimiter.isApproachingQuota();

    // Back-compat: expose totalOperations inside stats as well
    const statsWithTotal: UsageStats = {
      ...(stats as UsageStats),
      // @ts-expect-error allow injection if missing
      totalOperations:
        (stats as unknown as { totalOperations?: number }).totalOperations ??
        total,
    };

    return createSuccessResponse(
      { stats: statsWithTotal, total, approachingQuota },
      'unified',
      Date.now() - startTime
    );
  } catch (error) {
    devError('Error in handleGetUsageStats:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'unified'
    );
  }
}

/**
 * Handle get performance statistics request
 */
export function handleGetPerformanceStats(): AIResponse<PerformanceStats> {
  const startTime = Date.now();
  try {
    const stats = performanceMonitor.getStats();
    return createSuccessResponse(stats, 'unified', Date.now() - startTime);
  } catch (error) {
    devError('Error in handleGetPerformanceStats:', error);
    // Return empty stats rather than failing
    return createSuccessResponse(
      {
        averageResponseTime: 0,
        slowestOperation: null,
        fastestOperation: null,
        totalOperations: 0,
        slowOperationsCount: 0,
        operationsByType: {},
        operationsByAPI: {},
      },
      'unified',
      Date.now() - startTime
    );
  }
}

/**
 * Ask the active tab's content script to open the Dashboard modal.
 */
export async function handleOpenDashboardInActiveTab(): Promise<
  AIResponse<boolean>
> {
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
export async function handleStartReflectInActiveTab(): Promise<
  AIResponse<boolean>
> {
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
