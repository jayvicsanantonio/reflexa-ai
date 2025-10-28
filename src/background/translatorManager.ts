/**
 * Translator Manager for Gemini Nano Translator API
 * Handles text translation between languages
 */

/**
 * Type definitions for Chrome's Translator API
 * Based on: https://developer.chrome.com/docs/ai/translator-api
 */
interface AITranslator {
  translate(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  translateStreaming(input: string): ReadableStream;
  destroy(): void;
}

interface AITranslatorFactory {
  create(options: {
    sourceLanguage: string;
    targetLanguage: string;
    signal?: AbortSignal;
  }): Promise<AITranslator>;
  availability(options: {
    sourceLanguage: string;
    targetLanguage: string;
  }): Promise<'available' | 'downloadable' | 'downloading' | 'unavailable'>;
  supportedLanguages(): Promise<string[]>;
}

declare global {
  interface Window {
    Translator?: AITranslatorFactory;
  }
  var Translator: AITranslatorFactory | undefined;
}

export class TranslatorManager {
  private isAvailable = false;
  private translators = new Map<string, AITranslator>();
  private supportedLanguages: string[] = [];

  async checkAvailability(
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<boolean> {
    try {
      if (typeof Translator === 'undefined') {
        console.warn('Chrome Translator API not available');
        this.isAvailable = false;
        return false;
      }

      const availability = await Translator.availability({
        sourceLanguage,
        targetLanguage,
      });
      console.log(
        `Translator availability (${sourceLanguage} -> ${targetLanguage}):`,
        availability
      );

      this.isAvailable = availability !== 'unavailable';
      return this.isAvailable;
    } catch (error) {
      console.error('Error checking Translator availability:', error);
      this.isAvailable = false;
      return false;
    }
  }

  async getSupportedLanguages(): Promise<string[]> {
    try {
      if (typeof Translator === 'undefined') {
        return [];
      }

      if (this.supportedLanguages.length === 0) {
        this.supportedLanguages = await Translator.supportedLanguages();
      }

      return this.supportedLanguages;
    } catch (error) {
      console.error('Error getting supported languages:', error);
      return [];
    }
  }

  private async ensureTranslator(
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<AITranslator | null> {
    const key = `${sourceLanguage}-${targetLanguage}`;

    if (this.translators.has(key)) {
      return this.translators.get(key)!;
    }

    try {
      if (typeof Translator === 'undefined') {
        return null;
      }

      const translator = await Translator.create({
        sourceLanguage,
        targetLanguage,
      });
      this.translators.set(key, translator);
      return translator;
    } catch (error) {
      console.error('Error initializing Translator:', error);
      return null;
    }
  }

  async translate(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string> {
    try {
      const available = await this.checkAvailability(
        sourceLanguage,
        targetLanguage
      );
      if (!available) {
        return text;
      }

      const translator = await this.ensureTranslator(
        sourceLanguage,
        targetLanguage
      );

      if (!translator) {
        return text;
      }

      const result = await translator.translate(text);
      return result.trim() || text;
    } catch (error) {
      console.error('Error in translate:', error);
      return text;
    }
  }

  async *translateStreaming(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): AsyncGenerator<string> {
    try {
      const available = await this.checkAvailability(
        sourceLanguage,
        targetLanguage
      );
      if (!available) {
        return;
      }

      const translator = await this.ensureTranslator(
        sourceLanguage,
        targetLanguage
      );

      if (!translator) {
        return;
      }

      const stream = translator.translateStreaming(text);
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
      console.error('Error in translateStreaming:', error);
    }
  }

  destroy(): void {
    for (const translator of this.translators.values()) {
      translator.destroy();
    }
    this.translators.clear();
  }
}
