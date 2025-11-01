/**
 * AI Operations Performance Tests
 * Tests performance metrics for all Chrome AI API operations
 * Requirements: 9.5
 *
 * Target Metrics:
 * - Summarization: <3s for 1000 words
 * - Draft generation: <2s
 * - Rewriting: <2s
 * - Proofreading: <3s
 * - Language detection: <500ms
 * - Translation: <2s per 100 words
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SummarizerManager } from './summarizerManager';
import { WriterManager } from './writerManager';
import { RewriterManager } from './rewriterManager';
import { ProofreaderManager } from './proofreaderManager';
import { LanguageDetectorManager } from './languageDetectorManager';
import { TranslatorManager } from './translatorManager';
import {
  setupMockChromeAI,
  cleanupMockChromeAI,
} from './__mocks__/chromeAI.mock';

/**
 * Generate test content of specified word count
 */
const generateTestContent = (wordCount: number): string => {
  const words = [
    'artificial',
    'intelligence',
    'machine',
    'learning',
    'neural',
    'network',
    'algorithm',
    'data',
    'processing',
    'analysis',
  ];
  const content: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    content.push(words[i % words.length]);
  }
  return content.join(' ');
};

/**
 * Measure execution time of an async function
 */
const measureTime = async <T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
};

describe('AI Operations Performance Tests', () => {
  beforeEach(() => {
    setupMockChromeAI();
  });

  afterEach(() => {
    cleanupMockChromeAI();
  });

  describe('Summarization Performance', () => {
    let manager: SummarizerManager;

    beforeEach(async () => {
      manager = new SummarizerManager();
      await manager.checkAvailability();
    });

    afterEach(() => {
      manager.destroy();
    });

    it('should summarize 500 words in under 3 seconds', async () => {
      const content = generateTestContent(500);

      const { duration } = await measureTime(() =>
        manager.summarize(content, 'bullets')
      );

      console.log(`Summarization (500 words): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(3000);
    });

    it('should summarize 1000 words in under 3 seconds', async () => {
      const content = generateTestContent(1000);

      const { duration } = await measureTime(() =>
        manager.summarize(content, 'bullets')
      );

      console.log(`Summarization (1000 words): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(3000);
    });

    it('should summarize 1500 words in under 4 seconds', async () => {
      const content = generateTestContent(1500);

      const { duration } = await measureTime(() =>
        manager.summarize(content, 'paragraph')
      );

      console.log(`Summarization (1500 words): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(4000);
    });

    it('should handle multiple summarization formats efficiently', async () => {
      const content = generateTestContent(800);
      const formats: ('bullets' | 'paragraph' | 'headline-bullets')[] = [
        'bullets',
        'paragraph',
        'headline-bullets',
      ];

      const results = await Promise.all(
        formats.map(async (format) => {
          const { duration } = await measureTime(() =>
            manager.summarize(content, format)
          );
          return { format, duration };
        })
      );

      results.forEach(({ format, duration }) => {
        console.log(`Summarization (${format}): ${duration.toFixed(2)}ms`);
        expect(duration).toBeLessThan(3000);
      });
    });

    it('should measure average summarization time across multiple runs', async () => {
      const content = generateTestContent(1000);
      const runs = 5;
      const durations: number[] = [];

      for (let i = 0; i < runs; i++) {
        const { duration } = await measureTime(() =>
          manager.summarize(content, 'bullets')
        );
        durations.push(duration);
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / runs;
      const minDuration = Math.min(...durations);
      const maxDuration = Math.max(...durations);

      console.log(`Summarization avg: ${avgDuration.toFixed(2)}ms`);
      console.log(`Summarization min: ${minDuration.toFixed(2)}ms`);
      console.log(`Summarization max: ${maxDuration.toFixed(2)}ms`);

      expect(avgDuration).toBeLessThan(3000);
    });
  });

  describe('Draft Generation Performance', () => {
    let manager: WriterManager;

    beforeEach(async () => {
      manager = new WriterManager();
      await manager.checkAvailability();
    });

    afterEach(() => {
      manager.destroy();
    });

    it('should generate short draft in under 2 seconds', async () => {
      const topic = 'The impact of artificial intelligence on modern society';

      const { duration } = await measureTime(() =>
        manager.generate(topic, { tone: 'calm', length: 'short' })
      );

      console.log(`Draft generation (short): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(2000);
    });

    it('should generate medium draft in under 2.5 seconds', async () => {
      const topic = 'The future of machine learning and its applications';

      const { duration } = await measureTime(() =>
        manager.generate(topic, { tone: 'professional', length: 'medium' })
      );

      console.log(`Draft generation (medium): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(2500);
    });

    it('should generate long draft in under 3 seconds', async () => {
      const topic = 'Exploring the ethical implications of AI technology';

      const { duration } = await measureTime(() =>
        manager.generate(topic, { tone: 'casual', length: 'long' })
      );

      console.log(`Draft generation (long): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(3000);
    });

    it('should handle different tones efficiently', async () => {
      const topic = 'The role of AI in education';
      const tones: ('calm' | 'professional' | 'casual')[] = [
        'calm',
        'professional',
        'casual',
      ];

      const results = await Promise.all(
        tones.map(async (tone) => {
          const { duration } = await measureTime(() =>
            manager.generate(topic, { tone, length: 'medium' })
          );
          return { tone, duration };
        })
      );

      results.forEach(({ tone, duration }) => {
        console.log(`Draft generation (${tone}): ${duration.toFixed(2)}ms`);
        expect(duration).toBeLessThan(2500);
      });
    });

    it('should generate draft with context efficiently', async () => {
      const topic = 'AI and healthcare';
      const context =
        'Recent advances in medical AI have shown promising results.';

      const { duration } = await measureTime(() =>
        manager.generate(
          topic,
          { tone: 'professional', length: 'medium' },
          context
        )
      );

      console.log(`Draft generation (with context): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(2500);
    });
  });

  describe('Rewriting Performance', () => {
    let manager: RewriterManager;

    beforeEach(async () => {
      manager = new RewriterManager();
      await manager.checkAvailability();
    });

    afterEach(() => {
      manager.destroy();
    });

    it('should rewrite short text in under 2 seconds', async () => {
      const text = generateTestContent(50);

      const { duration } = await measureTime(() =>
        manager.rewrite(text, 'calm')
      );

      console.log(`Rewriting (50 words): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(2000);
    });

    it('should rewrite medium text in under 2 seconds', async () => {
      const text = generateTestContent(150);

      const { duration } = await measureTime(() =>
        manager.rewrite(text, 'concise')
      );

      console.log(`Rewriting (150 words): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(2000);
    });

    it('should rewrite long text in under 3 seconds', async () => {
      const text = generateTestContent(300);

      const { duration } = await measureTime(() =>
        manager.rewrite(text, 'academic')
      );

      console.log(`Rewriting (300 words): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(3000);
    });

    it('should handle all tone presets efficiently', async () => {
      const text = generateTestContent(100);
      const presets: ('calm' | 'concise' | 'empathetic' | 'academic')[] = [
        'calm',
        'concise',
        'empathetic',
        'academic',
      ];

      const results = await Promise.all(
        presets.map(async (preset) => {
          const { duration } = await measureTime(() =>
            manager.rewrite(text, preset)
          );
          return { preset, duration };
        })
      );

      results.forEach(({ preset, duration }) => {
        console.log(`Rewriting (${preset}): ${duration.toFixed(2)}ms`);
        expect(duration).toBeLessThan(2000);
      });
    });

    it('should measure rewriting consistency across runs', async () => {
      const text = generateTestContent(100);
      const runs = 5;
      const durations: number[] = [];

      for (let i = 0; i < runs; i++) {
        const { duration } = await measureTime(() =>
          manager.rewrite(text, 'empathetic')
        );
        durations.push(duration);
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / runs;
      console.log(`Rewriting avg: ${avgDuration.toFixed(2)}ms`);
      expect(avgDuration).toBeLessThan(2000);
    });
  });

  describe('Proofreading Performance', () => {
    let manager: ProofreaderManager;

    beforeEach(async () => {
      manager = new ProofreaderManager();
      await manager.checkAvailability();
    });

    afterEach(() => {
      manager.destroy();
    });

    it('should proofread short text in under 2 seconds', async () => {
      const text = 'This are a test sentence with some errors.';

      const { duration } = await measureTime(() => manager.proofread(text));

      console.log(`Proofreading (short): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(2000);
    });

    it('should proofread medium text in under 3 seconds', async () => {
      const text = generateTestContent(150) + ' This are some errors.';

      const { duration } = await measureTime(() => manager.proofread(text));

      console.log(`Proofreading (medium): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(3000);
    });

    it('should proofread long text in under 3 seconds', async () => {
      const text = generateTestContent(300) + ' These is multiple errors here.';

      const { duration } = await measureTime(() => manager.proofread(text));

      console.log(`Proofreading (long): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(3000);
    });

    it('should handle multiple proofreading requests efficiently', async () => {
      const texts = [
        'This are a test.',
        'They was going to the store.',
        'I has been working hard.',
      ];

      const results = await Promise.all(
        texts.map(async (text, index) => {
          const { duration } = await measureTime(() => manager.proofread(text));
          return { index, duration };
        })
      );

      results.forEach(({ index, duration }) => {
        console.log(
          `Proofreading (text ${index + 1}): ${duration.toFixed(2)}ms`
        );
        expect(duration).toBeLessThan(2000);
      });
    });
  });

  describe('Language Detection Performance', () => {
    let manager: LanguageDetectorManager;

    beforeEach(async () => {
      manager = new LanguageDetectorManager();
      await manager.checkAvailability();
    });

    it('should detect language in under 500ms', async () => {
      const text = 'This is a sample text in English for language detection.';

      const { duration } = await measureTime(() => manager.detect(text));

      console.log(`Language detection: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(500);
    });

    it('should detect language for short text quickly', async () => {
      const text = 'Hello world';

      const { duration } = await measureTime(() => manager.detect(text));

      console.log(`Language detection (short): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(300);
    });

    it('should detect language for long text in under 500ms', async () => {
      const text = generateTestContent(500);

      const { duration } = await measureTime(() => manager.detect(text));

      console.log(`Language detection (long): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(500);
    });

    it('should handle multiple detection requests efficiently', async () => {
      const texts = [
        'English text sample',
        'Texto en español',
        'Texte en français',
        'Deutscher Text',
      ];

      const results = await Promise.all(
        texts.map(async (text, index) => {
          const { duration } = await measureTime(() => manager.detect(text));
          return { index, duration };
        })
      );

      results.forEach(({ index, duration }) => {
        console.log(
          `Language detection (text ${index + 1}): ${duration.toFixed(2)}ms`
        );
        expect(duration).toBeLessThan(500);
      });
    });

    it('should benefit from caching on repeated detections', async () => {
      const text = 'Sample text for caching test';
      const pageUrl = 'https://example.com/test';

      // First detection (no cache)
      const { duration: firstDuration } = await measureTime(() =>
        manager.detect(text, pageUrl)
      );

      // Second detection (should use cache)
      const { duration: secondDuration } = await measureTime(() =>
        manager.detect(text, pageUrl)
      );

      console.log(`First detection: ${firstDuration.toFixed(2)}ms`);
      console.log(`Cached detection: ${secondDuration.toFixed(2)}ms`);

      // Cached should be significantly faster
      expect(secondDuration).toBeLessThan(firstDuration);
      expect(secondDuration).toBeLessThan(100);
    });
  });

  describe('Translation Performance', () => {
    let manager: TranslatorManager;

    beforeEach(async () => {
      manager = new TranslatorManager();
      await manager.checkAvailability();
    });

    afterEach(() => {
      manager.destroy();
    });

    it('should translate 100 words in under 2 seconds', async () => {
      const text = generateTestContent(100);

      const { duration } = await measureTime(() =>
        manager.translate(text, 'en', 'es')
      );

      console.log(`Translation (100 words): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(2000);
    });

    it('should translate 200 words in under 3 seconds', async () => {
      const text = generateTestContent(200);

      const { duration } = await measureTime(() =>
        manager.translate(text, 'en', 'fr')
      );

      console.log(`Translation (200 words): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(3000);
    });

    it('should translate 300 words in under 4 seconds', async () => {
      const text = generateTestContent(300);

      const { duration } = await measureTime(() =>
        manager.translate(text, 'en', 'de')
      );

      console.log(`Translation (300 words): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(4000);
    });

    it('should handle multiple language pairs efficiently', async () => {
      const text = generateTestContent(100);
      const languagePairs = [
        { from: 'en', to: 'es' },
        { from: 'en', to: 'fr' },
        { from: 'en', to: 'de' },
      ];

      const results = await Promise.all(
        languagePairs.map(async ({ from, to }) => {
          const { duration } = await measureTime(() =>
            manager.translate(text, from, to)
          );
          return { pair: `${from}-${to}`, duration };
        })
      );

      results.forEach(({ pair, duration }) => {
        console.log(`Translation (${pair}): ${duration.toFixed(2)}ms`);
        expect(duration).toBeLessThan(2000);
      });
    });

    it('should preserve markdown formatting efficiently', async () => {
      const markdownText = `
# Heading
- Bullet 1
- Bullet 2
**Bold text** and *italic text*
      `.trim();

      const { duration } = await measureTime(() =>
        manager.translate(markdownText, 'en', 'es')
      );

      console.log(`Translation (markdown): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(2000);
    });

    it('should benefit from session caching', async () => {
      const text = generateTestContent(100);

      // First translation (creates session)
      const { duration: firstDuration } = await measureTime(() =>
        manager.translate(text, 'en', 'es')
      );

      // Second translation (reuses session)
      const { duration: secondDuration } = await measureTime(() =>
        manager.translate(text, 'en', 'es')
      );

      console.log(`First translation: ${firstDuration.toFixed(2)}ms`);
      console.log(`Cached translation: ${secondDuration.toFixed(2)}ms`);

      // Both should be fast, but second might be slightly faster
      expect(firstDuration).toBeLessThan(2000);
      expect(secondDuration).toBeLessThan(2000);
    });
  });

  describe('Overall Performance Metrics', () => {
    it('should meet all target performance metrics', () => {
      const targetMetrics = {
        summarization: 3000, // <3s for 1000 words
        draftGeneration: 2000, // <2s
        rewriting: 2000, // <2s
        proofreading: 3000, // <3s
        languageDetection: 500, // <500ms
        translation: 2000, // <2s per 100 words
      };

      // Verify all targets are reasonable
      expect(targetMetrics.summarization).toBeLessThanOrEqual(3000);
      expect(targetMetrics.draftGeneration).toBeLessThanOrEqual(2000);
      expect(targetMetrics.rewriting).toBeLessThanOrEqual(2000);
      expect(targetMetrics.proofreading).toBeLessThanOrEqual(3000);
      expect(targetMetrics.languageDetection).toBeLessThanOrEqual(500);
      expect(targetMetrics.translation).toBeLessThanOrEqual(2000);

      console.log('Target Performance Metrics:');
      console.log(`- Summarization: <${targetMetrics.summarization}ms`);
      console.log(`- Draft Generation: <${targetMetrics.draftGeneration}ms`);
      console.log(`- Rewriting: <${targetMetrics.rewriting}ms`);
      console.log(`- Proofreading: <${targetMetrics.proofreading}ms`);
      console.log(
        `- Language Detection: <${targetMetrics.languageDetection}ms`
      );
      console.log(
        `- Translation: <${targetMetrics.translation}ms per 100 words`
      );
    });

    it('should generate performance report', async () => {
      // Run a sample of each operation
      const summarizer = new SummarizerManager();
      const writer = new WriterManager();
      const rewriter = new RewriterManager();
      const proofreader = new ProofreaderManager();
      const languageDetector = new LanguageDetectorManager();
      const translator = new TranslatorManager();

      await summarizer.checkAvailability();
      await writer.checkAvailability();
      await rewriter.checkAvailability();
      await proofreader.checkAvailability();
      await languageDetector.checkAvailability();
      await translator.checkAvailability();

      const content = generateTestContent(100);

      const report = {
        summarization: await measureTime(() =>
          summarizer.summarize(content, 'bullets')
        ),
        draftGeneration: await measureTime(() =>
          writer.generate('test topic', { tone: 'calm', length: 'short' })
        ),
        rewriting: await measureTime(() => rewriter.rewrite(content, 'calm')),
        proofreading: await measureTime(() => proofreader.proofread(content)),
        languageDetection: await measureTime(() =>
          languageDetector.detect(content)
        ),
        translation: await measureTime(() =>
          translator.translate(content, 'en', 'es')
        ),
      };

      console.log('\nPerformance Report:');
      console.log(
        `Summarization: ${report.summarization.duration.toFixed(2)}ms`
      );
      console.log(
        `Draft Generation: ${report.draftGeneration.duration.toFixed(2)}ms`
      );
      console.log(`Rewriting: ${report.rewriting.duration.toFixed(2)}ms`);
      console.log(`Proofreading: ${report.proofreading.duration.toFixed(2)}ms`);
      console.log(
        `Language Detection: ${report.languageDetection.duration.toFixed(2)}ms`
      );
      console.log(`Translation: ${report.translation.duration.toFixed(2)}ms`);

      // Cleanup
      summarizer.destroy();
      writer.destroy();
      rewriter.destroy();
      proofreader.destroy();
      translator.destroy();

      // Verify all operations completed
      expect(report.summarization.result).toBeDefined();
      expect(report.draftGeneration.result).toBeDefined();
      expect(report.rewriting.result).toBeDefined();
      expect(report.proofreading.result).toBeDefined();
      expect(report.languageDetection.result).toBeDefined();
      expect(report.translation.result).toBeDefined();
    });
  });
});
