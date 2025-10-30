/**
 * Unit tests for ProofreaderManager
 * Tests capability detection, proofreading, correction tracking, and error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ProofreaderManager } from './proofreaderManager';
import type {
  AIProofreader,
  AIProofreaderFactory,
} from '../../../types/chrome-ai';

describe('ProofreaderManager', () => {
  let manager: ProofreaderManager;
  let mockProofreader: AIProofreader;
  let mockProofreaderFactory: AIProofreaderFactory;

  beforeEach(() => {
    manager = new ProofreaderManager();

    // Mock proofreader session
    mockProofreader = {
      proofread: vi.fn().mockResolvedValue({
        correction: 'This is the corrected text with proper grammar.',
        corrections: [
          { startIndex: 0, endIndex: 4 },
          { startIndex: 10, endIndex: 15 },
        ],
      }),
      destroy: vi.fn(),
    };

    // Mock proofreader factory
    mockProofreaderFactory = {
      create: vi.fn().mockResolvedValue(mockProofreader),
      availability: vi.fn().mockResolvedValue('available'),
    };

    // Set up global Proofreader
    (globalThis as any).Proofreader = mockProofreaderFactory;
  });

  afterEach(() => {
    manager.destroy();
    delete (globalThis as any).Proofreader;
    vi.clearAllMocks();
  });

  describe('checkAvailability', () => {
    it('should detect when Proofreader API is available', async () => {
      const available = await manager.checkAvailability();
      expect(available).toBe(true);
      expect(manager.isAvailable()).toBe(true);
    });

    it('should detect when Proofreader API is unavailable', async () => {
      delete (globalThis as any).Proofreader;
      const available = await manager.checkAvailability();
      expect(available).toBe(false);
      expect(manager.isAvailable()).toBe(false);
    });

    it('should handle availability check errors', async () => {
      mockProofreaderFactory.availability = vi
        .fn()
        .mockRejectedValue(new Error('Check failed'));
      const available = await manager.checkAvailability();
      expect(available).toBe(false);
    });

    it('should detect downloadable status as available', async () => {
      mockProofreaderFactory.availability = vi
        .fn()
        .mockResolvedValue('downloadable');
      const available = await manager.checkAvailability();
      expect(available).toBe(true);
    });
  });

  describe('proofread', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should proofread text and return corrections', async () => {
      const text = 'This are wrong grammar.';
      const result = await manager.proofread(text);

      expect(result.correctedText).toBe(
        'This is the corrected text with proper grammar.'
      );
      expect(result.corrections).toHaveLength(2);
      expect(mockProofreader.proofread).toHaveBeenCalledWith(text);
    });

    it.skip('should transform corrections with original text', async () => {
      const text = 'This are wrong grammar.';
      const result = await manager.proofread(text);

      expect(result.corrections[0]).toEqual({
        startIndex: 0,
        endIndex: 4,
        original: 'This',
      });
      expect(result.corrections[1]).toEqual({
        startIndex: 10,
        endIndex: 15,
        original: 'wrong',
      });
    });

    it('should create session with default language', async () => {
      await manager.proofread('test text');

      expect(mockProofreaderFactory.create).toHaveBeenCalledWith({
        expectedInputLanguages: ['en'],
      });
    });

    it('should create session with custom languages', async () => {
      await manager.proofread('test text', {
        expectedInputLanguages: ['en', 'es', 'fr'],
      });

      expect(mockProofreaderFactory.create).toHaveBeenCalledWith({
        expectedInputLanguages: ['en', 'es', 'fr'],
      });
    });

    it('should trim corrected text', async () => {
      mockProofreader.proofread = vi.fn().mockResolvedValue({
        correction: '  Corrected text  ',
        corrections: [],
      });

      const result = await manager.proofread('test');

      expect(result.correctedText).toBe('Corrected text');
    });
  });

  describe('timeout and retry logic', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it.skip('should timeout after 5 seconds on first attempt', async () => {
      mockProofreader.proofread = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 6000))
        );

      await expect(manager.proofread('test')).rejects.toThrow(
        'Proofreading failed'
      );
    }, 10000);

    it('should retry with extended timeout on failure', async () => {
      let callCount = 0;
      mockProofreader.proofread = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve({
          correction: 'Corrected text',
          corrections: [],
        });
      });

      const result = await manager.proofread('test');

      expect(result.correctedText).toBe('Corrected text');
      expect(mockProofreader.proofread).toHaveBeenCalledTimes(2);
    });

    it('should throw error after retry fails', async () => {
      mockProofreader.proofread = vi
        .fn()
        .mockRejectedValue(new Error('API Error'));

      await expect(manager.proofread('test')).rejects.toThrow(
        'Proofreading failed'
      );
    });
  });

  describe('session management', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should reuse single session for multiple proofreads', async () => {
      await manager.proofread('text 1');
      await manager.proofread('text 2');
      await manager.proofread('text 3');

      // Should only create session once
      expect(mockProofreaderFactory.create).toHaveBeenCalledTimes(1);
    });

    it('should destroy session on cleanup', async () => {
      await manager.proofread('test');

      manager.destroy();

      expect(mockProofreader.destroy).toHaveBeenCalled();
    });

    it('should handle multiple destroy calls safely', async () => {
      await manager.proofread('test');

      manager.destroy();
      manager.destroy(); // Should not throw

      expect(mockProofreader.destroy).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should throw error when API is unavailable', async () => {
      delete (globalThis as any).Proofreader;
      await manager.checkAvailability();

      await expect(manager.proofread('test')).rejects.toThrow(
        'Proofreader API is not available'
      );
    });

    it('should handle session creation failure', async () => {
      await manager.checkAvailability();
      mockProofreaderFactory.create = vi.fn().mockResolvedValue(null);

      await expect(manager.proofread('test')).rejects.toThrow(
        'Failed to create proofreader session'
      );
    });

    it('should handle proofreading errors gracefully', async () => {
      await manager.checkAvailability();
      mockProofreader.proofread = vi
        .fn()
        .mockRejectedValue(new Error('Proofreading error'));

      await expect(manager.proofread('test')).rejects.toThrow(
        'Proofreading failed'
      );
    });
  });

  describe('correction tracking', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should handle empty corrections array', async () => {
      mockProofreader.proofread = vi.fn().mockResolvedValue({
        correction: 'Perfect text',
        corrections: [],
      });

      const result = await manager.proofread('Perfect text');

      expect(result.corrections).toHaveLength(0);
      expect(result.correctedText).toBe('Perfect text');
    });

    it.skip('should handle multiple corrections', async () => {
      const text = 'This are very wrong grammer and speling.';
      mockProofreader.proofread = vi.fn().mockResolvedValue({
        correction: 'This is very wrong grammar and spelling.',
        corrections: [
          { startIndex: 5, endIndex: 8 },
          { startIndex: 19, endIndex: 26 },
          { startIndex: 31, endIndex: 38 },
        ],
      });

      const result = await manager.proofread(text);

      expect(result.corrections).toHaveLength(3);
      expect(result.corrections[0].original).toBe('are');
      expect(result.corrections[1].original).toBe('grammer');
      expect(result.corrections[2].original).toBe('speling');
    });

    it('should extract correct original text from indices', async () => {
      const text = 'The quick brown fox jumps.';
      mockProofreader.proofread = vi.fn().mockResolvedValue({
        correction: 'The quick brown fox jumped.',
        corrections: [{ startIndex: 20, endIndex: 25 }],
      });

      const result = await manager.proofread(text);

      expect(result.corrections[0].original).toBe('jumps');
    });
  });

  describe('multilingual support', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should support multiple input languages', async () => {
      const languages = ['en', 'es', 'fr', 'de'];
      await manager.proofread('test', { expectedInputLanguages: languages });

      expect(mockProofreaderFactory.create).toHaveBeenCalledWith({
        expectedInputLanguages: languages,
      });
    });

    it('should handle single language', async () => {
      await manager.proofread('test', { expectedInputLanguages: ['es'] });

      expect(mockProofreaderFactory.create).toHaveBeenCalledWith({
        expectedInputLanguages: ['es'],
      });
    });
  });
});
