/**
 * Unified AI Service
 * Central interface for all Gemini Nano AI capabilities
 *
 * SOLID Principles Applied:
 * - SRP: Orchestrates managers, doesn't implement AI logic
 * - OCP: New managers can be added without modifying existing code
 * - DIP: Depends on abstractions via constructor injection
 */

import { PromptManager } from './promptManager';
import { ProofreaderManager } from './proofreaderManager';
import { SummarizerManager } from './summarizerManager';
import { TranslatorManager } from './translatorManager';
import { WriterManager } from './writerManager';
import { RewriterManager } from './rewriterManager';
import { languageDetectorManager } from './languageDetectorManager';
import type { AICapabilities } from '../../../types';
import { capabilityDetector } from '../capabilities/capabilityDetector';
import { devLog } from '../../../utils/logger';

/**
 * Interface for AI manager dependencies
 * Supports Dependency Inversion Principle (DIP)
 */
interface AIServiceDependencies {
  prompt: PromptManager;
  proofreader: ProofreaderManager;
  summarizer: SummarizerManager;
  translator: TranslatorManager;
  writer: WriterManager;
  rewriter: RewriterManager;
}

/**
 * Create default dependencies
 */
function createDefaultDependencies(): AIServiceDependencies {
  return {
    prompt: new PromptManager(),
    proofreader: new ProofreaderManager(),
    summarizer: new SummarizerManager(),
    translator: new TranslatorManager(),
    writer: new WriterManager(),
    rewriter: new RewriterManager(),
  };
}

export class AIService {
  public readonly prompt: PromptManager;
  public readonly proofreader: ProofreaderManager;
  public readonly summarizer: SummarizerManager;
  public readonly translator: TranslatorManager;
  public readonly writer: WriterManager;
  public readonly rewriter: RewriterManager;
  public readonly languageDetector = languageDetectorManager;

  private capabilities: AICapabilities | null = null;
  private initialized = false;

  /**
   * Constructor supports both DI and no-argument instantiation
   */
  constructor(dependencies?: Partial<AIServiceDependencies>) {
    const defaults = createDefaultDependencies();
    this.prompt = dependencies?.prompt ?? defaults.prompt;
    this.proofreader = dependencies?.proofreader ?? defaults.proofreader;
    this.summarizer = dependencies?.summarizer ?? defaults.summarizer;
    this.translator = dependencies?.translator ?? defaults.translator;
    this.writer = dependencies?.writer ?? defaults.writer;
    this.rewriter = dependencies?.rewriter ?? defaults.rewriter;
  }

  initialize(experimentalMode = false): void {
    if (this.initialized) {
      devLog('AIService already initialized');
      return;
    }

    console.log('Initializing AIService...');
    const startTime = Date.now();

    this.capabilities = capabilityDetector.getCapabilities(experimentalMode);
    this.initialized = true;

    const duration = Date.now() - startTime;
    console.log(`AIService initialized in ${duration}ms`);
  }

  getCapabilities(): AICapabilities {
    if (!this.initialized || !this.capabilities) {
      throw new Error('AIService not initialized. Call initialize() first.');
    }
    return { ...this.capabilities };
  }

  refreshCapabilities(experimentalMode = false): AICapabilities {
    console.log('Refreshing capabilities...');
    this.capabilities =
      capabilityDetector.refreshCapabilities(experimentalMode);
    return { ...this.capabilities };
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async checkAllAvailability(): Promise<{
    prompt: boolean;
    proofreader: boolean;
    summarizer: boolean;
    translator: boolean;
    writer: boolean;
    rewriter: boolean;
    languageDetector: boolean;
  }> {
    const [
      prompt,
      proofreader,
      summarizer,
      writer,
      rewriter,
      languageDetector,
    ] = await Promise.all([
      this.prompt.checkAvailability(),
      this.proofreader.checkAvailability(),
      this.summarizer.checkAvailability(),
      this.writer.checkAvailability(),
      this.rewriter.checkAvailability(),
      this.languageDetector.checkAvailability(),
    ]);

    return {
      prompt,
      proofreader,
      summarizer,
      translator: false, // Requires language pair
      writer,
      rewriter,
      languageDetector,
    };
  }

  destroyAll(): void {
    this.prompt.destroy();
    this.proofreader.destroy();
    this.summarizer.destroy();
    this.translator.destroy();
    this.writer.destroy();
    this.rewriter.destroy();
    this.languageDetector.destroy();
  }
}

export const aiService = new AIService();
