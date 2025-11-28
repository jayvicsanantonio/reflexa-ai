/**
 * Proofreader Manager - Refactored with SOLID principles
 */

import type {
  AIProofreader,
  AIProofreaderFactory,
  ProofreadResult as ChromeProofreadResult,
} from '../../../../types/chrome-ai';
import type {
  IProofreaderManager,
  ProofreadResult,
  ProofreaderConfig,
} from './interfaces';
import { RetryHandler } from '../shared/RetryHandler';
import { devLog, devWarn, devError } from '../../../../utils/logger';

const PROOFREADER_TIMEOUT = 30000;
const RETRY_TIMEOUT = 60000;

export class ProofreaderManager implements IProofreaderManager {
  private session: AIProofreader | null = null;
  private retryHandler = new RetryHandler('Proofreading failed');
  private available = false;

  async checkAvailability(): Promise<boolean> {
    devLog('[ProofreaderManager] Checking availability...');
    try {
      const ProofreaderAPI = (
        globalThis as typeof globalThis & { Proofreader?: AIProofreaderFactory }
      ).Proofreader;
      if (!ProofreaderAPI) {
        devWarn('[ProofreaderManager] Proofreader API not found in globalThis');
        this.available = false;
        return false;
      }
      const status = await ProofreaderAPI.availability();
      devLog(`[ProofreaderManager] API status: ${status}`);
      this.available = status === 'available' || status === 'downloadable';
      return this.available;
    } catch (error) {
      devError('[ProofreaderManager] Error checking availability:', error);
      this.available = false;
      return false;
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  private async createSession(
    config?: ProofreaderConfig
  ): Promise<AIProofreader | null> {
    if (this.session) {
      devLog('[ProofreaderManager] Reusing existing session');
      return this.session;
    }

    const languages = config?.expectedInputLanguages ?? ['en'];
    devLog(
      `[ProofreaderManager] Creating new session with languages: ${languages.join(', ')}`
    );

    try {
      const ProofreaderAPI = (
        globalThis as typeof globalThis & { Proofreader?: AIProofreaderFactory }
      ).Proofreader;
      if (!ProofreaderAPI) {
        devWarn('[ProofreaderManager] Proofreader API not available');
        return null;
      }

      const startTime = performance.now();
      const session = await ProofreaderAPI.create({
        expectedInputLanguages: languages,
      });
      devLog(
        `[ProofreaderManager] Created session in ${(performance.now() - startTime).toFixed(2)}ms`
      );
      this.session = session;
      return session;
    } catch (error) {
      devError('[ProofreaderManager] Error creating session:', error);
      return null;
    }
  }

  async proofread(
    text: string,
    options?: ProofreaderConfig
  ): Promise<ProofreadResult> {
    devLog(
      `[ProofreaderManager] proofread() called with text length: ${text.length}`
    );

    if (!this.available) {
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) throw new Error('Proofreader API is not available');
    }

    return this.retryHandler.executeWithRetry(
      () => this.executeProofread(text, options),
      PROOFREADER_TIMEOUT,
      RETRY_TIMEOUT
    );
  }

  private async executeProofread(
    text: string,
    options?: ProofreaderConfig
  ): Promise<ProofreadResult> {
    const session = await this.createSession(options);
    if (!session) throw new Error('Failed to create proofreader session');

    devLog('[ProofreaderManager] Calling session.proofread()...');
    const startTime = performance.now();
    const result: ChromeProofreadResult = await session.proofread(text);
    devLog(
      `[ProofreaderManager] Proofread completed in ${(performance.now() - startTime).toFixed(2)}ms, found ${result.corrections.length} corrections`
    );

    const corrections = result.corrections.map((correction) => ({
      startIndex: correction.startIndex,
      endIndex: correction.endIndex,
      original: text.substring(correction.startIndex, correction.endIndex),
    }));

    return {
      correctedText: result.correction?.trim() ?? text.trim(),
      corrections,
    };
  }

  destroy(): void {
    devLog('[ProofreaderManager] destroy() called');
    if (this.session) {
      try {
        this.session.destroy();
        devLog('[ProofreaderManager] Destroyed proofreader session');
      } catch (error) {
        devError('[ProofreaderManager] Error destroying session:', error);
      }
      this.session = null;
    }
  }
}
