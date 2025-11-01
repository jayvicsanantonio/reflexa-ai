/**
 * Rewriter Manager for Chrome Built-in Rewriter API
 * Handles text rewriting with tone adjustment while preserving meaning and structure
 * Implements timeout logic, retry mechanism, and session lifecycle management
 */

import type { TonePreset } from '../../../types';
import type { AIRewriter } from '../../../types/chrome-ai';
import { capabilityDetector } from '../../capabilityDetector';

/**
 * Timeout duration for rewriter operations (5 seconds)
 */
const REWRITER_TIMEOUT = 5000;

/**
 * Extended timeout for retry attempts (8 seconds)
 */
const RETRY_TIMEOUT = 8000;

interface RewriterLanguageOptions {
  expectedInputLanguages?: string[];
  expectedContextLanguages?: string[];
}

const normalizeLanguageKey = (languages?: string[]): string => {
  if (!languages || languages.length === 0) {
    return 'default';
  }
  return languages
    .map((lang) => lang.toLowerCase())
    .sort()
    .join('|');
};

/**
 * RewriterManager class
 * Manages Chrome Rewriter API sessions with tone mapping, error handling, and timeouts
 */
export class RewriterManager {
  private sessions = new Map<string, AIRewriter>();
  private available = false;

  /**
   * Check if Rewriter API is available
   * Uses capability detector for consistent availability checking
   * @returns Promise resolving to availability status
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const capabilities = await Promise.resolve(
        capabilityDetector.getCapabilities()
      );
      this.available = Boolean(capabilities.rewriter);
      return this.available;
    } catch (error) {
      console.error('Error checking Rewriter availability:', error);
      this.available = false;
      return false;
    }
  }

  /**
   * Check if Rewriter API is available (synchronous)
   * @returns True if Rewriter API is available
   */
  isAvailable(): boolean {
    return this.available;
  }

  /**
   * Map Reflexa tone presets to Rewriter API tone parameters
   * calm → neutral (as-is tone)
   * concise → shorter length
   * empathetic → more-casual tone
   * academic → more-formal tone
   * @param preset - Reflexa tone preset
   * @returns Rewriter API configuration
   */
  private mapTonePreset(preset: TonePreset): {
    tone: 'as-is' | 'more-formal' | 'more-casual';
    length: 'as-is' | 'shorter' | 'longer';
  } {
    switch (preset) {
      case 'calm':
        return { tone: 'as-is', length: 'as-is' };
      case 'concise':
        return { tone: 'as-is', length: 'shorter' };
      case 'empathetic':
        return { tone: 'more-casual', length: 'as-is' };
      case 'academic':
        return { tone: 'more-formal', length: 'as-is' };
      default:
        return { tone: 'as-is', length: 'as-is' };
    }
  }

  /**
   * Create or retrieve a rewriter session with specific configuration
   * Sessions are cached by configuration key for reuse
   * @param config - Rewriter configuration options
   * @returns AIRewriter session or null if unavailable
   */
  private async createSession(config: {
    sharedContext?: string;
    tone?: 'as-is' | 'more-formal' | 'more-casual';
    format?: 'as-is' | 'markdown' | 'plain-text';
    length?: 'as-is' | 'shorter' | 'longer';
    outputLanguage?: string;
    expectedInputLanguages?: string[];
    expectedContextLanguages?: string[];
  }): Promise<AIRewriter | null> {
    const sessionKey = `${config.tone ?? 'as-is'}-${
      config.format ?? 'as-is'
    }-${config.length ?? 'as-is'}-${config.outputLanguage ?? 'default'}-${normalizeLanguageKey(
      config.expectedInputLanguages
    )}-${normalizeLanguageKey(config.expectedContextLanguages)}`;

    // Return cached session if available
    if (this.sessions.has(sessionKey)) {
      return this.sessions.get(sessionKey)!;
    }

    try {
      // Access Rewriter from globalThis (service worker context)
      // Note: Rewriter API is accessed via global Rewriter, not ai.rewriter
      if (typeof Rewriter === 'undefined') {
        console.warn('Rewriter API not available');
        return null;
      }

      // Create new session with specified options
      const session = await Rewriter.create({
        sharedContext: config.sharedContext,
        tone: config.tone,
        format: config.format,
        length: config.length,
        ...(config.outputLanguage && { outputLanguage: config.outputLanguage }),
        ...(config.expectedInputLanguages &&
          config.expectedInputLanguages.length > 0 && {
            expectedInputLanguages: config.expectedInputLanguages,
          }),
        ...(config.expectedContextLanguages &&
          config.expectedContextLanguages.length > 0 && {
            expectedContextLanguages: config.expectedContextLanguages,
          }),
      });

      // Cache the session
      this.sessions.set(sessionKey, session);
      console.log(
        `Created rewriter session: ${sessionKey}${config.outputLanguage ? ` (language: ${config.outputLanguage})` : ''}`
      );

      return session;
    } catch (error) {
      console.error('Error creating rewriter session:', error);
      return null;
    }
  }

  /**
   * Rewrite text with specified tone preset
   * Implements timeout logic and retry mechanism
   * Preserves paragraph structure and original meaning
   * @param text - Text to rewrite
   * @param preset - Tone preset to apply
   * @param context - Optional context for better rewriting
   * @param outputLanguage - Target language for rewritten text
   * @returns Object containing both original and rewritten text
   * @throws Error if rewriting fails after retry
   */
  async rewrite(
    text: string,
    preset: TonePreset,
    context?: string,
    outputLanguage?: string,
    languageOptions?: RewriterLanguageOptions
  ): Promise<{ original: string; rewritten: string }> {
    // Check availability first
    if (!this.available) {
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        throw new Error('Rewriter API is not available');
      }
    }

