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
import { CapabilityDetector } from './capabilityDetector';
import type { AICapabilities } from '../types';

export class UnifiedAIService {
  // Individual API managers
  public readonly prompt: PromptManager;
  public readonly proofreader: ProofreaderManager;
  public readonly summarizer: SummarizerManager;
  public readonly translator: TranslatorManager;
  public readonly writer: WriterManager;
  public readonly rewriter: RewriterManager;

  // Capability detector
  private readonly capabilityDetector: CapabilityDetector;

  // Capabilities object storing availability flags
  private capabilities: AICapabilities | null = null;

  // Initialization state
  private initialized = false;

  constructor() {
    this.prompt = new PromptManager();
    this.proofreader = new ProofreaderManager();
    this.summarizer = new SummarizerManager();
    this.translator = new TranslatorManager();
    this.writer = new WriterManager();
    this.rewriter = new RewriterManager();
    this.capabilityDetector = new CapabilityDetector();
  }

  /**
   * Initialize the Unified AI Service
   * Runs capability detection and caches results
   * @param experimentalMode - Whether to enable experimental features
   */
  initialize(experimentalMode = false): void {
    if (this.initialized) {
      console.log('UnifiedAIService already initialized');
      return;
    }

    console.log('Initializing UnifiedAIService...');
    const startTime = Date.now();

    // Detect capabilities
    this.capabilities =
      this.capabilityDetector.getCapabilities(experimentalMode);

    this.initialized = true;
    const duration = Date.now() - startTime;
    console.log(`UnifiedAIService initialized in ${duration}ms`);
  }

  /**
   * Get current AI capabilities
   * @returns AICapabilities object with availability flags
   * @throws Error if service not initialized
   */
  getCapabilities(): AICapabilities {
    if (!this.initialized || !this.capabilities) {
      throw new Error(
        'UnifiedAIService not initialized. Call initialize() first.'
      );
    }

    return { ...this.capabilities };
  }

  /**
   * Refresh capabilities on demand
   * Useful when experimental mode is toggled or user requests status update
   * @param experimentalMode - Whether to enable experimental features
   */
  refreshCapabilities(experimentalMode = false): AICapabilities {
    console.log('Refreshing capabilities...');
    this.capabilities =
      this.capabilityDetector.refreshCapabilities(experimentalMode);
    return { ...this.capabilities };
  }

  /**
   * Check if service is initialized
   * @returns True if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
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
