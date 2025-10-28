/**
 * Unified AI Service
 * Combines all Gemini Nano APIs into a single service
 */

import { PromptManager } from './promptManager';
import { ProofreaderManager } from './proofreaderManager';
import { SummarizerManager } from './summarizerManager';
import { TranslatorManager } from './translatorManager';
import { WriterManager } from './writerManager';
import { RewriterManager } from './rewriterManager';

export class UnifiedAIService {
  // Individual API managers
  public readonly prompt: PromptManager;
  public readonly proofreader: ProofreaderManager;
  public readonly summarizer: SummarizerManager;
  public readonly translator: TranslatorManager;
  public readonly writer: WriterManager;
  public readonly rewriter: RewriterManager;

  constructor() {
    this.prompt = new PromptManager();
    this.proofreader = new ProofreaderManager();
    this.summarizer = new SummarizerManager();
    this.translator = new TranslatorManager();
    this.writer = new WriterManager();
    this.rewriter = new RewriterManager();
  }

  /**
   * Check availability of all APIs
   * @returns Object with availability status for each API
   */
  async checkAllAvailability(): Promise<{
    prompt: boolean;
    proofreader: boolean;
    summarizer: boolean;
    translator: boolean;
    writer: boolean;
    rewriter: boolean;
  }> {
    const [prompt, proofreader, summarizer, writer, rewriter] =
      await Promise.all([
        this.prompt.checkAvailability(),
        this.proofreader.checkAvailability(),
        this.summarizer.checkAvailability(),
        this.writer.checkAvailability(),
        this.rewriter.checkAvailability(),
      ]);

    // Translator requires language pair, so we'll just return false for now
    const translator = false;

    return {
      prompt,
      proofreader,
      summarizer,
      translator,
      writer,
      rewriter,
    };
  }

  /**
   * Destroy all API sessions
   */
  destroyAll(): void {
    this.prompt.destroy();
    this.proofreader.destroy();
    this.summarizer.destroy();
    this.translator.destroy();
    this.writer.destroy();
    this.rewriter.destroy();
  }
}

// Export singleton instance
export const unifiedAI = new UnifiedAIService();
