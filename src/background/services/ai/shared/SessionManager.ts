/**
 * Generic Session Manager
 *
 * A generic class that manages the lifecycle of AI sessions, handling creation,
 * caching, and destruction of session instances. Follows Single Responsibility
 * Principle (SRP) - only handles session lifecycle.
 *
 * @typeParam TSession - The type of session being managed. Must implement a `destroy()` method.
 *
 * @example
 * ```typescript
 * // Create a session manager for writer sessions
 * const writerSessionManager = new SessionManager<AIWriterSession>('WriterManager');
 *
 * // Get or create a session
 * const session = await writerSessionManager.getOrCreate('default', async () => {
 *   return await ai.writer.create({ tone: 'formal' });
 * });
 *
 * // Check if a session exists
 * if (writerSessionManager.has('default')) {
 *   const existingSession = writerSessionManager.get('default');
 * }
 *
 * // Destroy a specific session
 * writerSessionManager.destroy('default');
 *
 * // Destroy all sessions
 * writerSessionManager.destroyAll();
 * ```
 */

import type { ISessionManager } from './interfaces';
import { devLog, devError } from '../../../../utils/logger';

/**
 * Interface for sessions that can be destroyed.
 * All sessions managed by SessionManager must implement this interface.
 */
export interface DestroyableSession {
  /** Destroys the session and releases associated resources */
  destroy(): void;
}

export class SessionManager<TSession extends DestroyableSession>
  implements ISessionManager<TSession>
{
  private sessions = new Map<string, TSession>();

  /**
   * Creates a new SessionManager instance.
   *
   * @param managerName - A descriptive name for this manager, used in log messages
   *
   * @example
   * ```typescript
   * const sessionManager = new SessionManager<WriterSession>('WriterManager');
   * ```
   */
  constructor(private readonly managerName: string) {}

  /**
   * Gets an existing session from the cache or creates a new one using the factory function.
   *
   * If a session with the given key already exists in the cache, it is returned immediately
   * without calling the factory function. Otherwise, the factory function is called to create
   * a new session, which is then cached and returned.
   *
   * @param key - A unique identifier for the session
   * @param factory - An async function that creates a new session instance
   * @returns The cached or newly created session, or null if creation fails
   *
   * @example
   * ```typescript
   * const session = await sessionManager.getOrCreate('formal-tone', async () => {
   *   return await ai.writer.create({ tone: 'formal' });
   * });
   *
   * if (session) {
   *   // Use the session
   * }
   * ```
   */
  async getOrCreate(
    key: string,
    factory: () => Promise<TSession | null>
  ): Promise<TSession | null> {
    if (this.sessions.has(key)) {
      return this.sessions.get(key)!;
    }

    try {
      const session = await factory();
      if (session) {
        this.sessions.set(key, session);
        devLog(`[${this.managerName}] Created session: ${key}`);
      }
      return session;
    } catch (error) {
      devError(`[${this.managerName}] Error creating session:`, error);
      return null;
    }
  }

  /**
   * Destroys a specific session and removes it from the cache.
   *
   * Calls the session's `destroy()` method and removes it from the internal cache.
   * If the session doesn't exist, this method does nothing.
   *
   * @param key - The unique identifier of the session to destroy
   *
   * @example
   * ```typescript
   * // Destroy a specific session when no longer needed
   * sessionManager.destroy('formal-tone');
   * ```
   */
  destroy(key: string): void {
    const session = this.sessions.get(key);
    if (session) {
      try {
        session.destroy();
        this.sessions.delete(key);
        devLog(`[${this.managerName}] Destroyed session: ${key}`);
      } catch (error) {
        devError(
          `[${this.managerName}] Error destroying session ${key}:`,
          error
        );
      }
    }
  }

  /**
   * Destroys all cached sessions and clears the cache.
   *
   * Iterates through all cached sessions, calls their `destroy()` methods,
   * and clears the internal cache. Useful for cleanup during extension unload
   * or when resetting state.
   *
   * @example
   * ```typescript
   * // Clean up all sessions when the extension is being unloaded
   * sessionManager.destroyAll();
   * ```
   */
  destroyAll(): void {
    for (const [key, session] of this.sessions.entries()) {
      try {
        session.destroy();
        devLog(`[${this.managerName}] Destroyed session: ${key}`);
      } catch (error) {
        devError(
          `[${this.managerName}] Error destroying session ${key}:`,
          error
        );
      }
    }
    this.sessions.clear();
  }

  /**
   * Checks if a session with the given key exists in the cache.
   *
   * @param key - The unique identifier of the session to check
   * @returns `true` if the session exists, `false` otherwise
   *
   * @example
   * ```typescript
   * if (sessionManager.has('formal-tone')) {
   *   console.log('Session exists');
   * }
   * ```
   */
  has(key: string): boolean {
    return this.sessions.has(key);
  }

  /**
   * Gets a session from the cache without creating a new one.
   *
   * @param key - The unique identifier of the session to retrieve
   * @returns The session if it exists, `undefined` otherwise
   *
   * @example
   * ```typescript
   * const session = sessionManager.get('formal-tone');
   * if (session) {
   *   // Use the existing session
   * }
   * ```
   */
  get(key: string): TSession | undefined {
    return this.sessions.get(key);
  }

  /**
   * Returns an iterator over all session keys in the cache.
   *
   * @returns An iterator that yields all session keys
   *
   * @example
   * ```typescript
   * for (const key of sessionManager.keys()) {
   *   console.log(`Session: ${key}`);
   * }
   * ```
   */
  keys(): IterableIterator<string> {
    return this.sessions.keys();
  }
}
