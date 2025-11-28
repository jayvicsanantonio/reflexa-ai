/**
 * Shared Retry Handler
 *
 * A utility class that executes operations with automatic retry logic and timeout handling.
 * Follows Single Responsibility Principle (SRP) - only handles retry logic.
 * Can be reused across all AI managers to provide consistent retry behavior.
 *
 * @example
 * ```typescript
 * // Create a retry handler with a custom error prefix
 * const retryHandler = new RetryHandler('Translation failed');
 *
 * // Execute an operation with retry
 * try {
 *   const result = await retryHandler.executeWithRetry(
 *     async () => await translateText(text, targetLanguage),
 *     5000,  // 5 second initial timeout
 *     10000  // 10 second retry timeout
 *   );
 *   console.log('Translation:', result);
 * } catch (error) {
 *   console.error('Translation failed after retry:', error.message);
 * }
 * ```
 */

import type { IRetryHandler } from './interfaces';
import { devWarn, devError } from '../../../../utils/logger';

export class RetryHandler implements IRetryHandler {
  /**
   * Creates a new RetryHandler instance.
   *
   * @param errorPrefix - A prefix string to prepend to error messages when operations fail.
   *                      Defaults to 'Operation failed'. This helps identify which operation
   *                      failed when multiple retry handlers are used.
   *
   * @example
   * ```typescript
   * // Default error prefix
   * const handler1 = new RetryHandler();
   *
   * // Custom error prefix for better error identification
   * const handler2 = new RetryHandler('Summarization failed');
   * ```
   */
  constructor(private readonly errorPrefix = 'Operation failed') {}

  /**
   * Executes an operation with automatic retry on failure.
   *
   * First attempts to execute the operation with the initial timeout. If the operation
   * fails (either by throwing an error or exceeding the timeout), it automatically
   * retries once with the retry timeout. If both attempts fail, throws an error with
   * the configured error prefix.
   *
   * @typeParam T - The return type of the operation
   * @param operation - An async function that performs the operation to be executed
   * @param initialTimeout - Timeout in milliseconds for the first attempt
   * @param retryTimeout - Timeout in milliseconds for the retry attempt (typically longer)
   * @returns The result of the operation if successful
   * @throws Error with the error prefix and underlying error message if both attempts fail
   *
   * @example
   * ```typescript
   * const retryHandler = new RetryHandler('AI operation failed');
   *
   * // Execute with different timeouts for initial and retry attempts
   * const result = await retryHandler.executeWithRetry(
   *   async () => {
   *     const session = await ai.writer.create();
   *     return await session.write(prompt);
   *   },
   *   3000,   // 3 second initial timeout
   *   6000    // 6 second retry timeout (more lenient)
   * );
   * ```
   *
   * @example
   * ```typescript
   * // Handling the error case
   * try {
   *   await retryHandler.executeWithRetry(
   *     async () => await unreliableOperation(),
   *     1000,
   *     2000
   *   );
   * } catch (error) {
   *   // error.message will be: "AI operation failed: <underlying error message>"
   *   console.error(error.message);
   * }
   * ```
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    initialTimeout: number,
    retryTimeout: number
  ): Promise<T> {
    try {
      return await this.executeWithTimeout(operation, initialTimeout);
    } catch (error) {
      devWarn('First attempt failed, retrying...', error);

      try {
        return await this.executeWithTimeout(operation, retryTimeout);
      } catch (retryError) {
        devError('Operation failed after retry:', retryError);
        throw new Error(
          `${this.errorPrefix}: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`
        );
      }
    }
  }

  /**
   * Executes an operation with a timeout.
   *
   * @param operation - The async operation to execute
   * @param timeout - Maximum time in milliseconds to wait for the operation
   * @returns The result of the operation
   * @throws Error with message 'Operation timeout' if the timeout is exceeded
   * @private
   */
  private executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timeout')), timeout);
    });

    return Promise.race([operation(), timeoutPromise]);
  }
}
