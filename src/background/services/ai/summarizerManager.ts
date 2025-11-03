/**
 * Summarizer Manager for Chrome Built-in Summarizer API
 * Handles content summarization with different formats (bullets, paragraph, headline+bullets)
 * Implements timeout logic, retry mechanism, and session lifecycle management
 */

import type { SummaryFormat } from '../../../types';
import type {
  AISummarizer,
  AISummarizerFactory,
} from '../../../types/chrome-ai';
import { capabilityDetector } from '../../capabilityDetector';
import { devLog, devWarn, devError } from '../../../utils/logger';

/**
 * Timeout duration for summarization operations (30 seconds)
 * Increased to accommodate model download and initialization
 */
const SUMMARIZE_TIMEOUT = 30000;

/**
 * Extended timeout for retry attempts (60 seconds)
 * Allows for slower systems or large content processing
 */
const RETRY_TIMEOUT = 60000;

interface SummarizerLanguageOptions {
  expectedInputLanguages?: string[];
  expectedContextLanguages?: string[];
}

const normalizeLanguageKey = (languages?: string[]): string => {
  if (!languages || languages.length === 0) {
    return 'default';
  }
  return languages
    .map((lang) => lang.toLowerCase())
    .sort()
    .join('|');
};

/**
 * SummarizerManager class
 * Manages Chrome Summarizer API sessions with format support, error handling, and timeouts
 */
export class SummarizerManager {
  private sessions = new Map<string, AISummarizer>();
  private available = false;

  /**
   * Check if Summarizer API is available
   * Uses capability detector for consistent availability checking
   * @returns Promise resolving to availability status
   */
  async checkAvailability(): Promise<boolean> {
    try {
      // Capability detection is synchronous but we return a promise for consistency
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

  /**
   * Check if Summarizer API is available (synchronous)
   * @returns True if Summarizer API is available
   */
  isAvailable(): boolean {
    return this.available;
  }

  /**
   * Create or retrieve a summarizer session with specific options
   * Sessions are cached by configuration key for reuse
   * @param type - Type of summary to generate
   * @param format - Output format (plain-text or markdown)
   * @param length - Length of summary
   * @param outputLanguage - Target language for summary output (e.g., 'en', 'es', 'fr')
   * @returns AISummarizer session or null if unavailable
   */
  private async createSession(
    type: 'tldr' | 'key-points' | 'teaser' | 'headline' = 'key-points',
    format: 'plain-text' | 'markdown' = 'plain-text',
    length: 'short' | 'medium' | 'long' = 'medium',
    outputLanguage?: string,
    options?: SummarizerLanguageOptions
  ): Promise<AISummarizer | null> {
    const sessionKey = `${type}-${format}-${length}-${
      outputLanguage ?? 'default'
    }-${normalizeLanguageKey(options?.expectedInputLanguages)}-${normalizeLanguageKey(
      options?.expectedContextLanguages
    )}`;

    // Return cached session if available
    if (this.sessions.has(sessionKey)) {
      return this.sessions.get(sessionKey)!;
    }

    try {
      // Access Summarizer from globalThis (global API, not under ai namespace)
      const SummarizerAPI = (
        globalThis as typeof globalThis & {
          Summarizer?: AISummarizerFactory;
        }
      ).Summarizer;

      if (!SummarizerAPI) {
        devWarn('Summarizer API not available');
        return null;
      }

      // Create new session with specified options
      const session = await SummarizerAPI.create({
        type,
        format,
        length,
        ...(outputLanguage && { outputLanguage }),
        ...(options?.expectedInputLanguages &&
          options.expectedInputLanguages.length > 0 && {
            expectedInputLanguages: options.expectedInputLanguages,
          }),
        ...(options?.expectedContextLanguages &&
          options.expectedContextLanguages.length > 0 && {
            expectedContextLanguages: options.expectedContextLanguages,
          }),
      });

      // Cache the session
      this.sessions.set(sessionKey, session);
      devLog(
        `Created summarizer session: ${sessionKey}${outputLanguage ? ` (language: ${outputLanguage})` : ''}`
      );

      return session;
    } catch (error) {
      devError('Error creating summarizer session:', error);
      return null;
    }
  }

  /**
   * Summarize content with specified format
   * Implements timeout logic and retry mechanism
   * @param text - Content to summarize
   * @param format - Desired summary format
   * @param outputLanguage - Target language for summary output (e.g., 'en', 'es', 'fr')
   * @returns Array of summary strings (bullets or paragraphs)
   * @throws Error if summarization fails after retry
   */
  async summarize(
    text: string,
    format: SummaryFormat,
    outputLanguage?: string,
    languageOptions?: SummarizerLanguageOptions
  ): Promise<string[]> {
    // Check availability first
    if (!this.available) {
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        throw new Error('Summarizer API is not available');
      }
    }

    try {
      // First attempt with standard timeout
      return await this.summarizeWithTimeout(
        text,
        format,
        outputLanguage,
        languageOptions,
        SUMMARIZE_TIMEOUT
      );
    } catch (error) {
      devWarn('First summarization attempt failed, retrying...', error);

      try {
        // Retry with extended timeout
        return await this.summarizeWithTimeout(
          text,
          format,
          outputLanguage,
          languageOptions,
          RETRY_TIMEOUT
        );
      } catch (retryError) {
        devError('Summarization failed after retry:', retryError);
        throw new Error(
          `Summarization failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`
        );
      }
    }
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

    const session = await this.createSession(
      format === 'paragraph' ? 'tldr' : 'key-points',
      format === 'paragraph' ? 'plain-text' : 'markdown',
      format === 'paragraph' ? 'medium' : 'short',
      outputLanguage,
      languageOptions
    );

    if (!session || typeof session.summarizeStreaming !== 'function') {
      throw new Error('Summarizer streaming is not available');
    }

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

  /**
   * Summarize with timeout wrapper
   * @param text - Content to summarize
   * @param format - Desired summary format
   * @param outputLanguage - Target language for summary output
   * @param timeout - Timeout in milliseconds
   * @returns Array of summary strings
   */
  private async summarizeWithTimeout(
    text: string,
    format: SummaryFormat,
    outputLanguage: string | undefined,
    languageOptions: SummarizerLanguageOptions | undefined,
    timeout: number
  ): Promise<string[]> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Summarization timeout')), timeout);
    });

