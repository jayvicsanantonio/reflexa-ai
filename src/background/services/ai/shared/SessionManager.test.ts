/**
 * SessionManager Unit Tests
 * Tests for the generic SessionManager class covering session lifecycle management
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { DestroyableSession } from './SessionManager';
import { SessionManager } from './SessionManager';
import {
  createMockSession,
  createMockSessionFactory,
  createFailingSessionFactory,
  sessionKeyArb,
  uniqueSessionKeysArb,
} from './testUtils';

// Type alias for test sessions that satisfies DestroyableSession
type TestSession = DestroyableSession & { id: string; destroyed: boolean };

describe('SessionManager', () => {
  let sessionManager: SessionManager<TestSession>;

  beforeEach(() => {
    sessionManager = new SessionManager<TestSession>('TestManager');
  });

  describe('Unit Tests', () => {
    describe('getOrCreate', () => {
      it('should create a new session when key does not exist', async () => {
        const mockSession = createMockSession('session-1');
        const factory = createMockSessionFactory(mockSession);

        const result = await sessionManager.getOrCreate('key1', factory);

        expect(result).toBe(mockSession);
        expect(factory).toHaveBeenCalledTimes(1);
        expect(sessionManager.has('key1')).toBe(true);
      });

      it('should return cached session when key exists', async () => {
        const mockSession = createMockSession('session-1');
        const factory = createMockSessionFactory(mockSession);

        // First call creates the session
        await sessionManager.getOrCreate('key1', factory);

        // Create a new factory for second call
        const secondFactory = vi.fn(() =>
          Promise.resolve(createMockSession('session-2'))
        );

        // Second call should return cached session
        const result = await sessionManager.getOrCreate('key1', secondFactory);

        expect(result).toBe(mockSession);
        expect(secondFactory).not.toHaveBeenCalled();
      });

      it('should return null when factory returns null', async () => {
        const factory = createMockSessionFactory(null);

        const result = await sessionManager.getOrCreate('key1', factory);

        expect(result).toBeNull();
        expect(sessionManager.has('key1')).toBe(false);
      });

      it('should return null and not cache when factory throws error', async () => {
        const factory = createFailingSessionFactory(new Error('Factory error'));

        const result = await sessionManager.getOrCreate('key1', factory);

        expect(result).toBeNull();
        expect(sessionManager.has('key1')).toBe(false);
      });
    });

    describe('destroy', () => {
      it('should destroy session and remove from cache', async () => {
        const mockSession = createMockSession('session-1');
        const factory = createMockSessionFactory(mockSession);

        await sessionManager.getOrCreate('key1', factory);
        expect(sessionManager.has('key1')).toBe(true);

        sessionManager.destroy('key1');

        expect(mockSession.destroy).toHaveBeenCalledTimes(1);
        expect(mockSession.destroyed).toBe(true);
        expect(sessionManager.has('key1')).toBe(false);
      });

      it('should do nothing when destroying non-existent session', () => {
        // Should not throw
        expect(() => sessionManager.destroy('non-existent')).not.toThrow();
      });

      it('should handle error during session destroy gracefully', async () => {
        const mockSession = createMockSession('session-1');
        mockSession.destroy = vi.fn(() => {
          throw new Error('Destroy failed');
        });
        const factory = createMockSessionFactory(mockSession);

        await sessionManager.getOrCreate('key1', factory);

        // Should not throw, but should still remove from cache
        expect(() => sessionManager.destroy('key1')).not.toThrow();
      });
    });

    describe('destroyAll', () => {
      it('should destroy all sessions and clear cache', async () => {
        const session1 = createMockSession('session-1');
        const session2 = createMockSession('session-2');

        await sessionManager.getOrCreate(
          'key1',
          createMockSessionFactory(session1)
        );
        await sessionManager.getOrCreate(
          'key2',
          createMockSessionFactory(session2)
        );

        expect(sessionManager.has('key1')).toBe(true);
        expect(sessionManager.has('key2')).toBe(true);

        sessionManager.destroyAll();

        expect(session1.destroy).toHaveBeenCalledTimes(1);
        expect(session2.destroy).toHaveBeenCalledTimes(1);
        expect(sessionManager.has('key1')).toBe(false);
        expect(sessionManager.has('key2')).toBe(false);
      });

      it('should handle empty cache gracefully', () => {
        expect(() => sessionManager.destroyAll()).not.toThrow();
      });

      it('should continue destroying other sessions if one fails', async () => {
        const session1 = createMockSession('session-1');
        session1.destroy = vi.fn(() => {
          throw new Error('Destroy failed');
        });
        const session2 = createMockSession('session-2');

        await sessionManager.getOrCreate(
          'key1',
          createMockSessionFactory(session1)
        );
        await sessionManager.getOrCreate(
          'key2',
          createMockSessionFactory(session2)
        );

        sessionManager.destroyAll();

        expect(session1.destroy).toHaveBeenCalledTimes(1);
        expect(session2.destroy).toHaveBeenCalledTimes(1);
        expect(sessionManager.has('key1')).toBe(false);
        expect(sessionManager.has('key2')).toBe(false);
      });
    });

    describe('has', () => {
      it('should return true for existing session', async () => {
        const mockSession = createMockSession('session-1');
        await sessionManager.getOrCreate(
          'key1',
          createMockSessionFactory(mockSession)
        );

        expect(sessionManager.has('key1')).toBe(true);
      });

      it('should return false for non-existing session', () => {
        expect(sessionManager.has('non-existent')).toBe(false);
      });
    });

    describe('get', () => {
      it('should return session for existing key', async () => {
        const mockSession = createMockSession('session-1');
        await sessionManager.getOrCreate(
          'key1',
          createMockSessionFactory(mockSession)
        );

        expect(sessionManager.get('key1')).toBe(mockSession);
      });

      it('should return undefined for non-existing key', () => {
        expect(sessionManager.get('non-existent')).toBeUndefined();
      });
    });

    describe('keys', () => {
      it('should return iterator of all session keys', async () => {
        await sessionManager.getOrCreate(
          'key1',
          createMockSessionFactory(createMockSession('s1'))
        );
        await sessionManager.getOrCreate(
          'key2',
          createMockSessionFactory(createMockSession('s2'))
        );

        const keys = Array.from(sessionManager.keys());

        expect(keys).toContain('key1');
        expect(keys).toContain('key2');
        expect(keys.length).toBe(2);
      });
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * **Feature: next-phase-improvements, Property 1: Session creation stores and returns instance**
     * **Validates: Requirements 1.1**
     *
     * For any session key and factory function that returns a valid session,
     * when getOrCreate is called, the SessionManager should store the session
     * in its cache and return the same session instance.
     */
    it('Property 1: Session creation stores and returns instance', async () => {
      await fc.assert(
        fc.asyncProperty(sessionKeyArb, async (key) => {
          const manager = new SessionManager<TestSession>('TestManager');
          const mockSession = createMockSession(key);
          const factory = vi.fn(() => Promise.resolve(mockSession));

          const result = await manager.getOrCreate(key, factory);

          // Session should be returned
          expect(result).toBe(mockSession);
          // Session should be stored in cache
          expect(manager.has(key)).toBe(true);
          expect(manager.get(key)).toBe(mockSession);
          // Factory should have been called exactly once
          expect(factory).toHaveBeenCalledTimes(1);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: next-phase-improvements, Property 2: Cached session retrieval skips factory**
     * **Validates: Requirements 1.2**
     *
     * For any session key that already exists in the cache, when getOrCreate
     * is called again, the SessionManager should return the cached session
     * without invoking the factory function.
     */
    it('Property 2: Cached session retrieval skips factory', async () => {
      await fc.assert(
        fc.asyncProperty(sessionKeyArb, async (key) => {
          const manager = new SessionManager<TestSession>('TestManager');
          const originalSession = createMockSession('original');
          const newSession = createMockSession('new');

          // First call - creates session
          const firstFactory = vi.fn(() => Promise.resolve(originalSession));
          await manager.getOrCreate(key, firstFactory);

          // Second call - should use cache
          const secondFactory = vi.fn(() => Promise.resolve(newSession));
          const result = await manager.getOrCreate(key, secondFactory);

          // Should return original cached session
          expect(result).toBe(originalSession);
          // Second factory should never be called
          expect(secondFactory).not.toHaveBeenCalled();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: next-phase-improvements, Property 3: Session destruction calls destroy and removes from cache**
     * **Validates: Requirements 1.3**
     *
     * For any session key that exists in the cache, when destroy is called,
     * the SessionManager should call the session's destroy method and the
     * session should no longer exist in the cache.
     */
    it('Property 3: Session destruction calls destroy and removes from cache', async () => {
      await fc.assert(
        fc.asyncProperty(sessionKeyArb, async (key) => {
          const manager = new SessionManager<TestSession>('TestManager');
          const mockSession = createMockSession(key);
          const factory = vi.fn(() => Promise.resolve(mockSession));

          // Create session
          await manager.getOrCreate(key, factory);
          expect(manager.has(key)).toBe(true);

          // Destroy session
          manager.destroy(key);

          // Session's destroy method should have been called
          expect(mockSession.destroy).toHaveBeenCalledTimes(1);
          // Session should no longer be in cache
          expect(manager.has(key)).toBe(false);
          expect(manager.get(key)).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: next-phase-improvements, Property 4: DestroyAll destroys all sessions**
     * **Validates: Requirements 1.4**
     *
     * For any set of sessions in the cache, when destroyAll is called,
     * every session's destroy method should be called and the cache should be empty.
     */
    it('Property 4: DestroyAll destroys all sessions', async () => {
      await fc.assert(
        fc.asyncProperty(uniqueSessionKeysArb, async (keys) => {
          const manager = new SessionManager<TestSession>('TestManager');
          const sessions: TestSession[] = [];

          // Create sessions for all keys
          for (const key of keys) {
            const session = createMockSession(key);
            sessions.push(session);
            await manager.getOrCreate(key, () => Promise.resolve(session));
          }

          // Verify all sessions are in cache
          for (const key of keys) {
            expect(manager.has(key)).toBe(true);
          }

          // Destroy all sessions
          manager.destroyAll();

          // All sessions' destroy methods should have been called
          for (const session of sessions) {
            expect(session.destroy).toHaveBeenCalledTimes(1);
          }

          // Cache should be empty
          for (const key of keys) {
            expect(manager.has(key)).toBe(false);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
