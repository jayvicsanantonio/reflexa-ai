/**
 * Writer Manager for Gemini Nano Writer API
 * Handles creative text generation
 */

/**
 * Type definitions for Chrome's Writer API
 * Based on: https://developer.chrome.com/docs/ai/writer-api
 */
interface AIWriter {
  write(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  writeStreaming(input: string): ReadableStream;
  destroy(): void;
}

interface AIWriterFactory {
  create(options?: {
    tone?: 'formal' | 'neutral' | 'casual';
    format?: 'plain-text' | 'markdown';
    length?: 'short' | 'medium' | 'long';
    signal?: AbortSignal;
  }): Promise<AIWriter>;
  availability(): Promise<
    'available' | 'downloadable' | 'downloading' | 'unavailable'
  >;
}

declare global {
  interface Window {
    Writer?: AIWriterFactory;
  }
  var Writer: AIWriterFactory | undefined;
}

export class WriterManager {
  private isAvailable = false;
  private writers = new Map<string, AIWriter>();

  async checkAvailability(): Promise<boolean> {
    try {
      if (typeof Writer === 'undefined') {
        console.warn('Chrome Writer API not available');
        this.isAvailable = false;
        return false;
      }

      const availability = await Writer.availability();
      console.log('Writer availability:', availability);

      this.isAvailable = availability !== 'unavailable';
      return this.isAvailable;
    } catch (error) {
      console.error('Error checking Writer availability:', error);
      this.isAvailable = false;
      return false;
    }
  }

  private async ensureWriter(
    tone: 'formal' | 'neutral' | 'casual' = 'neutral',
    format: 'plain-text' | 'markdown' = 'plain-text',
    length: 'short' | 'medium' | 'long' = 'medium'
  ): Promise<AIWriter | null> {
    const key = `${tone}-${format}-${length}`;

    if (this.writers.has(key)) {
      return this.writers.get(key)!;
    }

    try {
      if (typeof Writer === 'undefined') {
        return null;
      }

      const writer = await Writer.create({ tone, format, length });
      this.writers.set(key, writer);
      return writer;
    } catch (error) {
      console.error('Error initializing Writer:', error);
      return null;
    }
  }

  async write(
    prompt: string,
    options?: {
      tone?: 'formal' | 'neutral' | 'casual';
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

      const writer = await this.ensureWriter(
        options?.tone,
        options?.format,
        options?.length
      );

      if (!writer) {
        return '';
      }

      const result = await writer.write(prompt);
      return result.trim();
    } catch (error) {
      console.error('Error in write:', error);
      return '';
    }
  }

  async *writeStreaming(
    prompt: string,
    options?: {
      tone?: 'formal' | 'neutral' | 'casual';
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

      const writer = await this.ensureWriter(
        options?.tone,
        options?.format,
        options?.length
      );

      if (!writer) {
        return;
      }

      const stream = writer.writeStreaming(prompt);
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
      console.error('Error in writeStreaming:', error);
    }
  }

  destroy(): void {
    for (const writer of this.writers.values()) {
      writer.destroy();
    }
    this.writers.clear();
  }
}
