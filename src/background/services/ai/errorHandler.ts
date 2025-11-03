/**
 * Centralized error handling for Chrome AI APIs
 * Provides consistent error handling, retry logic, and fallback strategies
 */

import {
  isRateLimitError,
  isSessionError,
  isTimeoutError,
} from './rateLimiter';
import { devWarn, devError } from '../../../utils/logger';

/**
 * Error types for AI operations
 */
export enum AIErrorType {
  RATE_LIMIT = 'rate_limit',
  TIMEOUT = 'timeout',
  SESSION = 'session',
  UNAVAILABLE = 'unavailable',
  UNKNOWN = 'unknown',
}

/**
 * AI Error class with additional metadata
 */
export class AIError extends Error {
  constructor(
    message: string,
    public readonly type: AIErrorType,
    public readonly originalError?: Error,
    public readonly retryable = false
  ) {
    super(message);
    this.name = 'AIError';
  }
}

/**
 * Classify error type
 */
export function classifyError(error: unknown): AIErrorType {
  if (isRateLimitError(error)) {
    return AIErrorType.RATE_LIMIT;
  }
  if (isTimeoutError(error)) {
    return AIErrorType.TIMEOUT;
  }
  if (isSessionError(error)) {
    return AIErrorType.SESSION;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('not available') || message.includes('unavailable')) {
      return AIErrorType.UNAVAILABLE;
    }
  }
  return AIErrorType.UNKNOWN;
}

/**
 * Create user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  const errorType = classifyError(error);

  switch (errorType) {
    case AIErrorType.RATE_LIMIT:
      return 'AI temporarily busy. Please try again in a moment.';
    case AIErrorType.TIMEOUT:
      return 'AI operation timed out. Please try again.';
    case AIErrorType.SESSION:
      return 'AI session error. Retrying...';
    case AIErrorType.UNAVAILABLE:
      return 'AI feature not available in your browser.';
    case AIErrorType.UNKNOWN:
    default:
      if (error instanceof Error) {
        return error.message;
      }
      return 'An unexpected error occurred.';
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const errorType = classifyError(error);
  return (
    errorType === AIErrorType.RATE_LIMIT ||
    errorType === AIErrorType.TIMEOUT ||
    errorType === AIErrorType.SESSION
  );
}

/**
 * Exponential backoff delays (in milliseconds)
 */
const BACKOFF_DELAYS = [2000, 4000, 8000]; // 2s, 4s, 8s

/**
 * Execute function with retry logic
 * Handles rate limiting, timeouts, and session errors
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    onRetry?: (attempt: number, error: unknown) => void;
    operationName?: string;
  } = {}
): Promise<T> {
  const { maxRetries = 3, onRetry, operationName = 'operation' } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const errorType = classifyError(error);

      // Check if error is retryable
      if (!isRetryableError(error)) {
        throw new AIError(
          getUserFriendlyMessage(error),
          errorType,
          lastError,
          false
        );
      }

      // If we have retries left, wait and try again
      if (attempt < maxRetries) {
        const delay =
          BACKOFF_DELAYS[Math.min(attempt, BACKOFF_DELAYS.length - 1)];

        devWarn(
          `[${operationName}] ${errorType} error. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`,
          error
        );

        // Call retry callback if provided
        if (onRetry) {
          onRetry(attempt + 1, error);
        }

        await sleep(delay);
        continue;
      } else {
        // All retries exhausted
        devError(
          `[${operationName}] Failed after ${maxRetries} retries`,
          error
        );
        throw new AIError(
          getUserFriendlyMessage(error),
          errorType,
          lastError,
          false
        );
      }
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError ?? new Error('Unknown error in retry logic');
}

/**
 * Execute function with timeout
 */
export async function executeWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  operationName = 'operation'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error(`${operationName} timeout after ${timeoutMs}ms`)),
      timeoutMs
    );
  });

  return Promise.race([fn(), timeoutPromise]);
}

/**
 * Execute function with timeout and retry logic
 * Combines timeout handling with exponential backoff retry
 */
export async function executeWithTimeoutAndRetry<T>(
  fn: () => Promise<T>,
  options: {
    initialTimeout?: number;
    retryTimeout?: number;
    onRetry?: (attempt: number, error: unknown) => void;
    operationName?: string;
  } = {}
): Promise<T> {
  const {
    initialTimeout = 5000,
    retryTimeout = 8000,
    onRetry,
    operationName = 'operation',
  } = options;

  // First attempt with initial timeout
  try {
    return await executeWithTimeout(fn, initialTimeout, operationName);
  } catch (error) {
    devWarn(
      `[${operationName}] First attempt failed, retrying with extended timeout...`,
      error
    );

    if (onRetry) {
      onRetry(1, error);
    }

    // Retry with extended timeout
    try {
      return await executeWithTimeout(fn, retryTimeout, operationName);
    } catch (retryError) {
      devError(
        `[${operationName}] Failed after retry with extended timeout`,
        retryError
      );
      throw new AIError(
        getUserFriendlyMessage(retryError),
        classifyError(retryError),
        retryError instanceof Error
          ? retryError
          : new Error(String(retryError)),
        false
      );
    }
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Session error handler with automatic cleanup
 * Attempts to recreate session on session errors
 */
export async function handleSessionError<T>(
  error: unknown,
  recreateSession: () => Promise<void>,
  retryOperation: () => Promise<T>,
  operationName = 'operation'
): Promise<T> {
  if (isSessionError(error)) {
    devWarn(
      `[${operationName}] Session error detected, attempting to recreate session...`
    );

    try {
      // Recreate the session
      await recreateSession();

      // Retry the operation with the new session
      return await retryOperation();
    } catch (retryError) {
      devError(
        `[${operationName}] Failed to recover from session error`,
        retryError
      );
      throw new AIError(
        'Failed to recover from session error',
        AIErrorType.SESSION,
        retryError instanceof Error
          ? retryError
          : new Error(String(retryError)),
        false
      );
    }
  }

  // Not a session error, rethrow
  throw error;
}
