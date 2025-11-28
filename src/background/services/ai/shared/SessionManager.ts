/**
 * Generic Session Manager
 * Follows Single Responsibility Principle (SRP) - only handles session lifecycle
 * Can be reused across all AI managers
 */

import type { ISessionManager } from './interfaces';
import { devLog, devError } from '../../../../utils/logger';

interface DestroyableSession {
  destroy(): void;
}

export class SessionManager<TSession extends DestroyableSession>
  implements ISessionManager<TSession>
{
  private sessions = new Map<string, TSession>();

  constructor(private readonly managerName: string) {}

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

  has(key: string): boolean {
    return this.sessions.has(key);
  }

  get(key: string): TSession | undefined {
    return this.sessions.get(key);
  }

  keys(): IterableIterator<string> {
    return this.sessions.keys();
  }
}
