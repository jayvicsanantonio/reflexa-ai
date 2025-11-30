import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecursiveSummarizer } from './RecursiveSummarizer';
import type { AISummarizer } from '../../../../types/chrome-ai';

describe('RecursiveSummarizer', () => {
  let mockSummarizer: AISummarizer;

  beforeEach(() => {
    mockSummarizer = {
      summarize: vi.fn().mockResolvedValue('Summary'),
      summarizeStreaming: vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield 'Sum';
          yield 'mary';
        },
      }),
      destroy: vi.fn(),
    };
  });

  describe('needsSplitting', () => {
    it('should return false for small text', () => {
      const summarizer = new RecursiveSummarizer({
        maxTokens: 1000,
        charsPerToken: 4,
      });

      const smallText = 'a'.repeat(100); // ~25 tokens
      expect(summarizer.needsSplitting(smallText)).toBe(false);
    });

    it('should return true for large text', () => {
      const summarizer = new RecursiveSummarizer({
        maxTokens: 100,
        charsPerToken: 4,
      });

      const largeText = 'a'.repeat(1000); // ~250 tokens
      expect(summarizer.needsSplitting(largeText)).toBe(true);
    });
  });

  describe('summarize', () => {
    it('should summarize directly if text fits in context window', async () => {
      const summarizer = new RecursiveSummarizer({
        maxTokens: 1000,
        charsPerToken: 4,
      });

      const smallText = 'Small text to summarize';
      const result = await summarizer.summarize(smallText, mockSummarizer);

      expect(mockSummarizer.summarize).toHaveBeenCalledWith(smallText, {
        context: undefined,
      });
      expect(result).toBe('Summary');
    });

    it('should split and recursively summarize large text', async () => {
      const summarizer = new RecursiveSummarizer({
        maxTokens: 10, // Very small to force splitting
        charsPerToken: 4,
        chunkOverlap: 5,
      });

      const largeText = 'word '.repeat(50); // 250 characters
      const result = await summarizer.summarize(largeText, mockSummarizer);

      // Should be called multiple times (once per chunk + final summary)
      expect(mockSummarizer.summarize).toHaveBeenCalled();
      expect(result).toBe('Summary');
    });

    it('should respect max recursion depth', async () => {
      const summarizer = new RecursiveSummarizer({
        maxTokens: 5, // Small enough to force recursion but not too small
        charsPerToken: 4,
        maxRecursionDepth: 2,
      });

      const largeText = 'word '.repeat(30); // Smaller text for faster test
      const result = await summarizer.summarize(largeText, mockSummarizer);

      // Should return truncated text when max depth reached
      expect(result).toBeTruthy();
      expect(result.length).toBeLessThanOrEqual(largeText.length);
    });
  });

  describe('summarizeStreaming', () => {
    it('should stream directly if text fits in context window', async () => {
      const summarizer = new RecursiveSummarizer({
        maxTokens: 1000,
        charsPerToken: 4,
      });

      const chunks: string[] = [];
      const onChunk = (chunk: string) => chunks.push(chunk);

      const smallText = 'Small text to summarize';
      const result = await summarizer.summarizeStreaming(
        smallText,
        mockSummarizer,
        onChunk
      );

      expect(mockSummarizer.summarizeStreaming).toHaveBeenCalled();
      expect(chunks).toEqual(['Sum', 'mary']);
      expect(result).toBe('Summary');
    });

    it('should split and summarize large text with streaming for final summary', async () => {
      const summarizer = new RecursiveSummarizer({
        maxTokens: 10,
        charsPerToken: 4,
        chunkOverlap: 5,
      });

      const chunks: string[] = [];
      const onChunk = (chunk: string) => chunks.push(chunk);

      const largeText = 'word '.repeat(50);
      const result = await summarizer.summarizeStreaming(
        largeText,
        mockSummarizer,
        onChunk
      );

      // Should call both summarize (for chunks) and summarizeStreaming (for final)
      expect(mockSummarizer.summarize).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it('should handle summarizer without streaming support', async () => {
      const noStreamSummarizer: AISummarizer = {
        summarize: vi.fn().mockResolvedValue('Summary'),
        summarizeStreaming: undefined as never,
        destroy: vi.fn(),
      };

      const summarizer = new RecursiveSummarizer({
        maxTokens: 1000,
        charsPerToken: 4,
      });

      const chunks: string[] = [];
      const onChunk = (chunk: string) => chunks.push(chunk);

      const result = await summarizer.summarizeStreaming(
        'Small text',
        noStreamSummarizer,
        onChunk
      );

      expect(noStreamSummarizer.summarize).toHaveBeenCalled();
      expect(chunks).toEqual(['Summary']);
      expect(result).toBe('Summary');
    });
  });
});
