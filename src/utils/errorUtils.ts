/**
 * Centralized error handling utilities
 * Provides consistent error handling patterns across the application
 */

/**
 * Safe error message extraction
 * Handles various error types and produces readable messages
 *
 * @param error Unknown error object
 * @returns Safe error message string
 */
export function getErrorMessage(error: unknown): string {
  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle strings
  if (typeof error === 'string') {
    return error;
  }

  // Handle objects with message property
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  ) {
    return (error as Record<string, unknown>).message as string;
  }

  // Handle objects with error property
  if (
    error &&
    typeof error === 'object' &&
    'error' in error &&
    typeof (error as Record<string, unknown>).error === 'string'
  ) {
    return (error as Record<string, unknown>).error as string;
  }

  // Fallback
  return 'An unknown error occurred';
}

/**
 * Get detailed error information for debugging
 * Includes stack trace when available
 *
 * @param error Unknown error object
 * @returns Detailed error info with stack trace
 */
export function getDetailedErrorInfo(error: unknown): string {
  let message = getErrorMessage(error);

  if (error instanceof Error && error.stack) {
    message += `\n${error.stack}`;
  }

  return message;
}

/**
 * Check if error is likely a network error
 * Helps determine if retry logic should apply
 *
 * @param error Unknown error object
 * @returns true if error appears to be network-related
 */
export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();

  const networkPatterns = [
    'network',
    'connection',
    'timeout',
    'fetch',
    'xhr',
    'offline',
    'unreachable',
  ];

  return networkPatterns.some((pattern) => message.includes(pattern));
}

/**
 * Check if error is likely a permission/auth error
 *
 * @param error Unknown error object
 * @returns true if error appears to be permission-related
 */
export function isPermissionError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();

  const permissionPatterns = [
    'permission',
    'unauthorized',
    'forbidden',
    'access denied',
    'not allowed',
  ];

  return permissionPatterns.some((pattern) => message.includes(pattern));
}

/**
 * Create a retry decorator function for async operations
 * Implements exponential backoff strategy
 *
 * @param maxAttempts Maximum number of retry attempts
 * @param initialDelay Initial delay in milliseconds
 * @returns Decorator function
 */
export function withRetry(maxAttempts = 3, initialDelay = 100) {
  return function <T extends unknown[], R>(
    target: (...args: T) => Promise<R>
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      let lastError: unknown;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await target(...args);
        } catch (error) {
          lastError = error;

          // Don't retry on permission errors
          if (isPermissionError(error)) {
            throw error;
          }

          // Calculate backoff delay: 100ms, 200ms, 400ms, etc.
          const delay = initialDelay * Math.pow(2, attempt - 1);

          // Don't delay on last attempt
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      throw lastError;
    };
  };
}

/**
 * Timeout promise utility
 * Rejects if promise doesn't resolve within specified time
 *
 * @param promise Promise to wrap
 * @param ms Timeout in milliseconds
 * @param message Timeout error message
 * @returns Promise that rejects on timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    ),
  ]);
}

/**
 * Safe JSON parsing with error handling
 *
 * @param json JSON string to parse
 * @param fallback Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Assert condition, throw error if false
 * Useful for invariant checks
 *
 * @param condition Condition to check
 * @param message Error message if condition is false
 */
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}
