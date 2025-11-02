/**
 * Unit tests for RewriterManager
 * Tests capability detection, tone mapping, rewriting, and streaming
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RewriterManager } from './rewriterManager';
import type { AIRewriter } from '../../../types/chrome-ai';
import type { TonePreset } from '../../../types';

describe('RewriterManager', () => {
  let manager: RewriterManager;
  let mockRewriter: AIRewriter;

  beforeEach(() => {
    manager = new RewriterManager();

    // Mock rewriter session
    mockRewriter = {
      rewrite: vi
        .fn()
        .mockResolvedValue('This is the rewritten text with adjusted tone.'),
      rewriteStreaming: vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield 'This is ';
          yield 'the rewritten ';
          yield 'text.';
        },
      }),
      destroy: vi.fn(),
    };

    // Set up global Rewriter
    (globalThis as any).Rewriter = {
      create: vi.fn().mockResolvedValue(mockRewriter),
      availability: vi.fn().mockResolvedValue('available'),
    };
  });

  afterEach(() => {
    manager.destroy();
    delete (globalThis as any).Rewriter;
    vi.clearAllMocks();
  });

  describe('checkAvailability', () => {
    it('should detect when Rewriter API is available', async () => {
      const available = await manager.checkAvailability();
      expect(available).toBe(true);
      expect(manager.isAvailable()).toBe(true);
    });
  });

  describe('tone preset mapping', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should map calm preset to as-is tone', async () => {
      await manager.rewrite('test text', 'calm');

      expect((globalThis as any).Rewriter.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: 'as-is',
          length: 'as-is',
        })
      );
    });

    it('should map concise preset to shorter length', async () => {
      await manager.rewrite('test text', 'concise');

      expect((globalThis as any).Rewriter.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: 'as-is',
          length: 'shorter',
        })
      );
    });

    it('should map empathetic preset to more-casual tone', async () => {
      await manager.rewrite('test text', 'empathetic');

      expect((globalThis as any).Rewriter.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: 'more-casual',
          length: 'as-is',
        })
      );
    });

    it('should map academic preset to more-formal tone', async () => {
      await manager.rewrite('test text', 'academic');

      expect((globalThis as any).Rewriter.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: 'more-formal',
          length: 'as-is',
        })
      );
    });
  });

  describe('rewrite', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should rewrite text with specified preset', async () => {
      const result = await manager.rewrite('original text', 'academic');

      expect(result).toEqual({
        original: 'original text',
        rewritten: 'This is the rewritten text with adjusted tone.',
      });
      expect(mockRewriter.rewrite).toHaveBeenCalledWith(
        'original text',
        expect.objectContaining({ context: undefined })
      );
    });

    it('should include context in rewriting', async () => {
      const context = 'This is background context';
      await manager.rewrite('text', 'calm', context);

      expect((globalThis as any).Rewriter.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sharedContext: expect.stringContaining(context),
        })
      );
    });

    it('should preserve original text in response', async () => {
      const originalText = 'This is the original text';
      const result = await manager.rewrite(originalText, 'concise');

      expect(result.original).toBe(originalText);
      expect(result.rewritten).toBeTruthy();
    });
  });

  describe('timeout and retry logic', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should retry with extended timeout on failure', async () => {
      let callCount = 0;
      mockRewriter.rewrite = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve('Rewritten text');
      });

      const result = await manager.rewrite('test', 'calm');

      expect(result.rewritten).toBe('Rewritten text');
      expect(mockRewriter.rewrite).toHaveBeenCalledTimes(2);
    });
  });

  describe('session management', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should reuse cached sessions for same preset', async () => {
      await manager.rewrite('text 1', 'calm');
      await manager.rewrite('text 2', 'calm');

      expect((globalThis as any).Rewriter.create).toHaveBeenCalledTimes(1);
    });

    it('should create separate sessions for different presets', async () => {
      await manager.rewrite('text', 'calm');
      await manager.rewrite('text', 'academic');

      expect((globalThis as any).Rewriter.create).toHaveBeenCalledTimes(2);
    });

    it('should destroy all sessions on cleanup', async () => {
      await manager.rewrite('text', 'calm');
      await manager.rewrite('text', 'academic');

      manager.destroy();

      expect(mockRewriter.destroy).toHaveBeenCalled();
    });
  });

  describe('streaming support', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should rewrite text with streaming', async () => {
      const chunks: string[] = [];
      const onChunk = (chunk: string) => chunks.push(chunk);

      const result = await manager.rewriteStreaming(
        'original',
        'calm',
        undefined,
        onChunk
      );

      expect(result.original).toBe('original');
      expect(result.rewritten).toBe('This is the rewritten text.');
      expect(chunks).toEqual(['This is ', 'the rewritten ', 'text.']);
    });

    it('should call onChunk for each chunk', async () => {
      const onChunk = vi.fn();

      await manager.rewriteStreaming('text', 'calm', undefined, onChunk);

      expect(onChunk).toHaveBeenCalledTimes(3);
      expect(onChunk).toHaveBeenCalledWith('This is ');
      expect(onChunk).toHaveBeenCalledWith('the rewritten ');
      expect(onChunk).toHaveBeenCalledWith('text.');
    });

    it('should handle streaming errors', async () => {
      mockRewriter.rewriteStreaming = vi.fn().mockReturnValue({
        // eslint-disable-next-line require-yield
        [Symbol.asyncIterator]: async function* () {
          throw new Error('Streaming failed');
        },
      });

      await expect(
        manager.rewriteStreaming('text', 'calm', undefined, () => {})
      ).rejects.toThrow('Streaming rewrite failed');
    });
  });

  describe('error handling', () => {
    it('should handle session creation failure', async () => {
      await manager.checkAvailability();
      (globalThis as any).Rewriter.create = vi.fn().mockResolvedValue(null);

      await expect(manager.rewrite('test', 'calm')).rejects.toThrow(
        'Failed to create rewriter session'
      );
    });
  });

  describe('text formatting preservation', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should preserve paragraph structure', async () => {
      const multiParagraph = 'Paragraph 1.\n\nParagraph 2.\n\nParagraph 3.';
      mockRewriter.rewrite = vi
        .fn()
        .mockResolvedValue(
          'Rewritten paragraph 1.\n\nRewritten paragraph 2.\n\nRewritten paragraph 3.'
        );

      const result = await manager.rewrite(multiParagraph, 'calm');

      expect(result.rewritten).toContain('\n\n');
    });

    it('should trim whitespace from result', async () => {
      mockRewriter.rewrite = vi.fn().mockResolvedValue('  Rewritten text  ');

      const result = await manager.rewrite('text', 'calm');

      expect(result.rewritten).toBe('Rewritten text');
    });
  });

  describe('all tone presets', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    const presets: TonePreset[] = ['calm', 'concise', 'empathetic', 'academic'];

    presets.forEach((preset) => {
      it(`should handle ${preset} preset`, async () => {
        const result = await manager.rewrite('test text', preset);

        expect(result.original).toBe('test text');
        expect(result.rewritten).toBeTruthy();
        expect((globalThis as any).Rewriter.create).toHaveBeenCalled();
      });
    });
  });
});
