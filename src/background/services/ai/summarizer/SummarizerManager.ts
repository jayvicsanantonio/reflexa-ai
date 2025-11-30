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
import { RecursiveSummarizer } from './RecursiveSummarizer';
import { capabilityDetector } from '../../capabilities/capabilityDetector';
import { devError, devLog } from '../../../../utils/logger';

const SUMMARIZE_TIMEOUT = 30000;
const RETRY_TIMEOUT = 60000;
const DEFAULT_MAX_TOKENS = 4000; // Conservative default for Gemini Nano
const CHARS_PER_TOKEN = 4; // Average characters per token

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
    devError('[SummarizerManager] summarizeStreaming called, format:', format);
    if (format === 'headline-bullets') {
      throw new Error('Streaming is not supported for headline-bullets format');
    }

    devError(
      '[SummarizerManager] Checking availability, current:',
      this.available
    );
    if (!this.available) {
      const isAvailable = await this.checkAvailability();
      devError('[SummarizerManager] Availability check result:', isAvailable);
      if (!isAvailable) {
        throw new Error('Summarizer API is not available');
      }
    }

    devError('[SummarizerManager] Getting or creating session...');
    const session = await this.sessionPool.getOrCreate({
      type: format === 'paragraph' ? 'tldr' : 'key-points',
      format: format === 'paragraph' ? 'plain-text' : 'markdown',
      length: format === 'paragraph' ? 'medium' : 'short',
      outputLanguage,
      languageOptions,
    });

    devError(
      '[SummarizerManager] Session obtained:',
      !!session,
      'has summarizeStreaming:',
      typeof session?.summarizeStreaming
    );
    if (!session) {
      throw new Error('Summarizer session could not be created');
    }

    // Check if text exceeds context window and needs recursive summarization
    const maxTokens = this.getMaxTokens(session);
    const estimatedTokens = Math.ceil(text.length / CHARS_PER_TOKEN);

    devLog(
      `[SummarizerManager] Text size: ${text.length} chars, ~${estimatedTokens} tokens, max: ${maxTokens} tokens`
    );

    if (estimatedTokens > maxTokens) {
      devLog(
        '[SummarizerManager] Text exceeds context window, using recursive summarization'
      );
      return await this.recursiveSummarizeStreaming(
        text,
        session,
        maxTokens,
        onChunk
      );
    }

    // Text fits in context window, use direct streaming
    if (typeof session.summarizeStreaming !== 'function') {
      devError('[SummarizerManager] Streaming not available, using fallback');
      const result = await session.summarize(text);
      if (result && onChunk) {
        onChunk(result, result);
      }
      return result || '';
    }

    // Add timeout to prevent infinite hanging
    const timeoutMs = 30000; // 30 seconds
    devError(
      '[SummarizerManager] Starting processStream with timeout:',
      timeoutMs
    );
    try {
      return await Promise.race([
        this.processStream(session, text, onChunk),
        new Promise<string>((_, reject) =>
          setTimeout(
            () => reject(new Error('Summarization streaming timeout')),
            timeoutMs
          )
        ),
      ]);
    } catch (error) {
      devError(
        '[SummarizerManager] Streaming failed, falling back to non-streaming:',
        error
      );
      // Fallback to non-streaming summarize method
      const result = await session.summarize(text);
      devError(
        '[SummarizerManager] Non-streaming result length:',
        result?.length
      );
      if (result && onChunk) {
        // Simulate streaming by sending the whole result at once
        onChunk(result, result);
      }
      return result || '';
    }
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
    devError(
      '[SummarizerManager] processStream called with text length:',
      text.length
    );
    const stream = session.summarizeStreaming(text);
    if (!stream) {
      throw new Error('Summarizer streaming returned no data');
    }

    devError('[SummarizerManager] Stream object received:', typeof stream);
    let aggregate = '';

    if (
      typeof (stream as unknown as AsyncIterable<string>)[
        Symbol.asyncIterator
      ] === 'function'
    ) {
      devError('[SummarizerManager] Using AsyncIterable stream');
      for await (const chunk of stream as unknown as AsyncIterable<string>) {
        devError(
          '[SummarizerManager] Received chunk:',
          typeof chunk,
          chunk?.length
        );
        if (typeof chunk !== 'string') continue;
        aggregate += chunk;
        onChunk?.(chunk, aggregate);
      }
      devError('[SummarizerManager] AsyncIterable stream complete');
    } else if (
      typeof (stream as ReadableStream<string>).getReader === 'function'
    ) {
      devError('[SummarizerManager] Using ReadableStream');
      const reader = (stream as ReadableStream<string>).getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          devError('[SummarizerManager] Read result:', {
            done,
            valueType: typeof value,
            valueLength: value?.length,
          });
          if (done) break;
          if (typeof value === 'string') {
            aggregate += value;
            onChunk?.(value, aggregate);
          }
        }
        devError('[SummarizerManager] ReadableStream complete');
      } finally {
        reader.releaseLock();
      }
    } else {
      throw new Error('Unsupported summarizer streaming implementation');
    }

    return aggregate;
  }

  /**
   * Get maximum tokens supported by the summarizer
   * Uses inputQuota if available, otherwise returns default
   */
  private getMaxTokens(session: AISummarizer): number {
    try {
      // Check if session has inputQuota property
      if ('inputQuota' in session && typeof session.inputQuota === 'number') {
        devLog(`[SummarizerManager] Using inputQuota: ${session.inputQuota}`);
        return session.inputQuota;
      }
    } catch (error) {
      devError('[SummarizerManager] Error getting inputQuota:', error);
    }

    devLog(
      `[SummarizerManager] Using default max tokens: ${DEFAULT_MAX_TOKENS}`
    );
    return DEFAULT_MAX_TOKENS;
  }

  /**
   * Recursively summarize large text using "summary of summaries" technique
   */
  private async recursiveSummarizeStreaming(
    text: string,
    session: AISummarizer,
    maxTokens: number,
    onChunk?: (chunk: string, aggregate: string) => void
  ): Promise<string> {
    const recursiveSummarizer = new RecursiveSummarizer({
      maxTokens,
      charsPerToken: CHARS_PER_TOKEN,
      chunkOverlap: 200,
      maxRecursionDepth: 10,
    });

    return await recursiveSummarizer.summarizeStreaming(text, session, onChunk);
  }
}
