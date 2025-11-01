/**
 * Unit tests for LanguageDetectorManager
 * Tests capability detection, language detection, caching, and language name mapping
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { languageDetectorManager } from './languageDetectorManager';
import type {
  AILanguageDetector,
  AILanguageDetectorFactory,
} from '../../../types/chrome-ai';

describe('LanguageDetectorManager', () => {
  let mockDetector: AILanguageDetector;
  let mockDetectorFactory: AILanguageDetectorFactory;

  beforeEach(() => {
    // Mock language detector instance
    mockDetector = {
      detect: vi.fn().mockResolvedValue([
        { detectedLanguage: 'en', confidence: 0.95 },
        { detectedLanguage: 'es', confidence: 0.05 },
      ]),
      destroy: vi.fn(),
    };

    // Mock language detector factory
    mockDetectorFactory = {
      create: vi.fn().mockResolvedValue(mockDetector),
      availability: vi.fn().mockResolvedValue('available'),
    };

    // Set up global LanguageDetector
    (globalThis as any).LanguageDetector = mockDetectorFactory;

    // Clear cache before each test
    languageDetectorManager.clearCache();
  });

  afterEach(() => {
    languageDetectorManager.destroy();
    delete (globalThis as any).LanguageDetector;
    vi.clearAllMocks();
  });

  describe('checkAvailability', () => {
    it('should detect when Language Detector API is available', async () => {
      const available = await languageDetectorManager.checkAvailability();
      expect(available).toBe(true);
      expect(languageDetectorManager.isAvailable()).toBe(true);
    });

    it('should detect when Language Detector API is unavailable', async () => {
      delete (globalThis as any).LanguageDetector;
      const available = await languageDetectorManager.checkAvailability();
      expect(available).toBe(false);
      expect(languageDetectorManager.isAvailable()).toBe(false);
    });

    it('should detect downloadable status as available', async () => {
      mockDetectorFactory.availability = vi
        .fn()
        .mockResolvedValue('downloadable');
      const available = await languageDetectorManager.checkAvailability();
      expect(available).toBe(true);
    });

    it('should handle availability check errors', async () => {
      mockDetectorFactory.availability = vi
        .fn()
        .mockRejectedValue(new Error('Check failed'));
      const available = await languageDetectorManager.checkAvailability();
      expect(available).toBe(false);
    });
  });

  describe('detect', () => {
    beforeEach(async () => {
      await languageDetectorManager.checkAvailability();
    });

    it('should detect language from text', async () => {
      const text = 'This is an English text sample for language detection.';
      const result = await languageDetectorManager.detect(text);

      expect(result.detectedLanguage).toBe('en');
      expect(result.confidence).toBe(0.95);
      expect(result.languageName).toBe('English');
    });

    it('should use first 500 characters for detection', async () => {
      const longText = 'a'.repeat(1000);
      await languageDetectorManager.detect(longText);

      expect(mockDetector.detect).toHaveBeenCalledWith(longText.slice(0, 500));
    });

    it('should detect Spanish language', async () => {
      mockDetector.detect = vi
        .fn()
        .mockResolvedValue([{ detectedLanguage: 'es', confidence: 0.92 }]);

      const result = await languageDetectorManager.detect('Hola mundo');

      expect(result.detectedLanguage).toBe('es');
      expect(result.languageName).toBe('Spanish');
    });

    it('should detect French language', async () => {
      mockDetector.detect = vi
        .fn()
        .mockResolvedValue([{ detectedLanguage: 'fr', confidence: 0.88 }]);

      const result = await languageDetectorManager.detect('Bonjour le monde');

      expect(result.detectedLanguage).toBe('fr');
      expect(result.languageName).toBe('French');
    });

    it('should select highest confidence result', async () => {
      mockDetector.detect = vi.fn().mockResolvedValue([
        { detectedLanguage: 'en', confidence: 0.45 },
        { detectedLanguage: 'es', confidence: 0.85 },
        { detectedLanguage: 'fr', confidence: 0.3 },
      ]);

      const result = await languageDetectorManager.detect('test');

      expect(result.detectedLanguage).toBe('es');
      expect(result.confidence).toBe(0.85);
    });
  });

  describe('language name mapping', () => {
    beforeEach(async () => {
      await languageDetectorManager.checkAvailability();
    });

    const languageTests = [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'ar', name: 'Arabic' },
      { code: 'ru', name: 'Russian' },
      { code: 'hi', name: 'Hindi' },
    ];

    languageTests.forEach(({ code, name }) => {
      it(`should map ${code} to ${name}`, async () => {
        mockDetector.detect = vi
          .fn()
          .mockResolvedValue([{ detectedLanguage: code, confidence: 0.9 }]);

        const result = await languageDetectorManager.detect('test');

        expect(result.languageName).toBe(name);
      });
    });

    it('should handle unknown language codes', async () => {
      mockDetector.detect = vi
        .fn()
        .mockResolvedValue([{ detectedLanguage: 'xyz', confidence: 0.9 }]);

      const result = await languageDetectorManager.detect('test');

      expect(result.languageName).toBe('XYZ');
    });
  });

  describe('caching', () => {
    beforeEach(async () => {
      await languageDetectorManager.checkAvailability();
    });

    it('should cache detection results by page URL', async () => {
      const pageUrl = 'https://example.com/article';

      await languageDetectorManager.detect('test text', pageUrl);
      await languageDetectorManager.detect('test text', pageUrl);

      // Should only call detect once due to caching
      expect(mockDetector.detect).toHaveBeenCalledTimes(1);
    });

    it('should cache detection results by text hash', async () => {
      const text = 'This is a test text for caching';

      await languageDetectorManager.detect(text);
      await languageDetectorManager.detect(text);

      // Should only call detect once due to caching
      expect(mockDetector.detect).toHaveBeenCalledTimes(1);
    });

    it('should not cache results for different texts', async () => {
      await languageDetectorManager.detect('text 1');
      await languageDetectorManager.detect('text 2');

      expect(mockDetector.detect).toHaveBeenCalledTimes(2);
    });

    it('should expire cache after TTL', async () => {
      vi.useFakeTimers();

      await languageDetectorManager.detect('test', 'https://example.com');

      // Advance time by 6 minutes (beyond 5-minute TTL)
      vi.advanceTimersByTime(6 * 60 * 1000);

      await languageDetectorManager.detect('test', 'https://example.com');

      expect(mockDetector.detect).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should clear all cache', async () => {
      await languageDetectorManager.detect('test 1', 'url1');
      await languageDetectorManager.detect('test 2', 'url2');

      languageDetectorManager.clearCache();

      await languageDetectorManager.detect('test 1', 'url1');

      // Should call detect again after cache clear
      expect(mockDetector.detect).toHaveBeenCalledTimes(3);
    });

    it('should clear cache for specific page', async () => {
      await languageDetectorManager.detect('test', 'url1');
      await languageDetectorManager.detect('test', 'url2');

      languageDetectorManager.clearCacheForPage('url1');

      await languageDetectorManager.detect('test', 'url1');
      await languageDetectorManager.detect('test', 'url2');

      // url1 should be detected again, url2 should use cache
      expect(mockDetector.detect).toHaveBeenCalledTimes(3);
    });

    it('should cleanup expired cache entries', async () => {
      vi.useFakeTimers();

      await languageDetectorManager.detect('test 1', 'url1');

      // Advance time by 6 minutes
      vi.advanceTimersByTime(6 * 60 * 1000);

      await languageDetectorManager.detect('test 2', 'url2');

      languageDetectorManager.cleanupCache();

      // After cleanup, url1 should be removed but url2 should remain
      await languageDetectorManager.detect('test 1', 'url1');
      await languageDetectorManager.detect('test 2', 'url2');

      // url1 detected again (3rd call), url2 uses cache (2nd call)
      expect(mockDetector.detect).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });
  });

  describe('detector instance management', () => {
    beforeEach(async () => {
      await languageDetectorManager.checkAvailability();
    });

    it('should create detector instance on first use', async () => {
      await languageDetectorManager.detect('test');

      expect(mockDetectorFactory.create).toHaveBeenCalledTimes(1);
    });

    it('should reuse detector instance', async () => {
      await languageDetectorManager.detect('test 1');
      await languageDetectorManager.detect('test 2');
      await languageDetectorManager.detect('test 3');

      // Should only create instance once
      expect(mockDetectorFactory.create).toHaveBeenCalledTimes(1);
    });

    it('should destroy detector instance on cleanup', async () => {
      await languageDetectorManager.detect('test');

      languageDetectorManager.destroy();

      expect(mockDetector.destroy).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw error when API is unavailable', async () => {
      delete (globalThis as any).LanguageDetector;
      await languageDetectorManager.checkAvailability();

      await expect(languageDetectorManager.detect('test')).rejects.toThrow(
        'Language Detector API is not available'
      );
    });

    it('should handle detector creation failure', async () => {
      await languageDetectorManager.checkAvailability();
      mockDetectorFactory.create = vi.fn().mockResolvedValue(null);

      await expect(languageDetectorManager.detect('test')).rejects.toThrow(
        'Failed to create language detector'
      );
    });

    it('should handle detection errors', async () => {
      await languageDetectorManager.checkAvailability();
      mockDetector.detect = vi
        .fn()
        .mockRejectedValue(new Error('Detection failed'));

      await expect(languageDetectorManager.detect('test')).rejects.toThrow(
        'Language detection failed'
      );
    });

    it('should handle empty detection results', async () => {
      await languageDetectorManager.checkAvailability();
      mockDetector.detect = vi.fn().mockResolvedValue([]);

      await expect(languageDetectorManager.detect('test')).rejects.toThrow(
        'No language detection results'
      );
    });
  });
});
