/**
 * Summarizer Manager - Orchestrates content summarization
 *
 * SOLID Principles Applied:
 * - SRP: Delegates specific tasks to specialized services
 * - OCP: New formats via strategy pattern without modification
 * - LSP: All strategies implement ISummaryStrategy correctly
 * - ISP: Small, focused interfaces for each service
 * - DIP: Depends on abstractions (interfaces), not concrete implementations
 */

import type { SummaryFormat } from '../../../../types';
import type { AISummarizer } from '../../../../types/chrome-ai';
import type {
  ISummarizerManager,
  ISummaryStrategy,
  ISessionPool,
  IRetryHandler,
  SummarizerLanguageOptions,
} from './interfaces';
import { SessionPool, ChromeSummarizerAPI } from './SessionPool';
import { RetryHandler } from './RetryHandler';
import { BulletsStrategy } from './strategies/BulletsStrategy';
import { ParagraphStrategy } from './strategies/ParagraphStrategy';
import { HeadlineBulletsStrategy } from './strategies/HeadlineBulletsStrategy';
import { capabilityDetector } from '../../capabilities/capabilityDetector';
import { devError } from '../../../../utils/logger';

const SUMMARIZE_TIMEOUT = 30000;
const RETRY_TIMEOUT = 60000;

/**
 * Factory function to create SummarizerManager with custom dependencies
 */
export function createSummarizerManager(
  sessionPool: ISessionPool,
  retryHandler: IRetryHandler,
  strategies: ISummaryStrategy[]
): SummarizerManager {
  return new SummarizerManager(sessionPool, retryHandler, strategies);
}

/**
 * Create default dependencies for backward compatibility
 */
function createDefaultDependencies(): {
  sessionPool: ISessionPool;
  retryHandler: IRetryHandler;
  strategies: ISummaryStrategy[];
} {
  const api = new ChromeSummarizerAPI();
  return {
    sessionPool: new SessionPool(api),
    retryHandler: new RetryHandler(),
    strategies: [
      new BulletsStrategy(),
      new ParagraphStrategy(),
      new HeadlineBulletsStrategy(),
    ],
  };
}

/**
 * SummarizerManager class - orchestrates summarization
 */
export class SummarizerManager implements ISummarizerManager {
  private available = false;
  private strategyMap: Map<SummaryFormat, ISummaryStrategy>;
  private readonly sessionPool: ISessionPool;
  private readonly retryHandler: IRetryHandler;

  /**
   * Constructor supports both DI and no-argument instantiation for backward compatibility
   */
  constructor(
    sessionPool?: ISessionPool,
    retryHandler?: IRetryHandler,
    strategies?: ISummaryStrategy[]
  ) {
    if (sessionPool && retryHandler && strategies) {
      this.sessionPool = sessionPool;
      this.retryHandler = retryHandler;
      this.strategyMap = new Map(strategies.map((s) => [s.format, s]));
    } else {
      const defaults = createDefaultDependencies();
      this.sessionPool = defaults.sessionPool;
      this.retryHandler = defaults.retryHandler;
      this.strategyMap = new Map(defaults.strategies.map((s) => [s.format, s]));
    }
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const capabilities = await Promise.resolve(
        capabilityDetector.getCapabilities()
      );
      this.available = Boolean(capabilities.summarizer);
      return this.available;
    } catch (error) {
      devError('Error checking Summarizer availability:', error);
      this.available = false;
      return false;
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  async summarize(
    text: string,
    format: SummaryFormat,
    outputLanguage?: string,
    languageOptions?: SummarizerLanguageOptions
  ): Promise<string[]> {
    if (!this.available) {
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        throw new Error('Summarizer API is not available');
      }
    }

    const strategy = this.strategyMap.get(format);
    if (!strategy) {
      throw new Error(`Unsupported format: ${String(format)}`);
    }

    return this.retryHandler.executeWithRetry(
      () =>
        strategy.summarize(
          text,
          this.sessionPool,
          outputLanguage,
          languageOptions
        ),
      SUMMARIZE_TIMEOUT,
      RETRY_TIMEOUT
    );
  }

  async summarizeStreaming(
    text: string,
    format: SummaryFormat,
    outputLanguage?: string,
    languageOptions?: SummarizerLanguageOptions,
    onChunk?: (chunk: string, aggregate: string) => void
  ): Promise<string> {
    if (format === 'headline-bullets') {
      throw new Error('Streaming is not supported for headline-bullets format');
    }

    if (!this.available) {
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        throw new Error('Summarizer API is not available');
      }
    }

    const session = await this.sessionPool.getOrCreate({
      type: format === 'paragraph' ? 'tldr' : 'key-points',
      format: format === 'paragraph' ? 'plain-text' : 'markdown',
      length: format === 'paragraph' ? 'medium' : 'short',
      outputLanguage,
      languageOptions,
    });

    if (!session || typeof session.summarizeStreaming !== 'function') {
      throw new Error('Summarizer streaming is not available');
    }

    return this.processStream(session, text, onChunk);
  }

  destroy(): void {
    this.sessionPool.destroyAll();
  }

  destroySession(format: SummaryFormat): void {
    const typeMap: Record<SummaryFormat, string[]> = {
      bullets: ['key-points'],
      paragraph: ['tldr'],
      'headline-bullets': ['headline', 'key-points'],
    };

    const types = typeMap[format] || [];
    for (const type of types) {
      this.sessionPool.destroy(type);
    }
  }

  private async processStream(
    session: AISummarizer,
    text: string,
    onChunk?: (chunk: string, aggregate: string) => void
  ): Promise<string> {
    const stream = session.summarizeStreaming(text);
    if (!stream) {
      throw new Error('Summarizer streaming returned no data');
    }

    let aggregate = '';

    if (
      typeof (stream as unknown as AsyncIterable<string>)[
        Symbol.asyncIterator
      ] === 'function'
    ) {
      for await (const chunk of stream as unknown as AsyncIterable<string>) {
        if (typeof chunk !== 'string') continue;
        aggregate += chunk;
        onChunk?.(chunk, aggregate);
      }
    } else if (
      typeof (stream as ReadableStream<string>).getReader === 'function'
    ) {
      const reader = (stream as ReadableStream<string>).getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (typeof value === 'string') {
            aggregate += value;
            onChunk?.(value, aggregate);
          }
        }
      } finally {
        reader.releaseLock();
      }
    } else {
      throw new Error('Unsupported summarizer streaming implementation');
    }

    return aggregate;
  }
}
