/**
 * Unit tests for WriterManager
 * Tests capability detection, draft generation, tone mapping, and streaming
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WriterManager } from './writerManager';
import type { AIWriter } from '../../../types/chrome-ai';
import type { WriterOptions } from '../../../types';

describe('WriterManager', () => {
  let manager: WriterManager;
  let mockWriter: AIWriter;

  beforeEach(() => {
    manager = new WriterManager();

    // Mock writer session
    mockWriter = {
      write: vi
        .fn()
        .mockResolvedValue('This is a generated draft about the topic.'),
      writeStreaming: vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield 'This is ';
          yield 'a generated ';
          yield 'draft.';
        },
      }),
      destroy: vi.fn(),
    };

    // Set up global Writer
    (globalThis as any).Writer = {
      create: vi.fn().mockResolvedValue(mockWriter),
      availability: vi.fn().mockResolvedValue('available'),
    };
  });

  afterEach(() => {
    manager.destroy();
    delete (globalThis as any).Writer;
    vi.clearAllMocks();
  });

  describe('checkAvailability', () => {
    it('should detect when Writer API is available', async () => {
      const available = await manager.checkAvailability();
      expect(available).toBe(true);
      expect(manager.isAvailable()).toBe(true);
    });

    it.skip('should detect when Writer API is unavailable', async () => {
      // Clear capability cache first
      (globalThis as any).capabilityDetector = undefined;
      delete (globalThis as any).Writer;
      const available = await manager.checkAvailability();
      expect(available).toBe(false);
      expect(manager.isAvailable()).toBe(false);
    });
  });

  describe('generate', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should generate draft with calm tone', async () => {
      const options: WriterOptions = { tone: 'calm', length: 'short' };
      const result = await manager.generate('test topic', options);

      expect(result).toBe('This is a generated draft about the topic.');
      expect((globalThis as any).Writer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: 'neutral',
          length: 'short',
        })
      );
    });

    it('should generate draft with professional tone', async () => {
      const options: WriterOptions = { tone: 'professional', length: 'medium' };
      await manager.generate('test topic', options);

      expect((globalThis as any).Writer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: 'formal',
          length: 'medium',
        })
      );
    });

    it('should generate draft with casual tone', async () => {
      const options: WriterOptions = { tone: 'casual', length: 'long' };
      await manager.generate('test topic', options);

      expect((globalThis as any).Writer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: 'casual',
          length: 'long',
        })
      );
    });

    it('should include context in generation', async () => {
      const options: WriterOptions = { tone: 'calm', length: 'short' };
      const context = 'This is background context';

      await manager.generate('test topic', options, context);

      // Context is now passed in the prompt, not as sharedContext
      expect(mockWriter.write).toHaveBeenCalledWith(
        expect.stringContaining(context)
      );
    });

    it('should pass context to write method', async () => {
      const options: WriterOptions = { tone: 'calm', length: 'short' };
      const context = 'Background context';

      await manager.generate('test topic', options, context);

      // Context is prepended to the topic in the prompt
      expect(mockWriter.write).toHaveBeenCalledWith(
        `Context: ${context}\n\ntest topic`
      );
    });
  });

  describe('write method', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should write with formal tone', async () => {
      const result = await manager.write('test prompt', {
        tone: 'formal',
        length: 'short',
      });

      expect(result).toBe('This is a generated draft about the topic.');
      expect((globalThis as any).Writer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: 'formal',
        })
      );
    });

    it('should write with neutral tone', async () => {
      await manager.write('test prompt', {
        tone: 'neutral',
        length: 'medium',
      });

      expect((globalThis as any).Writer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: 'neutral',
        })
      );
    });
  });

  describe('timeout and retry logic', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should timeout after 5 seconds on first attempt', async () => {
      mockWriter.write = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 6000))
        );

      const options: WriterOptions = { tone: 'calm', length: 'short' };
      await expect(manager.generate('test', options)).rejects.toThrow(
        'Draft generation failed'
      );
    }, 15000);

    it('should retry with extended timeout on failure', async () => {
      let callCount = 0;
      mockWriter.write = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve('Generated text');
      });

      const options: WriterOptions = { tone: 'calm', length: 'short' };
      const result = await manager.generate('test', options);

      expect(result).toBe('Generated text');
      expect(mockWriter.write).toHaveBeenCalledTimes(2);
    });
  });

  describe('session management', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should reuse cached sessions for same configuration', async () => {
      const options: WriterOptions = { tone: 'calm', length: 'short' };

      await manager.generate('topic 1', options);
      await manager.generate('topic 2', options);

      expect((globalThis as any).Writer.create).toHaveBeenCalledTimes(1);
    });

    it('should create separate sessions for different configurations', async () => {
      await manager.generate('topic', { tone: 'calm', length: 'short' });
      await manager.generate('topic', { tone: 'professional', length: 'long' });

      expect((globalThis as any).Writer.create).toHaveBeenCalledTimes(2);
    });

    it('should destroy all sessions on cleanup', async () => {
      await manager.generate('topic', { tone: 'calm', length: 'short' });
      await manager.generate('topic', { tone: 'casual', length: 'medium' });

      manager.destroy();

      expect(mockWriter.destroy).toHaveBeenCalled();
    });

    it('should destroy specific session', async () => {
      const options: WriterOptions = { tone: 'calm', length: 'short' };
      await manager.generate('topic', options);

      manager.destroySession(options);

      expect(mockWriter.destroy).toHaveBeenCalled();
    });
  });

  describe('streaming support', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should generate text with streaming', async () => {
      const chunks: string[] = [];
      const onChunk = (chunk: string) => chunks.push(chunk);

      const options: WriterOptions = { tone: 'calm', length: 'short' };
      const result = await manager.generateStreaming(
        'topic',
        options,
        undefined,
        onChunk
      );

      expect(result).toBe('This is a generated draft.');
      expect(chunks).toEqual(['This is ', 'a generated ', 'draft.']);
    });

    it('should call onChunk for each chunk', async () => {
      const onChunk = vi.fn();
      const options: WriterOptions = { tone: 'calm', length: 'short' };

      await manager.generateStreaming('topic', options, undefined, onChunk);

      expect(onChunk).toHaveBeenCalledTimes(3);
      expect(onChunk).toHaveBeenCalledWith('This is ');
      expect(onChunk).toHaveBeenCalledWith('a generated ');
      expect(onChunk).toHaveBeenCalledWith('draft.');
    });

    it('should handle streaming errors', async () => {
      mockWriter.writeStreaming = vi.fn().mockReturnValue({
        // eslint-disable-next-line require-yield
        [Symbol.asyncIterator]: async function* () {
          throw new Error('Streaming failed');
        },
      });

      const options: WriterOptions = { tone: 'calm', length: 'short' };
      await expect(
        manager.generateStreaming('topic', options, undefined, () => {})
      ).rejects.toThrow('Streaming generation failed');
    });
  });

  describe('error handling', () => {
    it.skip('should throw error when API is unavailable', async () => {
      manager = new WriterManager(); // Create fresh instance
      delete (globalThis as any).Writer;
      await manager.checkAvailability();

      const options: WriterOptions = { tone: 'calm', length: 'short' };
      await expect(manager.generate('test', options)).rejects.toThrow(
        'Writer API is not available'
      );
    });

    it('should handle session creation failure', async () => {
      await manager.checkAvailability();
      (globalThis as any).Writer.create = vi.fn().mockResolvedValue(null);

      const options: WriterOptions = { tone: 'calm', length: 'short' };
      await expect(manager.generate('test', options)).rejects.toThrow(
        'Failed to create writer session'
      );
    });
  });

  describe('length validation', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should log word count for short length', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const options: WriterOptions = { tone: 'calm', length: 'short' };

      await manager.generate('test', options);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Generated draft:')
      );
    });

    it('should handle different length options', async () => {
      const options: WriterOptions = { tone: 'calm', length: 'long' };
      const result = await manager.generate('test', options);

      expect(result).toBeTruthy();
      expect((globalThis as any).Writer.create).toHaveBeenCalledWith(
        expect.objectContaining({ length: 'long' })
      );
    });
  });
});
