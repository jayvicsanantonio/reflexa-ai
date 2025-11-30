/**
 * Recursive Summarizer - Implements "summary of summaries" technique
 * Handles large documents that exceed the context window
 */

import type { AISummarizer } from '../../../../types/chrome-ai';
import { RecursiveTextSplitter } from './TextSplitter';
import { devLog, devWarn } from '../../../../utils/logger';

export interface RecursiveSummarizerOptions {
  maxTokens: number;
  charsPerToken?: number;
  chunkOverlap?: number;
  maxRecursionDepth?: number;
}

/**
 * Recursively summarizes large text using the "summary of summaries" technique
 */
export class RecursiveSummarizer {
  private readonly maxTokens: number;
  private readonly charsPerToken: number;
  private readonly chunkOverlap: number;
  private readonly maxRecursionDepth: number;

  constructor(options: RecursiveSummarizerOptions) {
    this.maxTokens = options.maxTokens;
    this.charsPerToken = options.charsPerToken ?? 4; // Average: 1 token ≈ 4 characters
    this.chunkOverlap = options.chunkOverlap ?? 200; // Overlap to maintain context
    this.maxRecursionDepth = options.maxRecursionDepth ?? 10;
  }

  /**
   * Check if text needs to be split
   */
  needsSplitting(text: string): boolean {
    const estimatedTokens = Math.ceil(text.length / this.charsPerToken);
    return estimatedTokens > this.maxTokens;
  }

  /**
   * Summarize text with automatic splitting and recursion
   */
  async summarize(
    text: string,
    summarizer: AISummarizer,
    context?: string,
    depth = 0
  ): Promise<string> {
    if (depth >= this.maxRecursionDepth) {
      devWarn(
        `Max recursion depth (${this.maxRecursionDepth}) reached, returning truncated text`
      );
      return this.truncateText(text);
    }

    // If text fits in context window, summarize directly
    if (!this.needsSplitting(text)) {
      devLog(`Summarizing directly (depth: ${depth}, length: ${text.length})`);
      return await summarizer.summarize(text, { context });
    }

    devLog(
      `Text too large (${text.length} chars), splitting into chunks (depth: ${depth})`
    );

    // Split text into chunks
    const chunks = this.splitText(text);
    devLog(`Split into ${chunks.length} chunks`);

    // Summarize each chunk
    const summaries: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      devLog(`Summarizing chunk ${i + 1}/${chunks.length}`);
      const summary = await summarizer.summarize(chunks[i], {
        context: context ?? `Part ${i + 1} of ${chunks.length}`,
      });
      summaries.push(summary);
    }

    // Concatenate summaries
    const concatenatedSummaries = summaries.join('\n\n');
    devLog(
      `Concatenated summaries length: ${concatenatedSummaries.length} chars`
    );

    // If concatenated summaries still exceed limit, recurse
    if (this.needsSplitting(concatenatedSummaries)) {
      devLog('Concatenated summaries too large, recursing...');
      return await this.summarize(
        concatenatedSummaries,
        summarizer,
        'Summary of summaries',
        depth + 1
      );
    }

    // Final summary of all summaries
    devLog('Creating final summary of summaries');
    return await summarizer.summarize(concatenatedSummaries, {
      context: 'Create a comprehensive summary from these partial summaries',
    });
  }

  /**
   * Summarize text with streaming support
   */
  async summarizeStreaming(
    text: string,
    summarizer: AISummarizer,
    onChunk?: (chunk: string, aggregate: string) => void,
    context?: string,
    depth = 0
  ): Promise<string> {
    if (depth >= this.maxRecursionDepth) {
      devWarn(
        `Max recursion depth (${this.maxRecursionDepth}) reached, returning truncated text`
      );
      const truncated = this.truncateText(text);
      onChunk?.(truncated, truncated);
      return truncated;
    }

    // If text fits in context window, summarize directly with streaming
    if (!this.needsSplitting(text)) {
      devLog(
        `Streaming summarization directly (depth: ${depth}, length: ${text.length})`
      );
      return await this.streamSummarize(summarizer, text, onChunk, context);
    }

    devLog(
      `Text too large (${text.length} chars), splitting for streaming (depth: ${depth})`
    );

    // Split text into chunks
    const chunks = this.splitText(text);
    devLog(`Split into ${chunks.length} chunks for streaming`);

    // Summarize each chunk (non-streaming for intermediate summaries)
    const summaries: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      devLog(`Summarizing chunk ${i + 1}/${chunks.length}`);
      const summary = await summarizer.summarize(chunks[i], {
        context: context ?? `Part ${i + 1} of ${chunks.length}`,
      });
      summaries.push(summary);
    }

    // Concatenate summaries
    const concatenatedSummaries = summaries.join('\n\n');
    devLog(
      `Concatenated summaries length: ${concatenatedSummaries.length} chars`
    );

    // If concatenated summaries still exceed limit, recurse
    if (this.needsSplitting(concatenatedSummaries)) {
      devLog('Concatenated summaries too large, recursing with streaming...');
      return await this.summarizeStreaming(
        concatenatedSummaries,
        summarizer,
        onChunk,
        'Summary of summaries',
        depth + 1
      );
    }

    // Final summary with streaming
    devLog('Creating final streaming summary of summaries');
    return await this.streamSummarize(
      summarizer,
      concatenatedSummaries,
      onChunk,
      'Create a comprehensive summary from these partial summaries'
    );
  }

  /**
   * Split text into chunks
   */
  private splitText(text: string): string[] {
    const maxChunkSize = Math.floor(this.maxTokens * this.charsPerToken);
    const splitter = new RecursiveTextSplitter({
      chunkSize: maxChunkSize,
      chunkOverlap: this.chunkOverlap,
    });
    return splitter.splitText(text);
  }

  /**
   * Helper to handle streaming summarization
   */
  private async streamSummarize(
    summarizer: AISummarizer,
    text: string,
    onChunk?: (chunk: string, aggregate: string) => void,
    context?: string
  ): Promise<string> {
    if (typeof summarizer.summarizeStreaming !== 'function') {
      // Fallback to non-streaming
      const result = await summarizer.summarize(text, { context });
      onChunk?.(result, result);
      return result;
    }

    const stream = summarizer.summarizeStreaming(text, { context });
    let aggregate = '';

    if (
      typeof (stream as unknown as AsyncIterable<string>)[
        Symbol.asyncIterator
      ] === 'function'
    ) {
      for await (const chunk of stream as unknown as AsyncIterable<string>) {
        if (typeof chunk === 'string') {
          aggregate += chunk;
          onChunk?.(chunk, aggregate);
        }
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
    }

    return aggregate;
  }

  /**
   * Truncate text to fit within token limit
   */
  private truncateText(text: string): string {
    const maxChars = Math.floor(this.maxTokens * this.charsPerToken);
    if (text.length <= maxChars) {
      return text;
    }
    return text.slice(0, maxChars) + '...';
  }
}
