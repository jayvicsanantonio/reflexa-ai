/**
 * Rewriter Manager for Gemini Nano Rewriter API
 * Handles content rewriting with different tones and styles
 */

/**
 * Type definitions for Chrome's Rewriter API
 * Based on: https://developer.chrome.com/docs/ai/rewriter-api
 */
interface AIRewriter {
  rewrite(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  rewriteStreaming(input: string): ReadableStream;
  destroy(): void;
}

interface AIRewriterFactory {
  create(options?: {
    tone?: 'as-is' | 'more-formal' | 'more-casual';
    format?: 'as-is' | 'plain-text' | 'markdown';
    length?: 'as-is' | 'shorter' | 'longer';
    signal?: AbortSignal;
  }): Promise<AIRewriter>;
  availability(): Promise<
    'available' | 'downloadable' | 'downloading' | 'unavailable'
  >;
}

declare global {
  interface Window {
    Rewriter?: AIRewriterFactory;
  }
  var Rewriter: AIRewriterFactory | undefined;
}

export class RewriterManager {
  private isAvailable = false;
  private rewriters = new Map<string, AIRewriter>();

  async checkAvailability(): Promise<boolean> {
    try {
      if (typeof Rewriter === 'undefined') {
        console.warn('Chrome Rewriter API not available');
        this.isAvailable = false;
        return false;
      }

      const availability = await Rewriter.availability();
      console.log('Rewriter availability:', availability);

      this.isAvailable = availability !== 'unavailable';
      return this.isAvailable;
    } catch (error) {
      console.error('Error checking Rewriter availability:', error);
      this.isAvailable = false;
      return false;
    }
  }

  private async ensureRewriter(
    tone: 'as-is' | 'more-formal' | 'more-casual' = 'as-is',
    format: 'as-is' | 'plain-text' | 'markdown' = 'as-is',
    length: 'as-is' | 'shorter' | 'longer' = 'as-is'
  ): Promise<AIRewriter | null> {
    const key = `${tone}-${format}-${length}`;

    if (this.rewriters.has(key)) {
      return this.rewriters.get(key)!;
    }

    try {
      if (typeof Rewriter === 'undefined') {
        return null;
      }

      const rewriter = await Rewriter.create({ tone, format, length });
      this.rewriters.set(key, rewriter);
      return rewriter;
    } catch (error) {
      console.error('Error initializing Rewriter:', error);
      return null;
    }
  }

  async rewrite(
    text: string,
    options?: {
      tone?: 'as-is' | 'more-formal' | 'more-casual';
      format?: 'as-is' | 'plain-text' | 'markdown';
      length?: 'as-is' | 'shorter' | 'longer';
    }
  ): Promise<string> {
    try {
      if (!this.isAvailable) {
        const available = await this.checkAvailability();
        if (!available) {
          return text;
        }
      }

      const rewriter = await this.ensureRewriter(
        options?.tone,
        options?.format,
        options?.length
      );

      if (!rewriter) {
        return text;
      }

      const result = await rewriter.rewrite(text);
      return result.trim() || text;
    } catch (error) {
      console.error('Error in rewrite:', error);
      return text;
    }
  }

  async *rewriteStreaming(
    text: string,
    options?: {
      tone?: 'as-is' | 'more-formal' | 'more-casual';
      format?: 'as-is' | 'plain-text' | 'markdown';
      length?: 'as-is' | 'shorter' | 'longer';
    }
  ): AsyncGenerator<string> {
    try {
      if (!this.isAvailable) {
        const available = await this.checkAvailability();
        if (!available) {
          return;
        }
      }

      const rewriter = await this.ensureRewriter(
        options?.tone,
        options?.format,
        options?.length
      );

      if (!rewriter) {
        return;
      }

      const stream = rewriter.rewriteStreaming(text);
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const result = await reader.read();
          const done = result.done;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const value = result.value;
          if (done) break;

          if (value) {
            const chunk = decoder.decode(value as Uint8Array, { stream: true });
            yield chunk;
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Error in rewriteStreaming:', error);
    }
  }

  destroy(): void {
    for (const rewriter of this.rewriters.values()) {
      rewriter.destroy();
    }
    this.rewriters.clear();
  }
}
