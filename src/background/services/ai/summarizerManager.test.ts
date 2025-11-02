/**
 * Unit tests for SummarizerManager
 * Tests capability detection, summarization formats, timeout/retry, and session management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SummarizerManager } from './summarizerManager';
import type {
  AISummarizer,
  AISummarizerFactory,
} from '../../../types/chrome-ai';

describe('SummarizerManager', () => {
  let manager: SummarizerManager;
  let mockSummarizer: AISummarizer;
  let mockSummarizerFactory: AISummarizerFactory;

  beforeEach(() => {
    manager = new SummarizerManager();

    // Mock summarizer session
    mockSummarizer = {
      summarize: vi.fn().mockResolvedValue('- Point 1\n- Point 2\n- Point 3'),
      summarizeStreaming: vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield '- Point 1\n';
          yield '- Point 2\n';
          yield '- Point 3';
        },
      }),
      destroy: vi.fn(),
    };

    // Mock summarizer factory
    mockSummarizerFactory = {
      create: vi.fn().mockResolvedValue(mockSummarizer),
      availability: vi.fn().mockResolvedValue('available'),
    };

    // Set up global Summarizer
    (globalThis as any).Summarizer = mockSummarizerFactory;
  });

  afterEach(() => {
    manager.destroy();
    delete (globalThis as any).Summarizer;
    vi.clearAllMocks();
  });

  describe('checkAvailability', () => {
    it('should detect when Summarizer API is available', async () => {
      const available = await manager.checkAvailability();
      expect(available).toBe(true);
      expect(manager.isAvailable()).toBe(true);
    });
  });

  describe('summarize - bullets format', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should generate bullet point summary', async () => {
      const text =
        'This is a long article about AI technology and its applications.';
      const result = await manager.summarize(text, 'bullets');

      expect(result).toHaveLength(3);
      expect(mockSummarizerFactory.create).toHaveBeenCalledWith({
        type: 'key-points',
        format: 'markdown',
        length: 'short',
      });
      expect(mockSummarizer.summarize).toHaveBeenCalledWith(text);
    });

    it('should parse markdown bullets correctly', async () => {
      mockSummarizer.summarize = vi
        .fn()
        .mockResolvedValue('- First point\n- Second point\n- Third point');

      const result = await manager.summarize('test text', 'bullets');

      expect(result).toEqual(['First point', 'Second point', 'Third point']);
    });

    it('should limit to 3 bullets', async () => {
      mockSummarizer.summarize = vi
        .fn()
        .mockResolvedValue(
          '- Point 1\n- Point 2\n- Point 3\n- Point 4\n- Point 5'
        );

      const result = await manager.summarize('test text', 'bullets');

      expect(result).toHaveLength(3);
    });
  });

  describe('summarize - paragraph format', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should generate paragraph summary', async () => {
      mockSummarizer.summarize = vi
        .fn()
        .mockResolvedValue(
          'This is a concise paragraph summary of the content.'
        );

      const result = await manager.summarize('test text', 'paragraph');

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(
        'This is a concise paragraph summary of the content.'
      );
      expect(mockSummarizerFactory.create).toHaveBeenCalledWith({
        type: 'tldr',
        format: 'plain-text',
        length: 'medium',
      });
    });
  });

  describe('summarize - headline-bullets format', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should generate headline and bullets', async () => {
      const headlineSummarizer = {
        summarize: vi.fn().mockResolvedValue('AI Technology Overview'),
        destroy: vi.fn(),
      };

      const bulletsSummarizer = {
        summarize: vi.fn().mockResolvedValue('- Point 1\n- Point 2\n- Point 3'),
        destroy: vi.fn(),
      };

      mockSummarizerFactory.create = vi
        .fn()
        .mockResolvedValueOnce(headlineSummarizer)
        .mockResolvedValueOnce(bulletsSummarizer);

      const result = await manager.summarize('test text', 'headline-bullets');

      expect(result).toHaveLength(4); // 1 headline + 3 bullets
      expect(result[0]).toBe('AI Technology Overview');
      expect(result[1]).toBe('Point 1');
      expect(result[2]).toBe('Point 2');
      expect(result[3]).toBe('Point 3');
    });
  });

  describe('timeout and retry logic', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should timeout after 5 seconds on first attempt', async () => {
      mockSummarizer.summarize = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 6000))
        );

      await expect(manager.summarize('test text', 'bullets')).rejects.toThrow(
        'Summarization failed'
      );
    }, 15000);

    it('should retry with extended timeout on failure', async () => {
      let callCount = 0;
      mockSummarizer.summarize = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 100)
          );
        }
        return Promise.resolve('- Point 1\n- Point 2\n- Point 3');
      });

      const result = await manager.summarize('test text', 'bullets');

      expect(result).toHaveLength(3);
      expect(mockSummarizer.summarize).toHaveBeenCalledTimes(2);
    });

    it('should throw error after retry fails', async () => {
      mockSummarizer.summarize = vi
        .fn()
        .mockRejectedValue(new Error('API Error'));

      await expect(manager.summarize('test text', 'bullets')).rejects.toThrow(
        'Summarization failed'
      );
    });
  });

  describe('session management', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should reuse cached sessions', async () => {
      await manager.summarize('text 1', 'bullets');
      await manager.summarize('text 2', 'bullets');

      // Should only create session once
      expect(mockSummarizerFactory.create).toHaveBeenCalledTimes(1);
    });

    it('should create separate sessions for different formats', async () => {
      await manager.summarize('text', 'bullets');
      await manager.summarize('text', 'paragraph');

      expect(mockSummarizerFactory.create).toHaveBeenCalledTimes(2);
    });

    it('should destroy all sessions on cleanup', async () => {
      await manager.summarize('text', 'bullets');
      await manager.summarize('text', 'paragraph');

      manager.destroy();

      expect(mockSummarizer.destroy).toHaveBeenCalled();
    });

    it('should handle session errors and retry', async () => {
      let callCount = 0;
      mockSummarizer.summarize = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Session invalid');
        }
        return Promise.resolve('- Point 1\n- Point 2\n- Point 3');
      });

      const result = await manager.summarize('test text', 'bullets');

      expect(result).toHaveLength(3);
      // Session is created once and reused, retry happens at the summarize level
      expect(mockSummarizerFactory.create).toHaveBeenCalledTimes(1);
      // But summarize should be called twice (initial + retry)
      expect(mockSummarizer.summarize).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('should handle session creation failure', async () => {
      await manager.checkAvailability();
      mockSummarizerFactory.create = vi
        .fn()
        .mockRejectedValue(new Error('Creation failed'));

      await expect(manager.summarize('test', 'bullets')).rejects.toThrow(
        'Summarization failed'
      );
    });

    it('should handle unsupported format', async () => {
      await manager.checkAvailability();

      await expect(
        manager.summarize('test', 'invalid-format' as any)
      ).rejects.toThrow('Unsupported format');
    });
  });

  describe('response parsing', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should handle response without bullet markers', async () => {
      mockSummarizer.summarize = vi
        .fn()
        .mockResolvedValue('Point 1\nPoint 2\nPoint 3');

      const result = await manager.summarize('test', 'bullets');

      expect(result).toHaveLength(3);
      expect(result).toEqual(['Point 1', 'Point 2', 'Point 3']);
    });

    it('should filter empty lines', async () => {
      mockSummarizer.summarize = vi
        .fn()
        .mockResolvedValue('- Point 1\n\n- Point 2\n\n- Point 3');

      const result = await manager.summarize('test', 'bullets');

      expect(result).toHaveLength(3);
      expect(result).not.toContain('');
    });
  });
});
