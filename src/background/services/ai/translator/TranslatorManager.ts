/**
 * Translator Manager - Refactored with SOLID principles
 */

import type { AITranslator } from '../../../../types/chrome-ai';
import type { ITranslatorManager } from './interfaces';
import { RetryHandler } from '../shared/RetryHandler';
import { capabilityDetector } from '../../capabilities/capabilityDetector';
import { devLog, devWarn, devError } from '../../../../utils/logger';

const TRANSLATE_TIMEOUT = 5000;
const RETRY_TIMEOUT = 8000;
const SESSION_TTL = 5 * 60 * 1000;

interface TranslationSession {
  session: AITranslator;
  sourceLanguage: string;
  targetLanguage: string;
  lastUsed: number;
}

export class TranslatorManager implements ITranslatorManager {
  private sessions = new Map<string, TranslationSession>();
  private retryHandler = new RetryHandler('Translation failed');
  private available = false;

  async checkAvailability(): Promise<boolean> {
    devLog('[TranslatorManager] Checking availability...');
    try {
      const capabilities = await Promise.resolve(
        capabilityDetector.getCapabilities()
      );
      this.available = Boolean(capabilities.translator);
      devLog(`[TranslatorManager] Available: ${this.available}`);
      return this.available;
    } catch (error) {
      devError('[TranslatorManager] Error checking availability:', error);
      this.available = false;
      return false;
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  private isTranslatorAvailable(): boolean {
    try {
      return typeof Translator !== 'undefined';
    } catch {
      return false;
    }
  }

  async canTranslate(
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<boolean> {
    devLog(
      `[TranslatorManager] Checking if can translate ${sourceLanguage} -> ${targetLanguage}`
    );
    if (!this.isTranslatorAvailable()) {
      devWarn('[TranslatorManager] Translator API not available');
      return false;
    }
    try {
      if (typeof Translator === 'undefined') return false;
      const status = await Translator.availability({
        sourceLanguage,
        targetLanguage,
      });
      const canTranslate = status === 'available' || status === 'downloadable';
      devLog(
        `[TranslatorManager] ${sourceLanguage} -> ${targetLanguage}: ${status}`
      );
      return canTranslate;
    } catch (error) {
      devError(
        `[TranslatorManager] Error checking translation availability:`,
        error
      );
      return false;
    }
  }

  private async createSession(
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<AITranslator | null> {
    const sessionKey = `${sourceLanguage}-${targetLanguage}`;
    const existing = this.sessions.get(sessionKey);

    if (existing) {
      const now = Date.now();
      if (now - existing.lastUsed < SESSION_TTL) {
        existing.lastUsed = now;
        return existing.session;
      }
      try {
        existing.session.destroy();
      } catch {
        /* ignore */
      }
      this.sessions.delete(sessionKey);
    }

    if (!this.isTranslatorAvailable() || typeof Translator === 'undefined') {
      devWarn('[TranslatorManager] Translator API not available');
      return null;
    }

    devLog(`[TranslatorManager] Creating new session: ${sessionKey}`);
    try {
      const startTime = performance.now();
      const session = await Translator.create({
        sourceLanguage,
        targetLanguage,
      });
      devLog(
        `[TranslatorManager] Created session in ${(performance.now() - startTime).toFixed(2)}ms`
      );
      this.sessions.set(sessionKey, {
        session,
        sourceLanguage,
        targetLanguage,
        lastUsed: Date.now(),
      });
      return session;
    } catch (error) {
      devError(`[TranslatorManager] Error creating session:`, error);
      return null;
    }
  }

  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<string> {
    devLog(
      `[TranslatorManager] translate() called: ${sourceLanguage ?? 'auto'} -> ${targetLanguage}`
    );

    if (!this.available) {
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) throw new Error('Translator API is not available');
    }

    if (!sourceLanguage) {
      throw new Error('Source language must be provided.');
    }

    const canTranslate = await this.canTranslate(
      sourceLanguage,
      targetLanguage
    );
    if (!canTranslate) {
      throw new Error(
        `Translation not available for ${sourceLanguage} -> ${targetLanguage}`
      );
    }

    return this.retryHandler.executeWithRetry(
      () => this.executeTranslate(text, sourceLanguage, targetLanguage),
      TRANSLATE_TIMEOUT,
      RETRY_TIMEOUT
    );
  }

  private async executeTranslate(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string> {
    const session = await this.createSession(sourceLanguage, targetLanguage);
    if (!session) throw new Error('Failed to create translator session');

    const hasMarkdown = this.detectMarkdown(text);
    if (hasMarkdown) {
      return this.translateWithMarkdown(session, text);
    }
    return (await session.translate(text)).trim();
  }

  private detectMarkdown(text: string): boolean {
    const patterns = [
      /^[-*+]\s+/m,
      /^\d+\.\s+/m,
      /^#{1,6}\s+/m,
      /\*\*.*\*\*/m,
      /\*.*\*/m,
      /\[.*\]\(.*\)/m,
    ];
    return patterns.some((p) => p.test(text));
  }

  private async translateWithMarkdown(
    session: AITranslator,
    text: string
  ): Promise<string> {
    const lines = text.split('\n');
    const translatedLines: string[] = [];

    for (const line of lines) {
      if (line.trim().length === 0) {
        translatedLines.push('');
        continue;
      }

      const bulletMatch = /^([-*+]\s+)(.*)/.exec(line);
      const numberedMatch = /^(\d+\.\s+)(.*)/.exec(line);
      const headerMatch = /^(#{1,6}\s+)(.*)/.exec(line);

      if (bulletMatch) {
        const [, marker, content] = bulletMatch;
        translatedLines.push(
          `${marker}${(await session.translate(content)).trim()}`
        );
      } else if (numberedMatch) {
        const [, marker, content] = numberedMatch;
        translatedLines.push(
          `${marker}${(await session.translate(content)).trim()}`
        );
      } else if (headerMatch) {
        const [, marker, content] = headerMatch;
        translatedLines.push(
          `${marker}${(await session.translate(content)).trim()}`
        );
      } else {
        translatedLines.push((await session.translate(line)).trim());
      }
    }
    return translatedLines.join('\n');
  }

  cleanupSessions(): void {
    const now = Date.now();
    for (const [key, session] of this.sessions.entries()) {
      if (now - session.lastUsed > SESSION_TTL) {
        try {
          session.session.destroy();
        } catch {
          /* ignore */
        }
        this.sessions.delete(key);
        devLog(`Cleaned up expired translator session: ${key}`);
      }
    }
  }

  destroy(): void {
    devLog(
      `[TranslatorManager] destroy() called (${this.sessions.size} sessions)`
    );
    for (const [key, session] of this.sessions.entries()) {
      try {
        session.session.destroy();
        devLog(`[TranslatorManager] Destroyed session: ${key}`);
      } catch (error) {
        devError(`[TranslatorManager] Error destroying session ${key}:`, error);
      }
    }
    this.sessions.clear();
  }

  destroySession(sourceLanguage: string, targetLanguage: string): void {
    const sessionKey = `${sourceLanguage}-${targetLanguage}`;
    const session = this.sessions.get(sessionKey);
    if (session) {
      try {
        session.session.destroy();
        this.sessions.delete(sessionKey);
        devLog(`Destroyed translator session: ${sessionKey}`);
      } catch (error) {
        devError(`Error destroying session ${sessionKey}:`, error);
      }
    }
  }
}

export const translatorManager = new TranslatorManager();
