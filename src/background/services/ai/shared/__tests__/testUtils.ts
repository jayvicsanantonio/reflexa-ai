/**
 * Test utilities for shared AI infrastructure
 * Provides mock generators and arbitraries for property-based testing
 */

import * as fc from 'fast-check';
import { vi } from 'vitest';

/**
 * Interface for mock sessions used in testing
 * The destroy method is typed as a function to satisfy DestroyableSession constraint
 */
export interface MockSession {
  id: string;
  destroy: (() => void) & { mock?: unknown };
  destroyed: boolean;
}

/**
 * Creates a mock session with tracking capabilities
 */
export function createMockSession(id = 'test-session'): MockSession {
  const session: MockSession = {
    id,
    destroyed: false,
    destroy: vi.fn(() => {
      session.destroyed = true;
    }),
  };
  return session;
}

/**
 * Creates a mock session factory for testing SessionManager
 */
export function createMockSessionFactory(
  session: MockSession | null = null
): () => Promise<MockSession | null> {
  const factory = vi.fn(() => Promise.resolve(session));
  return factory;
}

/**
 * Creates a failing mock session factory
 */
export function createFailingSessionFactory(
  error: Error = new Error('Factory failed')
): () => Promise<MockSession | null> {
  return vi.fn(() => Promise.reject(error));
}

// ============================================
// fast-check Arbitraries for Property Testing
// ============================================

/**
 * Arbitrary for generating valid session keys
 */
export const sessionKeyArb = fc.string({ minLength: 1, maxLength: 50 });

/**
 * Arbitrary for generating unique session keys (array of distinct keys)
 */
export const uniqueSessionKeysArb = fc.uniqueArray(sessionKeyArb, {
  minLength: 1,
  maxLength: 10,
});

/**
 * Arbitrary for generating mock session data
 */

/**
 * Arbitrary for generating timeout values (in milliseconds)
 */
export const timeoutArb = fc.integer({ min: 10, max: 5000 });

/**
 * Arbitrary for generating short timeout values for testing timeout scenarios
 */
export const shortTimeoutArb = fc.integer({ min: 1, max: 50 });

/**
 * Arbitrary for generating error messages
 */
export const errorMessageArb = fc.string({ minLength: 1, maxLength: 100 });

/**
 * Arbitrary for generating error prefixes
 */
export const errorPrefixArb = fc.string({ minLength: 1, maxLength: 50 });

/**
 * Arbitrary for generating operation results (generic values)
 */
export const operationResultArb = fc.oneof(
  fc.string(),
  fc.integer(),
  fc.boolean(),
  fc.record({ value: fc.string() })
);

/**
 * Creates a mock operation that succeeds after a specified delay
 */
export function createDelayedOperation<T>(
  result: T,
  delayMs: number
): () => Promise<T> {
  return () =>
    new Promise((resolve) => {
      setTimeout(() => resolve(result), delayMs);
    });
}

/**
 * Creates a mock operation that fails with a specified error
 */
export function createFailingOperation(
  error: Error = new Error('Operation failed')
): () => Promise<never> {
  return () => Promise.reject(error);
}

/**
 * Creates a mock operation that fails N times then succeeds
 */
export function createEventuallySucceedingOperation<T>(
  result: T,
  failCount: number,
  error: Error = new Error('Temporary failure')
): { operation: () => Promise<T>; callCount: () => number } {
  let calls = 0;
  const operation = () => {
    calls++;
    if (calls <= failCount) {
      return Promise.reject(error);
    }
    return Promise.resolve(result);
  };
  return { operation, callCount: () => calls };
}

/**
 * Creates a mock operation that tracks call count
 */
export function createTrackedOperation<T>(result: T): {
  operation: () => Promise<T>;
  callCount: () => number;
} {
  let calls = 0;
  const operation = () => {
    calls++;
    return Promise.resolve(result);
  };
  return { operation, callCount: () => calls };
}
