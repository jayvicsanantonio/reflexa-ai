/**
 * Rewriter Manager - Refactored with SOLID principles
 */

import type { TonePreset } from '../../../../types';
import type { AIRewriter } from '../../../../types/chrome-ai';
import type {
  IRewriterManager,
  RewriterSessionConfig,
  RewriterLanguageOptions,
} from './interfaces';
import { SessionManager } from '../shared/SessionManager';
import { RetryHandler } from '../shared/RetryHandler';
import { capabilityDetector } from '../../capabilities/capabilityDetector';
import { devWarn, devError } from '../../../../utils/logger';

const REWRITER_TIMEOUT = 5000;
const RETRY_TIMEOUT = 8000;

function generateSessionKey(config: RewriterSessionConfig): string {
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
  return `${config.tone ?? 'as-is'}-${config.format ?? 'as-is'}-${config.length ?? 'as-is'}-${config.outputLanguage ?? 'default'}-${langKey}-${contextKey}`;
}

export class RewriterManager implements IRewriterManager {
  private sessionManager = new SessionManager<AIRewriter>('RewriterManager');
  private retryHandler = new RetryHandler('Text rewriting failed');
  private available = false;

  async checkAvailability(): Promise<boolean> {
    try {
      const capabilities = await Promise.resolve(
        capabilityDetector.getCapabilities()
      );
      this.available = Boolean(capabilities.rewriter);
      return this.available;
    } catch (error) {
      devError('Error checking Rewriter availability:', error);
      this.available = false;
      return false;
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  private mapTonePreset(preset: TonePreset): {
    tone: RewriterSessionConfig['tone'];
    length: RewriterSessionConfig['length'];
  } {
    const presetMap: Record<
      TonePreset,
      {
        tone: RewriterSessionConfig['tone'];
        length: RewriterSessionConfig['length'];
      }
    > = {
      calm: { tone: 'as-is', length: 'as-is' },
      concise: { tone: 'as-is', length: 'shorter' },
      empathetic: { tone: 'more-casual', length: 'as-is' },
      academic: { tone: 'more-formal', length: 'as-is' },
    };
    return presetMap[preset] ?? { tone: 'as-is', length: 'as-is' };
  }

  private async createSession(
    config: RewriterSessionConfig
  ): Promise<AIRewriter | null> {
    const key = generateSessionKey(config);
    return this.sessionManager.getOrCreate(key, async () => {
      if (typeof Rewriter === 'undefined') {
        devWarn('Rewriter API not available');
        return null;
      }
      return Rewriter.create({
        sharedContext: config.sharedContext,
        tone: config.tone,
        format: config.format,
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

  async rewrite(
    text: string,
    preset: TonePreset,
    context?: string,
    outputLanguage?: string,
    languageOptions?: RewriterLanguageOptions
  ): Promise<{ original: string; rewritten: string }> {
    if (!this.available) {
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) throw new Error('Rewriter API is not available');
    }

    const rewritten = await this.retryHandler.executeWithRetry(
      () =>
        this.executeRewrite(
          text,
          preset,
          context,
          outputLanguage,
          languageOptions
        ),
      REWRITER_TIMEOUT,
      RETRY_TIMEOUT
    );
    return { original: text, rewritten };
  }

  private async executeRewrite(
    text: string,
    preset: TonePreset,
    context?: string,
    outputLanguage?: string,
    languageOptions?: RewriterLanguageOptions
  ): Promise<string> {
    const { tone, length } = this.mapTonePreset(preset);
    const sharedContext = context
      ? `Context: ${context}\n\nRewrite the following text with ${preset} tone:`
      : undefined;

    const session = await this.createSession({
      sharedContext,
      tone,
      format: 'plain-text',
      length,
      outputLanguage,
      languageOptions,
    });

    if (!session) throw new Error('Failed to create rewriter session');
    const result = await session.rewrite(text, { context });
    return result.trim();
  }

  async rewriteStreaming(
    text: string,
    preset: TonePreset,
    context: string | undefined,
    onChunk: (chunk: string) => void,
    outputLanguage?: string,
    languageOptions?: RewriterLanguageOptions
  ): Promise<{ original: string; rewritten: string }> {
    if (!this.available) {
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) throw new Error('Rewriter API is not available');
    }

    const { tone, length } = this.mapTonePreset(preset);
    const sharedContext = context
      ? `Context: ${context}\n\nRewrite the following text with ${preset} tone:`
      : undefined;

    const session = await this.createSession({
      sharedContext,
      tone,
      format: 'plain-text',
      length,
      outputLanguage,
      languageOptions,
    });

    if (!session) throw new Error('Failed to create rewriter session');

    try {
      const stream = session.rewriteStreaming(text, { context });
      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk;
        onChunk(chunk);
      }
      return { original: text, rewritten: fullText.trim() };
    } catch (error) {
      throw new Error(
        `Streaming rewrite failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  destroy(): void {
    this.sessionManager.destroyAll();
  }

  destroySession(preset: TonePreset): void {
    const { tone, length } = this.mapTonePreset(preset);
    const prefix = `${tone}-${length}`;
    for (const key of this.sessionManager.keys()) {
      if (key.startsWith(prefix)) {
        this.sessionManager.destroy(key);
      }
    }
  }
}
