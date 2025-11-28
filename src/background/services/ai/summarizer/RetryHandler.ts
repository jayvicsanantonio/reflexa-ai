/**
 * Retry Handler - Handles timeout and retry logic
 * Follows Single Responsibility Principle (SRP) - only handles retry logic
 */

import type { IRetryHandler } from './interfaces';
import { devWarn, devError } from '../../../../utils/logger';

export class RetryHandler implements IRetryHandler {
  constructor(private readonly errorPrefix = 'Summarization failed') {}

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
