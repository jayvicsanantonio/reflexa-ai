/**
 * Summarizer Manager for Gemini Nano Summarizer API
 * Handles content summarization with different formats and lengths
 */

/**
 * Type definitions for Chrome's Summarizer API
 * Based on: https://developer.chrome.com/docs/ai/summarizer-api
 */
interface AISummarizer {
  summarize(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  summarizeStreaming(input: string): ReadableStream;
  destroy(): void;
}

interface AISummarizerFactory {
  create(options?: {
    type?: 'tl;dr' | 'key-points' | 'teaser' | 'headline';
    format?: 'plain-text' | 'markdown';
    length?: 'short' | 'medium' | 'long';
    signal?: AbortSignal;
  }): Promise<AISummarizer>;
  availability(): Promise<
    'available' | 'downloadable' | 'downloading' | 'unavailable'
  >;
}

declare global {
  interface Window {
    Summarizer?: AISummarizerFactory;
  }
  var Summarizer: AISummarizerFactory | undefined;
}

export class SummarizerManager {
  private isAvailable = false;
  private summarizers = new Map<string, AISummarizer>();

  async checkAvailability(): Promise<boolean> {
    try {
      if (typeof Summarizer === 'undefined') {
        console.warn('Chrome Summarizer API not available');
        this.isAvailable = false;
        return false;
      }

      const availability = await Summarizer.availability();
      console.log('Summarizer availability:', availability);

      this.isAvailable = availability !== 'unavailable';
      return this.isAvailable;
    } catch (error) {
      console.error('Error checking Summarizer availability:', error);
      this.isAvailable = false;
      return false;
    }
  }

  private async ensureSummarizer(
    type: 'tl;dr' | 'key-points' | 'teaser' | 'headline' = 'key-points',
    format: 'plain-text' | 'markdown' = 'plain-text',
    length: 'short' | 'medium' | 'long' = 'medium'
  ): Promise<AISummarizer | null> {
    const key = `${type}-${format}-${length}`;

    if (this.summarizers.has(key)) {
      return this.summarizers.get(key)!;
    }

    try {
      if (typeof Summarizer === 'undefined') {
        return null;
      }

      const options: Parameters<AISummarizerFactory['create']>[0] = {
        type,
        format,
        length,
      };
      const summarizer = await Summarizer.create(options);
      this.summarizers.set(key, summarizer);
      return summarizer;
    } catch (error) {
      console.error('Error initializing Summarizer:', error);
      return null;
    }
  }

  async summarize(
    content: string,
    options?: {
      type?: 'tl;dr' | 'key-points' | 'teaser' | 'headline';
      format?: 'plain-text' | 'markdown';
      length?: 'short' | 'medium' | 'long';
    }
  ): Promise<string> {
    try {
      if (!this.isAvailable) {
        const available = await this.checkAvailability();
        if (!available) {
          return '';
        }
      }

      const summarizer = await this.ensureSummarizer(
        options?.type,
        options?.format,
        options?.length
      );

      if (!summarizer) {
        return '';
      }

      const result = await summarizer.summarize(content);
      return result.trim();
    } catch (error) {
      console.error('Error in summarize:', error);
      return '';
    }
  }

  async *summarizeStreaming(
    content: string,
    options?: {
      type?: 'tl;dr' | 'key-points' | 'teaser' | 'headline';
      format?: 'plain-text' | 'markdown';
      length?: 'short' | 'medium' | 'long';
    }
  ): AsyncGenerator<string> {
    try {
      if (!this.isAvailable) {
        const available = await this.checkAvailability();
        if (!available) {
          return;
        }
      }

      const summarizer = await this.ensureSummarizer(
        options?.type,
        options?.format,
        options?.length
      );

      if (!summarizer) {
        return;
      }

      const stream = summarizer.summarizeStreaming(content);
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
      console.error('Error in summarizeStreaming:', error);
    }
  }

  destroy(): void {
    for (const summarizer of this.summarizers.values()) {
      summarizer.destroy();
    }
    this.summarizers.clear();
  }
}
