/**
 * Session Pool - Manages summarizer session lifecycle
 * Follows Single Responsibility Principle (SRP) - only handles session management
 */

import type {
  AISummarizer,
  AISummarizerFactory,
} from '../../../../types/chrome-ai';
import type {
  ISessionPool,
  ISummarizerAPI,
  SummarizerSessionConfig,
} from './interfaces';
import { devLog, devError } from '../../../../utils/logger';

/**
 * Generate a unique key for session caching
 */
function generateSessionKey(config: SummarizerSessionConfig): string {
  const langKey =
    config.languageOptions?.expectedInputLanguages
      ?.map((l) => l.toLowerCase())
      .sort()
      .join('|') ?? 'default';

  const contextKey =
    config.languageOptions?.expectedContextLanguages
      ?.map((l) => l.toLowerCase())
      .sort()
      .join('|') ?? 'default';

  return `${config.type}-${config.format}-${config.length}-${config.outputLanguage ?? 'default'}-${langKey}-${contextKey}`;
}

/**
 * Chrome Summarizer API adapter
 */
export class ChromeSummarizerAPI implements ISummarizerAPI {
  isAvailable(): boolean {
    const SummarizerAPI = (
      globalThis as typeof globalThis & { Summarizer?: AISummarizerFactory }
    ).Summarizer;
    return Boolean(SummarizerAPI);
  }

  async create(config: SummarizerSessionConfig): Promise<AISummarizer | null> {
    devError('[ChromeSummarizerAPI] create called with config:', config);
    const SummarizerAPI = (
      globalThis as typeof globalThis & { Summarizer?: AISummarizerFactory }
    ).Summarizer;

    if (!SummarizerAPI) {
      devError('[ChromeSummarizerAPI] Summarizer API not found in globalThis');
      return null;
    }

    devError('[ChromeSummarizerAPI] Calling Summarizer.create...');

    // Add timeout for Summarizer.create() which can hang indefinitely
    const createTimeout = 10000; // 10 seconds
    try {
      const session = await Promise.race([
        SummarizerAPI.create({
          type: config.type,
          format: config.format,
          length: config.length,
          ...(config.outputLanguage && {
            outputLanguage: config.outputLanguage,
          }),
          ...(config.languageOptions?.expectedInputLanguages?.length && {
            expectedInputLanguages:
              config.languageOptions.expectedInputLanguages,
          }),
          ...(config.languageOptions?.expectedContextLanguages?.length && {
            expectedContextLanguages:
              config.languageOptions.expectedContextLanguages,
          }),
        }),
        new Promise<null>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  'Summarizer.create() timeout - Gemini Nano may not be ready'
                )
              ),
            createTimeout
          )
        ),
      ]);
      devError('[ChromeSummarizerAPI] Summarizer.create returned:', !!session);
      return session;
    } catch (error) {
      devError('[ChromeSummarizerAPI] Summarizer.create failed:', error);
      throw error;
    }
  }
}

/**
 * Session pool implementation
 */
export class SessionPool implements ISessionPool {
  private sessions = new Map<string, AISummarizer>();

  constructor(private readonly api: ISummarizerAPI) {}

  async getOrCreate(
    config: SummarizerSessionConfig
  ): Promise<AISummarizer | null> {
    const key = generateSessionKey(config);
    devError('[SessionPool] getOrCreate called with key:', key);

    if (this.sessions.has(key)) {
      devError('[SessionPool] Returning cached session');
      return this.sessions.get(key)!;
    }

    devError('[SessionPool] Creating new session...');
    try {
      const session = await this.api.create(config);
      devError('[SessionPool] Session created:', !!session);
      if (session) {
        this.sessions.set(key, session);
        devLog(`Created summarizer session: ${key}`);
      }
      return session;
    } catch (error) {
      devError('Error creating summarizer session:', error);
      return null;
    }
  }

  destroy(key: string): void {
    const session = this.sessions.get(key);
    if (session) {
      try {
        session.destroy();
        this.sessions.delete(key);
        devLog(`Destroyed summarizer session: ${key}`);
      } catch (error) {
        devError(`Error destroying session ${key}:`, error);
      }
    }
  }

  destroyAll(): void {
    for (const [key, session] of this.sessions.entries()) {
      try {
        session.destroy();
        devLog(`Destroyed summarizer session: ${key}`);
      } catch (error) {
        devError(`Error destroying session ${key}:`, error);
      }
    }
    this.sessions.clear();
  }
}
