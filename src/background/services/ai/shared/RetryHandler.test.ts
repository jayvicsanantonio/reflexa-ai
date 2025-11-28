/**
 * RetryHandler Unit and Property-Based Tests
 * Tests for the RetryHandler class covering retry logic and timeout handling
 *
 * Requirements: 1.5, 1.6, 1.7, 1.8
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { RetryHandler } from './RetryHandler';
import {
  createTrackedOperation,
  createEventuallySucceedingOperation,
  createFailingOperation,
  createDelayedOperation,
  operationResultArb,
  errorMessageArb,
  errorPrefixArb,
  timeoutArb,
  shortTimeoutArb,
} from './testUtils';

describe('RetryHandler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Unit Tests', () => {
    describe('successful first attempt', () => {
      it('should return result without retrying when operation succeeds', async () => {
        vi.useRealTimers();
        const handler = new RetryHandler();
        const { operation, callCount } = createTrackedOperation('success');

        const result = await handler.executeWithRetry(operation, 1000, 2000);

        expect(result).toBe('success');
        expect(callCount()).toBe(1);
      });

      it('should work with different result types', async () => {
        vi.useRealTimers();
        const handler = new RetryHandler();
        const objectResult = { data: 'test', value: 42 };
        const { operation } = createTrackedOperation(objectResult);

        const result = await handler.executeWithRetry(operation, 1000, 2000);

        expect(result).toEqual(objectResult);
      });
    });

    describe('successful retry after failure', () => {
      it('should return result from retry when first attempt fails', async () => {
        vi.useRealTimers();
        const handler = new RetryHandler();
        const { operation, callCount } = createEventuallySucceedingOperation(
          'retry-success',
          1
        );

        const result = await handler.executeWithRetry(operation, 1000, 2000);

        expect(result).toBe('retry-success');
        expect(callCount()).toBe(2);
      });
    });

    describe('failure after both attempts', () => {
      it('should throw formatted error when both attempts fail', async () => {
        vi.useRealTimers();
        const handler = new RetryHandler('Custom prefix');
        const operation = createFailingOperation(new Error('Persistent error'));

        await expect(
          handler.executeWithRetry(operation, 1000, 2000)
        ).rejects.toThrow('Custom prefix: Persistent error');
      });

      it('should handle non-Error exceptions', async () => {
        vi.useRealTimers();
        const handler = new RetryHandler('Operation failed');
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        const operation = () => Promise.reject('string error');

        await expect(
          handler.executeWithRetry(operation, 1000, 2000)
        ).rejects.toThrow('Operation failed: Unknown error');
      });

      it('should use default error prefix when not specified', async () => {
        vi.useRealTimers();
        const handler = new RetryHandler();
        const operation = createFailingOperation(new Error('Test error'));

        await expect(
          handler.executeWithRetry(operation, 1000, 2000)
        ).rejects.toThrow('Operation failed: Test error');
      });
    });

    describe('timeout handling', () => {
      it('should reject with timeout error when operation exceeds initial timeout', async () => {
        vi.useRealTimers();
        const handler = new RetryHandler();
        // Use a very short timeout to make the test fast
        const slowOperation = createDelayedOperation('result', 500);

        await expect(
          handler.executeWithRetry(slowOperation, 10, 10)
        ).rejects.toThrow('Operation timeout');
      });

      it('should reject with timeout error when retry also times out', async () => {
        vi.useRealTimers();
        const handler = new RetryHandler('Timed out');
        const slowOperation = createDelayedOperation('result', 500);

        await expect(
          handler.executeWithRetry(slowOperation, 10, 10)
        ).rejects.toThrow('Timed out: Operation timeout');
      });
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * **Feature: next-phase-improvements, Property 5: Successful operation returns result without retry**
     * **Validates: Requirements 1.5**
     *
     * For any operation that succeeds on the first attempt, the RetryHandler
     * should return the result and the operation should only be called once.
     */
    it('Property 5: Successful operation returns result without retry', async () => {
      await fc.assert(
        fc.asyncProperty(
          operationResultArb,
          timeoutArb,
          timeoutArb,
          async (expectedResult, initialTimeout, retryTimeout) => {
            const handler = new RetryHandler();
            const { operation, callCount } =
              createTrackedOperation(expectedResult);

            const result = await handler.executeWithRetry(
              operation,
              initialTimeout,
              retryTimeout
            );

            // Result should match expected
            expect(result).toEqual(expectedResult);
            // Operation should only be called once
            expect(callCount()).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: next-phase-improvements, Property 6: Failed then successful operation returns retry result**
     * **Validates: Requirements 1.6**
     *
     * For any operation that fails on the first attempt but succeeds on retry,
     * the RetryHandler should return the result from the retry attempt.
     */
    it('Property 6: Failed then successful operation returns retry result', async () => {
      await fc.assert(
        fc.asyncProperty(
          operationResultArb,
          errorMessageArb,
          async (expectedResult, errorMessage) => {
            const handler = new RetryHandler();
            const { operation, callCount } =
              createEventuallySucceedingOperation(
                expectedResult,
                1,
                new Error(errorMessage)
              );

            const result = await handler.executeWithRetry(
              operation,
              5000,
              5000
            );

            // Result should match expected from retry
            expect(result).toEqual(expectedResult);
            // Operation should be called exactly twice
            expect(callCount()).toBe(2);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: next-phase-improvements, Property 7: Double failure throws formatted error**
     * **Validates: Requirements 1.7**
     *
     * For any operation that fails on both attempts, the RetryHandler should
     * throw an error containing the error prefix and the underlying error message.
     */
    it('Property 7: Double failure throws formatted error', async () => {
      await fc.assert(
        fc.asyncProperty(
          errorPrefixArb,
          errorMessageArb,
          async (prefix, errorMessage) => {
            const handler = new RetryHandler(prefix);
            const operation = createFailingOperation(new Error(errorMessage));

            await expect(
              handler.executeWithRetry(operation, 5000, 5000)
            ).rejects.toThrow(`${prefix}: ${errorMessage}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: next-phase-improvements, Property 8: Timeout rejection**
     * **Validates: Requirements 1.8**
     *
     * For any operation that takes longer than the specified timeout,
     * the RetryHandler should reject with a timeout error before the operation completes.
     */
    it('Property 8: Timeout rejection', async () => {
      // Use real timers for this test since we need actual timing
      vi.useRealTimers();

      await fc.assert(
        fc.asyncProperty(shortTimeoutArb, async (timeout) => {
          const handler = new RetryHandler('Timeout test');
          // Create an operation that takes much longer than the timeout
          const operationDelay = timeout + 1000;
          const slowOperation = createDelayedOperation(
            'result',
            operationDelay
          );

          const startTime = Date.now();

          await expect(
            handler.executeWithRetry(slowOperation, timeout, timeout)
          ).rejects.toThrow('Operation timeout');

          const elapsed = Date.now() - startTime;
          // Should reject before the operation would have completed
          // Allow some tolerance for test execution overhead
          expect(elapsed).toBeLessThan(operationDelay);
        }),
        { numRuns: 20 } // Fewer runs due to actual timing
      );
    });
  });
});