    const summarizePromise = this.executeSummarize(
      text,
      format,
      outputLanguage,
      languageOptions
    );

    return Promise.race([summarizePromise, timeoutPromise]);
  }

  /**
   * Execute summarization based on format
   * Maps SummaryFormat to appropriate API calls and parses responses
   * @param text - Content to summarize
   * @param format - Desired summary format
   * @param outputLanguage - Target language for summary output
   * @returns Array of summary strings
   */
  private async executeSummarize(
    text: string,
    format: SummaryFormat,
    outputLanguage?: string,
    languageOptions?: SummarizerLanguageOptions
  ): Promise<string[]> {
    switch (format) {
      case 'bullets':
        return this.summarizeBullets(text, outputLanguage, languageOptions);
      case 'paragraph':
        return this.summarizeParagraph(text, outputLanguage, languageOptions);
      case 'headline-bullets':
        return this.summarizeHeadlineBullets(
          text,
          outputLanguage,
          languageOptions
        );
      default:
        throw new Error(`Unsupported format: ${String(format)}`);
    }
  }

  /**
   * Generate bullet point summary (3 bullets, max 20 words each)
   * @param text - Content to summarize
   * @param outputLanguage - Target language for summary output
   * @returns Array of 3 bullet points
   */
  private async summarizeBullets(
    text: string,
    outputLanguage?: string,
    languageOptions?: SummarizerLanguageOptions
  ): Promise<string[]> {
    const session = await this.createSession(
      'key-points',
      'markdown',
      'short',
      outputLanguage,
      languageOptions
    );

    if (!session) {
      throw new Error('Failed to create summarizer session');
    }

    const result = await session.summarize(text);

    // Parse markdown bullets into array
    const bullets = result
      .split('\n')
      .filter(
        (line: string) =>
          line.trim().startsWith('-') ?? line.trim().startsWith('*')
      )
      .map((line: string) => line.replace(/^[-*]\s*/, '').trim())
      .filter((line: string) => line.length > 0)
      .slice(0, 3); // Ensure exactly 3 bullets

    // If we don't have 3 bullets, split the result differently
    if (bullets.length < 3) {
      const lines = result
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .slice(0, 3);
      return lines;
    }

    return bullets;
  }

  /**
   * Generate paragraph summary (max 150 words)
   * @param text - Content to summarize
   * @param outputLanguage - Target language for summary output
   * @returns Array with single paragraph
   */
  private async summarizeParagraph(
    text: string,
    outputLanguage?: string,
    languageOptions?: SummarizerLanguageOptions
  ): Promise<string[]> {
    const session = await this.createSession(
      'tldr',
      'plain-text',
      'medium',
      outputLanguage,
      languageOptions
    );

    if (!session) {
      throw new Error('Failed to create summarizer session');
    }

    const result = await session.summarize(text);
    return [result.trim()];
  }

  /**
   * Generate headline + bullets summary (10-word headline + 3 bullets)
   * @param text - Content to summarize
   * @param outputLanguage - Target language for summary output
   * @returns Array with headline followed by 3 bullets
   */
  private async summarizeHeadlineBullets(
    text: string,
    outputLanguage?: string,
    languageOptions?: SummarizerLanguageOptions
  ): Promise<string[]> {
    // Create headline session
    const headlineSession = await this.createSession(
      'headline',
      'plain-text',
      'short',
      outputLanguage,
      languageOptions
    );

    if (!headlineSession) {
      throw new Error('Failed to create headline session');
    }

    // Create key-points session for bullets
    const bulletsSession = await this.createSession(
      'key-points',
      'markdown',
      'short',
      outputLanguage,
      languageOptions
    );

    if (!bulletsSession) {
      throw new Error('Failed to create bullets session');
    }

    // Generate headline and bullets in parallel
    const [headline, bulletsResult] = await Promise.all([
      headlineSession.summarize(text),
      bulletsSession.summarize(text),
    ]);

    // Parse bullets
    const bullets = bulletsResult
      .split('\n')
      .filter(
        (line: string) =>
          line.trim().startsWith('-') ?? line.trim().startsWith('*')
      )
      .map((line: string) => line.replace(/^[-*]\s*/, '').trim())
      .filter((line: string) => line.length > 0)
      .slice(0, 3);

    // Return headline followed by bullets
    return [headline.trim(), ...bullets];
  }

  /**
   * Clean up all active sessions
   * Should be called when the manager is no longer needed
   */
  destroy(): void {
    for (const [key, session] of this.sessions.entries()) {
      try {
        session.destroy();
        devLog(`Destroyed summarizer session: ${key}`);
      } catch (error) {
        devError(`Error destroying session ${key}:`, error);
      }
    }
    this.sessions.clear();
  }

  /**
   * Clean up a specific session
   * @param format - Format of the session to clean up
   */
  destroySession(format: SummaryFormat): void {
    const keysToDestroy: string[] = [];

    // Find all sessions matching the format
    for (const key of this.sessions.keys()) {
      if (
        (format === 'bullets' && key.includes('key-points')) ||
        (format === 'paragraph' && key.includes('tl;dr')) ||
        (format === 'headline-bullets' &&
          (key.includes('headline') || key.includes('key-points')))
      ) {
        keysToDestroy.push(key);
      }
    }

    // Destroy matching sessions
    for (const key of keysToDestroy) {
      const session = this.sessions.get(key);
      if (session) {
        try {
          session.destroy();
          this.sessions.delete(key);
          devLog(`Destroyed summarizer session: ${key}`);
        } catch (error) {
          devError(`Error destroying session ${key}:`, error);
        }
      }
    }
  }
}
