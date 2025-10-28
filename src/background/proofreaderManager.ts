/**
 * Proofreader Manager for Gemini Nano Proofreader API
 * Handles grammar and spelling corrections
 */

/**
 * Type definitions for Chrome's Proofreader API
 * Based on: https://developer.chrome.com/docs/ai/proofreader-api
 */
interface AIProofreader {
  proofread(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  destroy(): void;
}

interface AIProofreaderFactory {
  create(options?: { signal?: AbortSignal }): Promise<AIProofreader>;
  availability(): Promise<
    'available' | 'downloadable' | 'downloading' | 'unavailable'
  >;
}

declare global {
  interface Window {
    Proofreader?: AIProofreaderFactory;
  }
  var Proofreader: AIProofreaderFactory | undefined;
}

export class ProofreaderManager {
  private isAvailable = false;
  private proofreader: AIProofreader | null = null;

  async checkAvailability(): Promise<boolean> {
    try {
      if (typeof Proofreader === 'undefined') {
        console.warn('Chrome Proofreader API not available');
        this.isAvailable = false;
        return false;
      }

      const availability = await Proofreader.availability();
      console.log('Proofreader availability:', availability);

      this.isAvailable = availability !== 'unavailable';
      return this.isAvailable;
    } catch (error) {
      console.error('Error checking Proofreader availability:', error);
      this.isAvailable = false;
      return false;
    }
  }

  private async ensureProofreader(): Promise<boolean> {
    if (this.proofreader) {
      return true;
    }

    try {
      if (typeof Proofreader === 'undefined') {
        return false;
      }

      this.proofreader = await Proofreader.create();
      return true;
    } catch (error) {
      console.error('Error initializing Proofreader:', error);
      return false;
    }
  }

  async proofread(text: string): Promise<string> {
    try {
      if (!this.isAvailable) {
        const available = await this.checkAvailability();
        if (!available) {
          return text;
        }
      }

      const ready = await this.ensureProofreader();
      if (!ready || !this.proofreader) {
        return text;
      }

      const result = await this.proofreader.proofread(text);
      return result.trim() || text;
    } catch (error) {
      console.error('Error in proofread:', error);
      return text;
    }
  }

  destroy(): void {
    if (this.proofreader) {
      this.proofreader.destroy();
      this.proofreader = null;
    }
  }
}
