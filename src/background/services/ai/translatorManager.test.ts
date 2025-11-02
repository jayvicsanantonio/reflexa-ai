/**
 * Unit tests for TranslatorManager
 * Tests capability detection, translation, language pair validation, and markdown preservation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { translatorManager, SUPPORTED_LANGUAGES } from './translatorManager';
import type { AITranslator } from '../../../types/chrome-ai';

describe('TranslatorManager', () => {
  let mockTranslator: AITranslator;

  beforeEach(() => {
    // Mock translator session
    mockTranslator = {
      translate: vi.fn().mockResolvedValue('Translated text'),
      translateStreaming: vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield 'Translated ';
          yield 'text';
        },
      }),
      destroy: vi.fn(),
    };

    // Set up global Translator
    (globalThis as any).Translator = {
      create: vi.fn().mockResolvedValue(mockTranslator),
      availability: vi.fn().mockResolvedValue('available'),
    };
  });

  afterEach(() => {
    translatorManager.destroy();
    delete (globalThis as any).Translator;
    vi.clearAllMocks();
  });

  describe('checkAvailability', () => {
    it('should detect when Translator API is available', async () => {
      const available = await translatorManager.checkAvailability();
      expect(available).toBe(true);
      expect(translatorManager.isAvailable()).toBe(true);
    });
  });

  describe('canTranslate', () => {
    beforeEach(async () => {
      await translatorManager.checkAvailability();
    });

    it('should check if language pair is available', async () => {
      const canTranslate = await translatorManager.canTranslate('en', 'es');

      expect(canTranslate).toBe(true);
      expect((globalThis as any).Translator.availability).toHaveBeenCalledWith({
        sourceLanguage: 'en',
        targetLanguage: 'es',
      });
    });

    it('should return false for unavailable language pair', async () => {
      (globalThis as any).Translator.availability = vi
        .fn()
        .mockResolvedValue('no');

      const canTranslate = await translatorManager.canTranslate('en', 'xyz');

      expect(canTranslate).toBe(false);
    });

    it('should handle availability check errors', async () => {
      (globalThis as any).Translator.availability = vi
        .fn()
        .mockRejectedValue(new Error('Check failed'));

      const canTranslate = await translatorManager.canTranslate('en', 'es');

      expect(canTranslate).toBe(false);
    });
  });

  describe('translate', () => {
    beforeEach(async () => {
      await translatorManager.checkAvailability();
    });

    it('should translate text between languages', async () => {
      const result = await translatorManager.translate(
        'Hello world',
        'es',
        'en'
      );

      expect(result).toBe('Translated text');
      expect((globalThis as any).Translator.create).toHaveBeenCalledWith({
        sourceLanguage: 'en',
        targetLanguage: 'es',
      });
      expect(mockTranslator.translate).toHaveBeenCalledWith('Hello world');
    });

    it('should require source language', async () => {
      await expect(translatorManager.translate('Hello', 'es')).rejects.toThrow(
        'Source language must be provided'
      );
    });

    it('should validate language pair before translation', async () => {
      (globalThis as any).Translator.availability = vi
        .fn()
        .mockResolvedValue('no');

      await expect(
        translatorManager.translate('Hello', 'xyz', 'en')
      ).rejects.toThrow('Translation not available for en -> xyz');
    });

    it('should trim translated text', async () => {
      mockTranslator.translate = vi
        .fn()
        .mockResolvedValue('  Translated text  ');

      const result = await translatorManager.translate('test', 'es', 'en');

      expect(result).toBe('Translated text');
    });
  });

  describe('markdown preservation', () => {
    beforeEach(async () => {
      await translatorManager.checkAvailability();
    });

    it('should preserve bullet points', async () => {
      mockTranslator.translate = vi
        .fn()
        .mockResolvedValueOnce('Punto uno')
        .mockResolvedValueOnce('Punto dos')
        .mockResolvedValueOnce('Punto tres');

      const markdown = '- Point one\n- Point two\n- Point three';
      const result = await translatorManager.translate(markdown, 'es', 'en');

      expect(result).toContain('- Punto uno');
      expect(result).toContain('- Punto dos');
      expect(result).toContain('- Punto tres');
    });

    it('should preserve numbered lists', async () => {
      mockTranslator.translate = vi
        .fn()
        .mockResolvedValueOnce('Primero')
        .mockResolvedValueOnce('Segundo');

      const markdown = '1. First\n2. Second';
      const result = await translatorManager.translate(markdown, 'es', 'en');

      expect(result).toContain('1. Primero');
      expect(result).toContain('2. Segundo');
    });

    it('should preserve headers', async () => {
      mockTranslator.translate = vi.fn().mockResolvedValue('Título');

      const markdown = '## Title';
      const result = await translatorManager.translate(markdown, 'es', 'en');

      expect(result).toContain('## Título');
    });

    it('should handle plain text without markdown', async () => {
      mockTranslator.translate = vi.fn().mockResolvedValue('Texto simple');

      const result = await translatorManager.translate(
        'Simple text',
        'es',
        'en'
      );

      expect(result).toBe('Texto simple');
      expect(mockTranslator.translate).toHaveBeenCalledTimes(1);
    });
  });

  describe('timeout and retry logic', () => {
    beforeEach(async () => {
      await translatorManager.checkAvailability();
    });

    it('should timeout after 5 seconds on first attempt', async () => {
      mockTranslator.translate = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 6000))
        );

      await expect(
        translatorManager.translate('test', 'es', 'en')
      ).rejects.toThrow('Translation failed');
    }, 15000);

    it('should retry with extended timeout on failure', async () => {
      let callCount = 0;
      mockTranslator.translate = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve('Translated');
      });

      const result = await translatorManager.translate('test', 'es', 'en');

      expect(result).toBe('Translated');
      expect(mockTranslator.translate).toHaveBeenCalledTimes(2);
    });
  });

  describe('session management', () => {
    beforeEach(async () => {
      await translatorManager.checkAvailability();
    });

    it('should reuse cached sessions for same language pair', async () => {
      await translatorManager.translate('text 1', 'es', 'en');
      await translatorManager.translate('text 2', 'es', 'en');

      expect((globalThis as any).Translator.create).toHaveBeenCalledTimes(1);
    });

    it('should create separate sessions for different language pairs', async () => {
      await translatorManager.translate('text', 'es', 'en');
      await translatorManager.translate('text', 'fr', 'en');

      expect((globalThis as any).Translator.create).toHaveBeenCalledTimes(2);
    });

    it('should expire sessions after TTL', async () => {
      vi.useFakeTimers();

      await translatorManager.translate('text', 'es', 'en');

      // Advance time by 6 minutes (beyond 5-minute TTL)
      vi.advanceTimersByTime(6 * 60 * 1000);

      await translatorManager.translate('text', 'es', 'en');

      expect((globalThis as any).Translator.create).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should cleanup expired sessions', async () => {
      vi.useFakeTimers();

      await translatorManager.translate('text', 'es', 'en');

      // Advance time by 6 minutes
      vi.advanceTimersByTime(6 * 60 * 1000);

      translatorManager.cleanupSessions();

      // Session should be destroyed
      expect(mockTranslator.destroy).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should destroy all sessions on cleanup', async () => {
      await translatorManager.translate('text', 'es', 'en');
      await translatorManager.translate('text', 'fr', 'en');

      translatorManager.destroy();

      expect(mockTranslator.destroy).toHaveBeenCalled();
    });

    it('should destroy specific session', async () => {
      await translatorManager.translate('text', 'es', 'en');

      translatorManager.destroySession('en', 'es');

      expect(mockTranslator.destroy).toHaveBeenCalled();
    });
  });

  describe('supported languages', () => {
    it('should export supported languages list', () => {
      expect(SUPPORTED_LANGUAGES).toContain('en');
      expect(SUPPORTED_LANGUAGES).toContain('es');
      expect(SUPPORTED_LANGUAGES).toContain('fr');
      expect(SUPPORTED_LANGUAGES).toContain('de');
      expect(SUPPORTED_LANGUAGES).toContain('zh');
      expect(SUPPORTED_LANGUAGES).toContain('ja');
      expect(SUPPORTED_LANGUAGES).toHaveLength(10);
    });
  });

  describe('error handling', () => {
    it('should handle session creation failure', async () => {
      await translatorManager.checkAvailability();
      (globalThis as any).Translator.create = vi.fn().mockResolvedValue(null);

      await expect(
        translatorManager.translate('test', 'es', 'en')
      ).rejects.toThrow('Failed to create translator session');
    });

    it('should handle translation errors', async () => {
      await translatorManager.checkAvailability();
      mockTranslator.translate = vi
        .fn()
        .mockRejectedValue(new Error('Translation error'));

      await expect(
        translatorManager.translate('test', 'es', 'en')
      ).rejects.toThrow('Translation failed');
    });
  });
});