    try {
      // First attempt with standard timeout
      const rewritten = await this.rewriteWithTimeout(
        text,
        preset,
        context,
        outputLanguage,
        languageOptions,
        REWRITER_TIMEOUT
      );
      return { original: text, rewritten };
    } catch (error) {
      console.warn('First rewrite attempt failed, retrying...', error);

      try {
        // Retry with extended timeout
        const rewritten = await this.rewriteWithTimeout(
          text,
          preset,
          context,
          outputLanguage,
          languageOptions,
          RETRY_TIMEOUT
        );
        return { original: text, rewritten };
      } catch (retryError) {
        console.error('Rewriting failed after retry:', retryError);
        throw new Error(
          `Text rewriting failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`
        );
      }
    }
  }

  /**
   * Rewrite with timeout wrapper
   * @param text - Text to rewrite
   * @param preset - Tone preset to apply
   * @param context - Optional context
   * @param outputLanguage - Target language for rewritten text
   * @param timeout - Timeout in milliseconds
   * @returns Rewritten text
   */
  private async rewriteWithTimeout(
    text: string,
    preset: TonePreset,
    context: string | undefined,
    outputLanguage: string | undefined,
    languageOptions: RewriterLanguageOptions | undefined,
    timeout: number
  ): Promise<string> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Rewriter timeout')), timeout);
    });

    const rewritePromise = this.executeRewrite(
      text,
      preset,
      context,
      outputLanguage,
      languageOptions
    );

    return Promise.race([rewritePromise, timeoutPromise]);
  }

  /**
   * Execute text rewriting
   * @param text - Text to rewrite
   * @param preset - Tone preset to apply
   * @param context - Optional context for better rewriting
   * @param outputLanguage - Target language for rewritten text
   * @returns Rewritten text
   */
  private async executeRewrite(
    text: string,
    preset: TonePreset,
    context?: string,
    outputLanguage?: string,
    languageOptions?: RewriterLanguageOptions
  ): Promise<string> {
    // Map tone preset to API parameters
    const { tone, length } = this.mapTonePreset(preset);

    // Build shared context if provided
    const sharedContext = context
      ? `Context: ${context}\n\nRewrite the following text with ${preset} tone:`
      : undefined;

    // Create session with configuration
    const session = await this.createSession({
      sharedContext,
      tone,
      format: 'plain-text',
      length,
      outputLanguage,
      expectedInputLanguages: languageOptions?.expectedInputLanguages,
      expectedContextLanguages: languageOptions?.expectedContextLanguages,
    });

    if (!session) {
      throw new Error('Failed to create rewriter session');
    }

    // Rewrite text while preserving structure
    const result = await session.rewrite(text, { context });

    // Return cleaned text
    return result.trim();
  }

  /**
   * Rewrite text with streaming support
   * Updates progressively as text is rewritten
   * @param text - Text to rewrite
   * @param preset - Tone preset to apply
   * @param context - Optional context for better rewriting
   * @param onChunk - Callback for each text chunk
   * @param outputLanguage - Target language for rewritten text
   * @returns Object containing both original and complete rewritten text
   */
  async rewriteStreaming(
    text: string,
    preset: TonePreset,
    context: string | undefined,
    onChunk: (chunk: string) => void,
    outputLanguage?: string,
    languageOptions?: RewriterLanguageOptions
  ): Promise<{ original: string; rewritten: string }> {
    // Check availability first
    if (!this.available) {
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        throw new Error('Rewriter API is not available');
      }
    }

    try {
      // Map tone preset to API parameters
      const { tone, length } = this.mapTonePreset(preset);

      // Build shared context if provided
      const sharedContext = context
        ? `Context: ${context}\n\nRewrite the following text with ${preset} tone:`
        : undefined;

      // Create session with configuration
      const session = await this.createSession({
        sharedContext,
        tone,
        format: 'plain-text',
        length,
        outputLanguage,
        expectedInputLanguages: languageOptions?.expectedInputLanguages,
        expectedContextLanguages: languageOptions?.expectedContextLanguages,
      });

      if (!session) {
        throw new Error('Failed to create rewriter session');
      }

      // Get streaming response and iterate using for await...of
      const stream = session.rewriteStreaming(text, { context });
      let fullText = '';

      // Use for await...of to iterate over the stream as per documentation
      for await (const chunk of stream) {
        fullText += chunk;
        // Call chunk callback for progressive UI updates
        onChunk(chunk);
      }

      return { original: text, rewritten: fullText.trim() };
    } catch (error) {
      console.error('Streaming rewrite failed:', error);
      throw new Error(
        `Streaming rewrite failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Clean up all active sessions
   * Should be called when the manager is no longer needed
   */
  destroy(): void {
    for (const [key, session] of this.sessions.entries()) {
      try {
        session.destroy();
        console.log(`Destroyed rewriter session: ${key}`);
      } catch (error) {
        console.error(`Error destroying session ${key}:`, error);
      }
    }
    this.sessions.clear();
  }

  /**
   * Clean up a specific session
   * @param preset - Tone preset to identify the session
   */
  destroySession(preset: TonePreset): void {
    const { tone, length } = this.mapTonePreset(preset);
    const sessionKey = `${tone}-${length}`;

    const session = this.sessions.get(sessionKey);
    if (session) {
      try {
        session.destroy();
        this.sessions.delete(sessionKey);
        console.log(`Destroyed rewriter session: ${sessionKey}`);
      } catch (error) {
        console.error(`Error destroying session ${sessionKey}:`, error);
      }
    }
  }
}
