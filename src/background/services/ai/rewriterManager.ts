/**
 * Rewriter Manager for Chrome Built-in Rewriter API
 * Handles text rewriting with tone adjustment while preserving meaning and structure
 * Implements timeout logic, retry mechanism, and session lifecycle management
 */

import type { TonePreset } from '../../../types';
import type { AIRewriter } from '../../../types/chrome-ai';
import { capabilityDetector } from '../capabilities/capabilityDetector';

/**
 * Timeout duration for rewriter operations (5 seconds)
 */
const REWRITER_TIMEOUT = 5000;

/**
 * Extended timeout for retry attempts (8 seconds)
 */
const RETRY_TIMEOUT = 8000;

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
    console.log('[RewriterManager] Checking availability...');
    try {
      const capabilities = await Promise.resolve(
        capabilityDetector.getCapabilities()
      );
      this.available = Boolean(capabilities.rewriter);
      console.log(`[RewriterManager] Available: ${this.available}`);
      return this.available;
    } catch (error) {
      console.error('[RewriterManager] Error checking availability:', error);
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
  }): Promise<AIRewriter | null> {
    const sessionKey = `${config.tone ?? 'as-is'}-${config.format ?? 'as-is'}-${config.length ?? 'as-is'}`;

    // Return cached session if available
    if (this.sessions.has(sessionKey)) {
      console.log(`[RewriterManager] Reusing cached session: ${sessionKey}`);
      return this.sessions.get(sessionKey)!;
    }

    console.log(`[RewriterManager] Creating new session: ${sessionKey}`);

    try {
      // Access Rewriter from globalThis (service worker context)
      // Note: Rewriter API is accessed via global Rewriter, not ai.rewriter
      if (typeof Rewriter === 'undefined') {
        console.warn('[RewriterManager] Rewriter API not available');
        return null;
      }

      // Create new session with specified options
      const startTime = performance.now();
      const session = await Rewriter.create({
        sharedContext: config.sharedContext,
        tone: config.tone,
        format: config.format,
        length: config.length,
      });
      const duration = performance.now() - startTime;

      // Cache the session
      this.sessions.set(sessionKey, session);
      console.log(
        `[RewriterManager] Created session in ${duration.toFixed(2)}ms (total sessions: ${this.sessions.size})`
      );

      return session;
    } catch (error) {
      console.error('[RewriterManager] Error creating session:', error);
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
   * @returns Object containing both original and rewritten text
   * @throws Error if rewriting fails after retry
   */
  async rewrite(
    text: string,
    preset: TonePreset,
    context?: string
  ): Promise<{ original: string; rewritten: string }> {
    console.log(
      `[RewriterManager] rewrite() called with preset: ${preset}, text length: ${text.length}, context: ${context ? 'yes' : 'no'}`
    );

    // Check availability first
    if (!this.available) {
      console.log(
        '[RewriterManager] API not available, checking availability...'
      );
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        throw new Error('Rewriter API is not available');
      }
    }

    try {
      // First attempt with standard timeout
      console.log(
        `[RewriterManager] Attempting rewrite with ${REWRITER_TIMEOUT}ms timeout`
      );
      const rewritten = await this.rewriteWithTimeout(
        text,
        preset,
        context,
        REWRITER_TIMEOUT
      );
      console.log(
        `[RewriterManager] Rewrite successful, output length: ${rewritten.length}`
      );
      return { original: text, rewritten };
    } catch (error) {
      console.warn(
        '[RewriterManager] First rewrite attempt failed, retrying...',
        error
      );

      try {
        // Retry with extended timeout
        console.log(
          `[RewriterManager] Retrying with ${RETRY_TIMEOUT}ms timeout`
        );
        const rewritten = await this.rewriteWithTimeout(
          text,
          preset,
          context,
          RETRY_TIMEOUT
        );
        console.log(
          `[RewriterManager] Retry successful, output length: ${rewritten.length}`
        );
        return { original: text, rewritten };
      } catch (retryError) {
        console.error(
          '[RewriterManager] Rewriting failed after retry:',
          retryError
        );
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
   * @param timeout - Timeout in milliseconds
   * @returns Rewritten text
   */
  private async rewriteWithTimeout(
    text: string,
    preset: TonePreset,
    context: string | undefined,
    timeout: number
  ): Promise<string> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Rewriter timeout')), timeout);
    });

    const rewritePromise = this.executeRewrite(text, preset, context);

    return Promise.race([rewritePromise, timeoutPromise]);
  }

  /**
   * Execute text rewriting
   * @param text - Text to rewrite
   * @param preset - Tone preset to apply
   * @param context - Optional context for better rewriting
   * @returns Rewritten text
   */
  private async executeRewrite(
    text: string,
    preset: TonePreset,
    context?: string
  ): Promise<string> {
    // Map tone preset to API parameters
    const { tone, length } = this.mapTonePreset(preset);
    console.log(
      `[RewriterManager] Mapped preset "${preset}" to tone: ${tone}, length: ${length}`
    );

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
    });

    if (!session) {
      throw new Error('Failed to create rewriter session');
    }

    // Rewrite text while preserving structure
    console.log('[RewriterManager] Calling session.rewrite()...');
    const startTime = performance.now();
    const result = await session.rewrite(text, { context });
    const duration = performance.now() - startTime;
    console.log(
      `[RewriterManager] Rewrite completed in ${duration.toFixed(2)}ms`
    );

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
   * @returns Object containing both original and complete rewritten text
   */
  async rewriteStreaming(
    text: string,
    preset: TonePreset,
    context: string | undefined,
    onChunk: (chunk: string) => void
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
    console.log(
      `[RewriterManager] destroy() called (${this.sessions.size} sessions)`
    );
    for (const [key, session] of this.sessions.entries()) {
      try {
        session.destroy();
        console.log(`[RewriterManager] Destroyed session: ${key}`);
      } catch (error) {
        console.error(
          `[RewriterManager] Error destroying session ${key}:`,
          error
        );
      }
    }
    this.sessions.clear();
    console.log('[RewriterManager] All sessions destroyed');
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
