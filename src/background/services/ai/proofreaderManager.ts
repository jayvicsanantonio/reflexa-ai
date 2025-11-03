/**
 * Proofreader Manager for Chrome Built-in Proofreader API
 * Handles grammar checking and text correction
 * Implements timeout logic, retry mechanism, and session lifecycle management
 *
 * Note: The Proofreader API is accessed via the global Proofreader object,
 * not through ai.proofreader
 */

import type {
  AIProofreader,
  AIProofreaderFactory,
  ProofreadResult as ChromeProofreadResult,
} from '../../../types/chrome-ai';
import { devLog, devWarn, devError } from '../../../utils/logger';

/**
 * Our application's ProofreadResult with additional metadata
 */
export interface ProofreadResult {
  correctedText: string;
  corrections: {
    startIndex: number;
    endIndex: number;
    original: string;
  }[];
}

/**
 * Timeout duration for proofreader operations (30 seconds)
 */
const PROOFREADER_TIMEOUT = 30000;

/**
 * Extended timeout for retry attempts (60 seconds)
 */
const RETRY_TIMEOUT = 60000;

/**
 * ProofreaderManager class
 * Manages Chrome Proofreader API sessions with change tracking, error handling, and timeouts
 */
export class ProofreaderManager {
  private session: AIProofreader | null = null;
  private available = false;

  /**
   * Check if Proofreader API is available
   * The Proofreader API is accessed via the global Proofreader object
   * @returns Promise resolving to availability status
   */
  async checkAvailability(): Promise<boolean> {
    devLog('[ProofreaderManager] Checking availability...');
    try {
      // Check if Proofreader global exists
      const ProofreaderAPI = (
        globalThis as typeof globalThis & { Proofreader?: AIProofreaderFactory }
      ).Proofreader;

      if (!ProofreaderAPI) {
        devWarn('[ProofreaderManager] Proofreader API not found in globalThis');
        this.available = false;
        return false;
      }

      // Check availability status
      const status = await ProofreaderAPI.availability();
      devLog(`[ProofreaderManager] API status: ${status}`);
      this.available = status === 'available' || status === 'downloadable';
      devLog(`[ProofreaderManager] Available: ${this.available}`);
      return this.available;
    } catch (error) {
      devError('[ProofreaderManager] Error checking availability:', error);
      this.available = false;
      return false;
    }
  }

  /**
   * Check if Proofreader API is available (synchronous)
   * @returns True if Proofreader API is available
   */
  isAvailable(): boolean {
    return this.available;
  }

  /**
   * Create or retrieve a proofreader session
   * Only one session is maintained at a time
   * @param config - Proofreader configuration options
   * @returns AIProofreader session or null if unavailable
   */
  private async createSession(config?: {
    expectedInputLanguages?: string[];
  }): Promise<AIProofreader | null> {
    // Return cached session if available
    if (this.session) {
      devLog('[ProofreaderManager] Reusing existing session');
      return this.session;
    }

    const languages = config?.expectedInputLanguages ?? ['en'];
    devLog(
      `[ProofreaderManager] Creating new session with languages: ${languages.join(', ')}`
    );

    try {
      // Access Proofreader from global scope
      const ProofreaderAPI = (
        globalThis as typeof globalThis & { Proofreader?: AIProofreaderFactory }
      ).Proofreader;

      if (!ProofreaderAPI) {
        devWarn('[ProofreaderManager] Proofreader API not available');
        return null;
      }

      // Create new session with specified options
      const startTime = performance.now();
      const session = await ProofreaderAPI.create({
        expectedInputLanguages: languages,
      });
      const duration = performance.now() - startTime;

      // Cache the session
      this.session = session;
      devLog(
        `[ProofreaderManager] Created session in ${duration.toFixed(2)}ms`
      );

      return session;
    } catch (error) {
      devError('[ProofreaderManager] Error creating session:', error);
      return null;
    }
  }

  /**
   * Proofread text with grammar and clarity checking
   * Implements timeout logic and retry mechanism
   * @param text - Text to proofread
   * @param options - Optional configuration
   * @returns ProofreadResult with corrected text and corrections
   * @throws Error if proofreading fails after retry
   */
  async proofread(
    text: string,
    options?: { expectedInputLanguages?: string[] }
  ): Promise<ProofreadResult> {
    devLog(
      `[ProofreaderManager] proofread() called with text length: ${text.length}, languages: ${options?.expectedInputLanguages?.join(', ') ?? 'default'}`
    );

    // Check availability first
    if (!this.available) {
      devLog(
        '[ProofreaderManager] API not available, checking availability...'
      );
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        throw new Error('Proofreader API is not available');
      }
    }

    try {
      // First attempt with standard timeout
      devLog(
        `[ProofreaderManager] Attempting proofread with ${PROOFREADER_TIMEOUT}ms timeout`
      );
      return await this.proofreadWithTimeout(
        text,
        PROOFREADER_TIMEOUT,
        options
      );
    } catch (error) {
      devWarn(
        '[ProofreaderManager] First proofread attempt failed, retrying...',
        error
      );

      try {
        // Retry with extended timeout
        devLog(`[ProofreaderManager] Retrying with ${RETRY_TIMEOUT}ms timeout`);
        return await this.proofreadWithTimeout(text, RETRY_TIMEOUT, options);
      } catch (retryError) {
        devError(
          '[ProofreaderManager] Proofreading failed after retry:',
          retryError
        );
        throw new Error(
          `Proofreading failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`
        );
      }
    }
  }

  /**
   * Proofread with timeout wrapper
   * @param text - Text to proofread
   * @param timeout - Timeout in milliseconds
   * @param options - Optional configuration
   * @returns ProofreadResult with corrected text and corrections
   */
  private async proofreadWithTimeout(
    text: string,
    timeout: number,
    options?: { expectedInputLanguages?: string[] }
  ): Promise<ProofreadResult> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Proofreader timeout')), timeout);
    });

    const proofreadPromise = this.executeProofread(text, options);

    return Promise.race([proofreadPromise, timeoutPromise]);
  }

  /**
   * Execute proofreading operation
   * @param text - Text to proofread
   * @param options - Optional configuration
   * @returns ProofreadResult with corrected text and corrections
   */
  private async executeProofread(
    text: string,
    options?: { expectedInputLanguages?: string[] }
  ): Promise<ProofreadResult> {
    // Create session
    const session = await this.createSession(options);

    if (!session) {
      throw new Error('Failed to create proofreader session');
    }

    // Call API - returns ChromeProofreadResult
    devLog('[ProofreaderManager] Calling session.proofread()...');
    const startTime = performance.now();
    const result: ChromeProofreadResult = await session.proofread(text);
    const duration = performance.now() - startTime;
    devLog(
      `[ProofreaderManager] Proofread completed in ${duration.toFixed(2)}ms, found ${result.corrections.length} corrections`
    );

    // Transform Chrome API result to our application format
    const corrections = result.corrections.map((correction) => ({
      startIndex: correction.startIndex,
      endIndex: correction.endIndex,
      original: text.substring(correction.startIndex, correction.endIndex),
    }));

    devLog(
      `[ProofreaderManager] Corrections: ${corrections.map((c) => `"${c.original}"`).join(', ')}`
    );

    return {
      correctedText: result.correction?.trim() ?? text.trim(),
      corrections,
    };
  }

  /**
   * Clean up the active session
   * Should be called when the manager is no longer needed
   */
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
    } else {
      devLog('[ProofreaderManager] No session to destroy');
    }
  }
}
