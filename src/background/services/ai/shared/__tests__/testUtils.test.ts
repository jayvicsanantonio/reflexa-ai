/**
 * Tests for test utilities
 * Verifies that fast-check integration and mock generators work correctly
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  createMockSession,
  createMockSessionFactory,
  createFailingSessionFactory,
  createTrackedOperation,
  createEventuallySucceedingOperation,
  createDelayedOperation,
  sessionKeyArb,
  uniqueSessionKeysArb,
  timeoutArb,
  operationResultArb,
} from './testUtils';

describe('Test Utilities', () => {
  describe('createMockSession', () => {
    it('should create a mock session with destroy tracking', () => {
      const session = createMockSession('test-id');

      expect(session.id).toBe('test-id');
      expect(session.destroyed).toBe(false);

      session.destroy();

      expect(session.destroyed).toBe(true);
    });
  });

  describe('createMockSessionFactory', () => {
    it('should create a factory that returns the provided session', async () => {
      const session = createMockSession('factory-session');
      const factory = createMockSessionFactory(session);

      const result = await factory();

      expect(result).toBe(session);
    });

    it('should create a factory that returns null when no session provided', async () => {
      const factory = createMockSessionFactory(null);

      const result = await factory();

      expect(result).toBeNull();
    });
  });

  describe('createFailingSessionFactory', () => {
    it('should create a factory that rejects with the provided error', async () => {
      const error = new Error('Custom error');
      const factory = createFailingSessionFactory(error);

      await expect(factory()).rejects.toThrow('Custom error');
    });
  });

  describe('createTrackedOperation', () => {
    it('should track call count', async () => {
      const { operation, callCount } = createTrackedOperation('result');

      expect(callCount()).toBe(0);

      await operation();
      expect(callCount()).toBe(1);

      await operation();
      expect(callCount()).toBe(2);
    });
  });

  describe('createEventuallySucceedingOperation', () => {
    it('should fail specified number of times then succeed', async () => {
      const { operation, callCount } = createEventuallySucceedingOperation(
        'success',
        2
      );

      await expect(operation()).rejects.toThrow();
      expect(callCount()).toBe(1);

      await expect(operation()).rejects.toThrow();
      expect(callCount()).toBe(2);

      const result = await operation();
      expect(result).toBe('success');
      expect(callCount()).toBe(3);
    });
  });

  describe('createDelayedOperation', () => {
    it('should resolve after delay', async () => {
      const operation = createDelayedOperation('delayed-result', 10);

      const result = await operation();

      expect(result).toBe('delayed-result');
    });
  });
});

describe('fast-check Arbitraries', () => {
  it('sessionKeyArb generates non-empty strings', () => {
    fc.assert(
      fc.property(sessionKeyArb, (key) => {
        expect(key.length).toBeGreaterThanOrEqual(1);
        expect(key.length).toBeLessThanOrEqual(50);
      }),
      { numRuns: 100 }
    );
  });

  it('uniqueSessionKeysArb generates arrays of unique keys', () => {
    fc.assert(
      fc.property(uniqueSessionKeysArb, (keys) => {
        const uniqueSet = new Set(keys);
        expect(uniqueSet.size).toBe(keys.length);
        expect(keys.length).toBeGreaterThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });

  it('timeoutArb generates valid timeout values', () => {
    fc.assert(
      fc.property(timeoutArb, (timeout) => {
        expect(timeout).toBeGreaterThanOrEqual(10);
        expect(timeout).toBeLessThanOrEqual(5000);
      }),
      { numRuns: 100 }
    );
  });

  it('operationResultArb generates various result types', () => {
    const types = new Set<string>();

    fc.assert(
      fc.property(operationResultArb, (result) => {
        types.add(typeof result);
        return true;
      }),
      { numRuns: 100 }
    );

    // Should generate multiple types
    expect(types.size).toBeGreaterThan(1);
  });
});
