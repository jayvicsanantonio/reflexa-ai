/**
 * Translator Manager for Chrome Built-in Translator API
 * Handles text translation between languages with session management
 * Implements formatting preservation and language pair validation
 */

import type { AITranslator } from '../../../types/chrome-ai';
import { capabilityDetector } from '../capabilities/capabilityDetector';

/**
 * Timeout duration for translation operations (5 seconds)
 */
const TRANSLATE_TIMEOUT = 5000;

/**
 * Extended timeout for retry attempts (8 seconds)
 */
const RETRY_TIMEOUT = 8000;

/**
 * Supported languages for translation
 * ISO 639-1 language codes
 */
export const SUPPORTED_LANGUAGES = [
  'en', // English
  'es', // Spanish
  'fr', // French
  'de', // German
  'it', // Italian
  'pt', // Portuguese
  'zh', // Chinese
  'ja', // Japanese
  'ko', // Korean
  'ar', // Arabic
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Translation session cache entry
 */
interface TranslationSession {
  session: AITranslator;
  sourceLanguage: string;
  targetLanguage: string;
  lastUsed: number;
}

/**
 * TranslatorManager class
 * Manages Chrome Translator API sessions with language pair validation
 */
export class TranslatorManager {
  private sessions = new Map<string, TranslationSession>();
  private available = false;
  private readonly SESSION_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if Translator API is available
   * Uses capability detector for consistent availability checking
   * @returns Promise resolving to availability status
   */
  async checkAvailability(): Promise<boolean> {
    console.log('[TranslatorManager] Checking availability...');
    try {
      const capabilities = await Promise.resolve(
        capabilityDetector.getCapabilities()
      );
      this.available = Boolean(capabilities.translator);
      console.log(`[TranslatorManager] Available: ${this.available}`);
      return this.available;
    } catch (error) {
      console.error('[TranslatorManager] Error checking availability:', error);
      this.available = false;
      return false;
    }
  }

  /**
   * Check if Translator API is available (synchronous)
   * @returns True if Translator API is available
   */
  isAvailable(): boolean {
    return this.available;
  }

  /**
   * Check if global Translator API is available
   * @returns True if Translator API is available
   */
  private isTranslatorAvailable(): boolean {
    try {
      // Access global Translator object (service worker context)
      return typeof Translator !== 'undefined';
    } catch (error) {
      console.error('Error accessing Translator API:', error);
      return false;
    }
  }

  /**
   * Check if translation is available for a specific language pair
   * @param sourceLanguage - Source language ISO 639-1 code
   * @param targetLanguage - Target language ISO 639-1 code
   * @returns Promise resolving to availability status
   */
  async canTranslate(
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<boolean> {
    console.log(
      `[TranslatorManager] Checking if can translate ${sourceLanguage} -> ${targetLanguage}`
    );

    if (!this.isTranslatorAvailable()) {
      console.warn('[TranslatorManager] Translator API not available');
      return false;
    }

    try {
      // Type guard: we've already checked Translator exists
      if (typeof Translator === 'undefined') {
        return false;
      }

      const status = await Translator.availability({
        sourceLanguage,
        targetLanguage,
      });
      const canTranslate = status === 'available' || status === 'downloadable';
      console.log(
        `[TranslatorManager] ${sourceLanguage} -> ${targetLanguage}: ${status} (can translate: ${canTranslate})`
      );
      return canTranslate;
    } catch (error) {
      console.error(
        `[TranslatorManager] Error checking translation availability for ${sourceLanguage} -> ${targetLanguage}:`,
        error
      );
      return false;
    }
  }

  /**
   * Create or retrieve a translation session for a language pair
   * Sessions are cached for better performance
   * @param sourceLanguage - Source language ISO 639-1 code
   * @param targetLanguage - Target language ISO 639-1 code
   * @returns AITranslator session or null if unavailable
   */
  private async createSession(
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<AITranslator | null> {
    const sessionKey = `${sourceLanguage}-${targetLanguage}`;

    // Check for existing session
    const existing = this.sessions.get(sessionKey);
    if (existing) {
      // Check if session is still valid (not expired)
      const now = Date.now();
      if (now - existing.lastUsed < this.SESSION_TTL) {
        console.log(
          `[TranslatorManager] Reusing cached session: ${sessionKey} (age: ${((now - existing.lastUsed) / 1000).toFixed(1)}s)`
        );
        existing.lastUsed = now;
        return existing.session;
      } else {
        // Session expired, clean it up
        console.log(
          `[TranslatorManager] Session expired: ${sessionKey} (age: ${((now - existing.lastUsed) / 1000).toFixed(1)}s)`
        );
        try {
          existing.session.destroy();
        } catch (error) {
          console.error(
            '[TranslatorManager] Error destroying expired session:',
            error
          );
        }
        this.sessions.delete(sessionKey);
      }
    }

    if (!this.isTranslatorAvailable()) {
      console.warn('[TranslatorManager] Translator API not available');
      return null;
    }

    console.log(`[TranslatorManager] Creating new session: ${sessionKey}`);

    try {
      // Type guard: we've already checked Translator exists
      if (typeof Translator === 'undefined') {
        return null;
      }

      // Create new session with options object
      const startTime = performance.now();
      const session = await Translator.create({
        sourceLanguage,
        targetLanguage,
      });
      const duration = performance.now() - startTime;

      // Cache the session
      this.sessions.set(sessionKey, {
        session,
        sourceLanguage,
        targetLanguage,
        lastUsed: Date.now(),
      });

      console.log(
        `[TranslatorManager] Created session in ${duration.toFixed(2)}ms (total sessions: ${this.sessions.size})`
      );

      return session;
    } catch (error) {
      console.error(
        `[TranslatorManager] Error creating session for ${sessionKey}:`,
        error
      );
      return null;
    }
  }

  /**
   * Translate text from source language to target language
   * Implements timeout logic, retry mechanism, and formatting preservation
   * @param text - Text to translate
   * @param sourceLanguage - Source language ISO 639-1 code (auto-detect if not provided)
   * @param targetLanguage - Target language ISO 639-1 code
   * @returns Translated text
   * @throws Error if translation fails after retry
   */
  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<string> {
    console.log(
      `[TranslatorManager] translate() called: ${sourceLanguage ?? 'auto'} -> ${targetLanguage}, text length: ${text.length}`
    );

    // Check availability first
    if (!this.available) {
      console.log(
        '[TranslatorManager] API not available, checking availability...'
      );
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        throw new Error('Translator API is not available');
      }
    }

    // If source language not provided, we need to detect it first
    // For now, we'll require source language to be provided
    // In a full implementation, this would integrate with LanguageDetectorManager
    if (!sourceLanguage) {
      throw new Error(
        'Source language must be provided. Auto-detection requires Language Detector API integration.'
      );
    }

    // Validate language pair availability
    const canTranslate = await this.canTranslate(
      sourceLanguage,
      targetLanguage
    );
    if (!canTranslate) {
      throw new Error(
        `Translation not available for ${sourceLanguage} -> ${targetLanguage}`
      );
    }

    try {
      // First attempt with standard timeout
      console.log(
        `[TranslatorManager] Attempting translation with ${TRANSLATE_TIMEOUT}ms timeout`
      );
      const result = await this.translateWithTimeout(
        text,
        sourceLanguage,
        targetLanguage,
        TRANSLATE_TIMEOUT
      );
      console.log(
        `[TranslatorManager] Translation successful, output length: ${result.length}`
      );
      return result;
    } catch (error) {
      console.warn(
        '[TranslatorManager] First translation attempt failed, retrying...',
        error
      );

      try {
        // Retry with extended timeout
        console.log(
          `[TranslatorManager] Retrying with ${RETRY_TIMEOUT}ms timeout`
        );
        const result = await this.translateWithTimeout(
          text,
          sourceLanguage,
          targetLanguage,
          RETRY_TIMEOUT
        );
        console.log(
          `[TranslatorManager] Retry successful, output length: ${result.length}`
        );
        return result;
      } catch (retryError) {
        console.error(
          '[TranslatorManager] Translation failed after retry:',
          retryError
        );
        throw new Error(
          `Translation failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`
        );
      }
    }
  }

  /**
   * Translate with timeout wrapper
   * @param text - Text to translate
   * @param sourceLanguage - Source language code
   * @param targetLanguage - Target language code
   * @param timeout - Timeout in milliseconds
   * @returns Translated text
   */
  private async translateWithTimeout(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    timeout: number
  ): Promise<string> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Translation timeout')), timeout);
    });

    const translatePromise = this.executeTranslate(
      text,
      sourceLanguage,
      targetLanguage
    );

    return Promise.race([translatePromise, timeoutPromise]);
  }

  /**
   * Execute translation with formatting preservation
   * Preserves markdown formatting including bullet points and line breaks
   * @param text - Text to translate
   * @param sourceLanguage - Source language code
   * @param targetLanguage - Target language code
   * @returns Translated text
   */
  private async executeTranslate(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string> {
    // Get or create session for this language pair
    const session = await this.createSession(sourceLanguage, targetLanguage);

    if (!session) {
      throw new Error('Failed to create translator session');
    }

    try {
      // Detect if text contains markdown formatting
      const hasMarkdown = this.detectMarkdown(text);

      if (hasMarkdown) {
        // Preserve markdown formatting by translating segments
        return await this.translateWithMarkdown(session, text);
      } else {
        // Simple translation for plain text
        const result = await session.translate(text);
        return result.trim();
      }
    } catch (error) {
      console.error('Translation execution failed:', error);
      throw error;
    }
  }

  /**
   * Detect if text contains markdown formatting
   * @param text - Text to check
   * @returns True if markdown formatting detected
   */
  private detectMarkdown(text: string): boolean {
    // Check for common markdown patterns
    const markdownPatterns = [
      /^[-*+]\s+/m, // Bullet points
      /^\d+\.\s+/m, // Numbered lists
      /^#{1,6}\s+/m, // Headers
      /\*\*.*\*\*/m, // Bold
      /\*.*\*/m, // Italic
      /\[.*\]\(.*\)/m, // Links
    ];

    return markdownPatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Translate text while preserving markdown formatting
   * Splits text into segments and translates each segment
   * @param session - Translator session
   * @param text - Text with markdown formatting
   * @returns Translated text with preserved formatting
   */
  private async translateWithMarkdown(
    session: AITranslator,
    text: string
  ): Promise<string> {
    // Split by line breaks to preserve structure
    const lines = text.split('\n');
    const translatedLines: string[] = [];

    for (const line of lines) {
      if (line.trim().length === 0) {
        // Preserve empty lines
        translatedLines.push('');
        continue;
      }

      // Check if line starts with markdown syntax
      const bulletMatch = /^([-*+]\s+)(.*)/.exec(line);
      const numberedMatch = /^(\d+\.\s+)(.*)/.exec(line);
      const headerMatch = /^(#{1,6}\s+)(.*)/.exec(line);

      if (bulletMatch) {
        // Translate content after bullet marker
        const [, marker, content] = bulletMatch;
        const translatedContent = await session.translate(content);
        translatedLines.push(`${marker}${translatedContent.trim()}`);
      } else if (numberedMatch) {
        // Translate content after number marker
        const [, marker, content] = numberedMatch;
        const translatedContent = await session.translate(content);
        translatedLines.push(`${marker}${translatedContent.trim()}`);
      } else if (headerMatch) {
        // Translate content after header marker
        const [, marker, content] = headerMatch;
        const translatedContent = await session.translate(content);
        translatedLines.push(`${marker}${translatedContent.trim()}`);
      } else {
        // Translate entire line
        const translatedLine = await session.translate(line);
        translatedLines.push(translatedLine.trim());
      }
    }

    return translatedLines.join('\n');
  }

  /**
   * Clean up expired sessions
   */
  cleanupSessions(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, session] of this.sessions.entries()) {
      if (now - session.lastUsed > this.SESSION_TTL) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      const session = this.sessions.get(key);
      if (session) {
        try {
          session.session.destroy();
          this.sessions.delete(key);
          console.log(`Cleaned up expired translator session: ${key}`);
        } catch (error) {
          console.error(`Error cleaning up session ${key}:`, error);
        }
      }
    }

    if (keysToDelete.length > 0) {
      console.log(`Cleaned up ${keysToDelete.length} expired sessions`);
    }
  }

  /**
   * Clean up all active sessions
   * Should be called when the manager is no longer needed
   */
  destroy(): void {
    console.log(
      `[TranslatorManager] destroy() called (${this.sessions.size} sessions)`
    );
    for (const [key, session] of this.sessions.entries()) {
      try {
        session.session.destroy();
        console.log(`[TranslatorManager] Destroyed session: ${key}`);
      } catch (error) {
        console.error(
          `[TranslatorManager] Error destroying session ${key}:`,
          error
        );
      }
    }
    this.sessions.clear();
    console.log('[TranslatorManager] All sessions destroyed');
  }

  /**
   * Clean up a specific session for a language pair
   * @param sourceLanguage - Source language code
   * @param targetLanguage - Target language code
   */
  destroySession(sourceLanguage: string, targetLanguage: string): void {
    const sessionKey = `${sourceLanguage}-${targetLanguage}`;
    const session = this.sessions.get(sessionKey);

    if (session) {
      try {
        session.session.destroy();
        this.sessions.delete(sessionKey);
        console.log(`Destroyed translator session: ${sessionKey}`);
      } catch (error) {
        console.error(`Error destroying session ${sessionKey}:`, error);
      }
    }
  }
}

// Export singleton instance
export const translatorManager = new TranslatorManager();
