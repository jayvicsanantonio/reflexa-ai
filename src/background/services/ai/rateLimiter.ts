/**
 * Rate Limiter for Chrome AI APIs
 * Implements exponential backoff and quota tracking
 */

import { devWarn, devError } from '../../../utils/logger';

/**
 * Rate limit error detection
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('rate limit') ||
      message.includes('quota') ||
      message.includes('too many requests') ||
      message.includes('429')
    );
  }
  return false;
}

/**
 * Session error detection
 */
export function isSessionError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('session') ||
      message.includes('invalid session') ||
      message.includes('session expired') ||
      message.includes('session closed') ||
      message.includes('session not found')
    );
  }
  return false;
}

/**
 * Timeout error detection
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('timeout');
  }
  return false;
}

/**
 * Exponential backoff delays (in milliseconds)
 */
const BACKOFF_DELAYS = [2000, 4000, 8000]; // 2s, 4s, 8s

/**
 * Maximum retry attempts for rate-limited requests
 */
const MAX_RETRIES = 3;

/**
 * Usage statistics for tracking API calls
 */
interface UsageStats {
  summarizations: number;
  drafts: number;
  rewrites: number;
  proofreads: number;
  translations: number;
  languageDetections: number;
  sessionStart: number;
}

/**
 * Rate Limiter class
 * Handles retry logic with exponential backoff and usage tracking
 */
export class RateLimiter {
  private usageStats: UsageStats = {
    summarizations: 0,
    drafts: 0,
    rewrites: 0,
    proofreads: 0,
    translations: 0,
    languageDetections: 0,
    sessionStart: Date.now(),
  };

  /**
   * Execute a function with rate limit retry logic
   * @param fn - Async function to execute
   * @param operationType - Type of operation for tracking
   * @returns Result from the function
   * @throws Error if all retries fail
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    operationType: keyof Omit<UsageStats, 'sessionStart'>
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await fn();

        // Track successful operation
        this.trackUsage(operationType);

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if it's a rate limit error
        if (isRateLimitError(error)) {
          // If we have retries left, wait and try again
          if (attempt < MAX_RETRIES) {
            const delay = BACKOFF_DELAYS[attempt];
            devWarn(
              `Rate limit hit for ${operationType}. Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
            );
            await this.sleep(delay);
            continue;
          } else {
            // All retries exhausted
            devError(
              `Rate limit exceeded for ${operationType} after ${MAX_RETRIES} retries`
            );
            throw new Error(
              'AI temporarily busy. Please try again in a moment.'
            );
          }
        } else {
          // Not a rate limit error, throw immediately
          throw error;
        }
      }
    }

    // Should never reach here, but TypeScript needs this
    throw lastError ?? new Error('Unknown error in rate limiter');
  }

  /**
   * Track usage for an operation type
   * @param operationType - Type of operation to track
   */
  private trackUsage(
    operationType: keyof Omit<UsageStats, 'sessionStart'>
  ): void {
    this.usageStats[operationType]++;
  }

  /**
   * Get current usage statistics
   * @returns Usage statistics object
   */
  getUsageStats(): UsageStats {
    return { ...this.usageStats };
  }

  /**
   * Get total API operations count
   * @returns Total number of operations
   */
  getTotalOperations(): number {
    return (
      this.usageStats.summarizations +
      this.usageStats.drafts +
      this.usageStats.rewrites +
      this.usageStats.proofreads +
      this.usageStats.translations +
      this.usageStats.languageDetections
    );
  }

  /**
   * Reset usage statistics
   */
  resetStats(): void {
    this.usageStats = {
      summarizations: 0,
      drafts: 0,
      rewrites: 0,
      proofreads: 0,
      translations: 0,
      languageDetections: 0,
      sessionStart: Date.now(),
    };
  }

  /**
   * Check if approaching quota limits
   * Warning threshold: 80% of estimated quota
   * @returns True if approaching limits
   */
  isApproachingQuota(): boolean {
    const total = this.getTotalOperations();
    // Estimated quota: 100 operations per session
    // This is a conservative estimate; actual limits may vary
    const ESTIMATED_QUOTA = 100;
    const WARNING_THRESHOLD = 0.8;

    return total >= ESTIMATED_QUOTA * WARNING_THRESHOLD;
  }

  /**
   * Sleep for specified duration
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();
