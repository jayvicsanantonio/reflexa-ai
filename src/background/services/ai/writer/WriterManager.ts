/**
 * Writer Manager - Refactored with SOLID principles
 */

import type { WriterOptions } from '../../../../types';
import type { AIWriter } from '../../../../types/chrome-ai';
import type {
  IWriterManager,
  WriterSessionConfig,
  WriterLanguageOptions,
} from './interfaces';
import { SessionManager } from '../shared/SessionManager';
import { RetryHandler } from '../shared/RetryHandler';
import { capabilityDetector } from '../../capabilities/capabilityDetector';
import { devWarn, devError } from '../../../../utils/logger';

const WRITER_TIMEOUT = 5000;
const RETRY_TIMEOUT = 8000;

const LENGTH_RANGES = {
  short: { min: 50, max: 100 },
  medium: { min: 100, max: 200 },
  long: { min: 200, max: 300 },
} as const;

function generateSessionKey(config: WriterSessionConfig): string {
  const langKey =
    config.languageOptions?.expectedInputLanguages
      ?.map((l) => l.toLowerCase())
      .sort()
      .join('|') ?? 'default';
  const contextKey =
    config.languageOptions?.expectedContextLanguages
      ?.map((l) => l.toLowerCase())
      .sort()
      .join('|') ?? 'default';
  return `${config.tone ?? 'neutral'}-${config.format ?? 'markdown'}-${config.length ?? 'medium'}-${config.outputLanguage ?? 'default'}-${langKey}-${contextKey}`;
}

export class WriterManager implements IWriterManager {
  private sessionManager = new SessionManager<AIWriter>('WriterManager');
  private retryHandler = new RetryHandler('Draft generation failed');
  private available = false;

  checkAvailability(): Promise<boolean> {
    try {
      const capabilities = capabilityDetector.getCapabilities();
      this.available = capabilities.writer;
      return Promise.resolve(this.available);
    } catch (error) {
      devError('Error checking Writer availability:', error);
      this.available = false;
      return Promise.resolve(false);
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  private mapTone(
    tone: 'calm' | 'professional' | 'casual'
  ): 'formal' | 'neutral' | 'casual' {
    const toneMap = {
      calm: 'neutral',
      professional: 'formal',
      casual: 'casual',
    } as const;
    return toneMap[tone] ?? 'neutral';
  }

  private mapReverseTone(
    tone: 'formal' | 'neutral' | 'casual'
  ): 'calm' | 'professional' | 'casual' {
    const toneMap = {
      formal: 'professional',
      neutral: 'calm',
      casual: 'casual',
    } as const;
    return toneMap[tone] ?? 'calm';
  }

  private async createSession(
    config: WriterSessionConfig
  ): Promise<AIWriter | null> {
    const key = generateSessionKey(config);
    return this.sessionManager.getOrCreate(key, async () => {
      if (typeof Writer === 'undefined') {
        devWarn('Writer API not available');
        return null;
      }
      return Writer.create({
        sharedContext: config.sharedContext,
        tone: config.tone,
        format: config.format ?? 'markdown',
        length: config.length,
        ...(config.outputLanguage && { outputLanguage: config.outputLanguage }),
        ...(config.languageOptions?.expectedInputLanguages?.length && {
          expectedInputLanguages: config.languageOptions.expectedInputLanguages,
        }),
        ...(config.languageOptions?.expectedContextLanguages?.length && {
          expectedContextLanguages:
            config.languageOptions.expectedContextLanguages,
        }),
      });
    });
  }

  async write(prompt: string, options?: WriterSessionConfig): Promise<string> {
    const writerOptions: WriterOptions = {
      tone: this.mapReverseTone(options?.tone ?? 'neutral'),
      length: options?.length ?? 'medium',
    };
    return this.generate(
      prompt,
      writerOptions,
      undefined,
      options?.outputLanguage,
      {
        expectedInputLanguages:
          options?.languageOptions?.expectedInputLanguages,
        expectedContextLanguages:
          options?.languageOptions?.expectedContextLanguages,
      }
    );
  }

  async generate(
    topic: string,
    options: WriterOptions,
    context?: string,
    outputLanguage?: string,
    languageOptions?: WriterLanguageOptions
  ): Promise<string> {
    if (!this.available) {
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) throw new Error('Writer API is not available');
    }

    return this.retryHandler.executeWithRetry(
      () =>
        this.executeGenerate(
          topic,
          options,
          context,
          outputLanguage,
          languageOptions
        ),
      WRITER_TIMEOUT,
      RETRY_TIMEOUT
    );
  }

  private async executeGenerate(
    topic: string,
    options: WriterOptions,
    context?: string,
    outputLanguage?: string,
    languageOptions?: WriterLanguageOptions
  ): Promise<string> {
    const session = await this.createSession({
      tone: this.mapTone(options.tone),
      format: 'plain-text',
      length: options.length,
      outputLanguage,
      languageOptions,
    });

    if (!session) throw new Error('Failed to create writer session');

    const fullPrompt = context ? `Context: ${context}\n\n${topic}` : topic;
    const result = await session.write(fullPrompt);
    const cleanedText = result.trim();
    const wordCount = cleanedText.split(/\s+/).length;
    const range = LENGTH_RANGES[options.length];
    console.log(
      `Generated draft: ${wordCount} words (target: ${range.min}-${range.max})`
    );
    return cleanedText;
  }

  async generateStreaming(
    topic: string,
    options: WriterOptions,
    context: string | undefined,
    onChunk: (chunk: string) => void,
    outputLanguage?: string,
    languageOptions?: WriterLanguageOptions
  ): Promise<string> {
    if (!this.available) {
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) throw new Error('Writer API is not available');
    }

    const sharedContext = context
      ? `Context: ${context}\n\nGenerate a reflective paragraph about: ${topic}`
      : `Generate a reflective paragraph about: ${topic}`;

    const session = await this.createSession({
      sharedContext,
      tone: this.mapTone(options.tone),
      format: 'plain-text',
      length: options.length,
      outputLanguage,
      languageOptions,
    });

    if (!session) throw new Error('Failed to create writer session');

    try {
      const stream = session.writeStreaming(topic, { context });
      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk;
        onChunk(chunk);
      }
      return fullText.trim();
    } catch (error) {
      throw new Error(
        `Streaming generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  destroy(): void {
    this.sessionManager.destroyAll();
  }

  destroySession(options: WriterOptions, outputLanguage?: string): void {
    const prefix = `${this.mapTone(options.tone)}-plain-text-${options.length}`;
    for (const key of this.sessionManager.keys()) {
      if (
        key.startsWith(prefix) &&
        (!outputLanguage || key.includes(outputLanguage))
      ) {
        this.sessionManager.destroy(key);
      }
    }
  }
}
