/**
 * AIManagerLoader Tests
 * Tests for lazy loading AI managers with caching and concurrent request deduplication
 *
 * Requirements: 6.1, 6.2, 6.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { AIManagerLoader } from './AIManagerLoader';
import type { ManagerType } from './interfaces';

// Mock manager classes
class MockWriterManager {
  type = 'writer';
  checkAvailability = vi.fn();
}

class MockRewriterManager {
  type = 'rewriter';
  checkAvailability = vi.fn();
}

class MockProofreaderManager {
  type = 'proofreader';
  checkAvailability = vi.fn();
}

class MockTranslatorManager {
  type = 'translator';
  checkAvailability = vi.fn();
}

class MockSummarizerManager {
  type = 'summarizer';
  checkAvailability = vi.fn();
}

// Mock the manager modules
vi.mock('../writer', () => ({
  WriterManager: MockWriterManager,
}));

vi.mock('../rewriter', () => ({
  RewriterManager: MockRewriterManager,
}));

vi.mock('../proofreader', () => ({
  ProofreaderManager: MockProofreaderManager,
}));

vi.mock('../translator', () => ({
  TranslatorManager: MockTranslatorManager,
}));

vi.mock('../summarizer', () => ({
  SummarizerManager: MockSummarizerManager,
}));

/**
 * Arbitrary for generating valid manager types
 */
const managerTypeArb = fc.constantFrom<ManagerType>(
  'writer',
  'rewriter',
  'proofreader',
  'translator',
  'summarizer'
);

/**
 * Arbitrary for generating arrays of unique manager types
 */
const uniqueManagerTypesArb = fc.uniqueArray(managerTypeArb, {
  minLength: 1,
  maxLength: 5,
});

describe('AIManagerLoader', () => {
  let loader: AIManagerLoader;

  beforeEach(() => {
    vi.clearAllMocks();
    loader = new AIManagerLoader();
  });

  afterEach(() => {
    loader.clearCache();
  });

  describe('Unit Tests', () => {
    describe('getWriter', () => {
      it('should load and return WriterManager', async () => {
        const writer = await loader.getWriter();
        expect(writer).toBeDefined();
        expect((writer as unknown as { type: string }).type).toBe('writer');
      });

      it('should cache WriterManager instance', async () => {
        const writer1 = await loader.getWriter();
        const writer2 = await loader.getWriter();
        expect(writer1).toBe(writer2);
      });
    });

    describe('getRewriter', () => {
      it('should load and return RewriterManager', async () => {
        const rewriter = await loader.getRewriter();
        expect(rewriter).toBeDefined();
        expect((rewriter as unknown as { type: string }).type).toBe('rewriter');
      });
    });

    describe('getProofreader', () => {
      it('should load and return ProofreaderManager', async () => {
        const proofreader = await loader.getProofreader();
        expect(proofreader).toBeDefined();
        expect((proofreader as unknown as { type: string }).type).toBe(
          'proofreader'
        );
      });
    });

    describe('getTranslator', () => {
      it('should load and return TranslatorManager', async () => {
        const translator = await loader.getTranslator();
        expect(translator).toBeDefined();
        expect((translator as unknown as { type: string }).type).toBe(
          'translator'
        );
      });
    });

    describe('getSummarizer', () => {
      it('should load and return SummarizerManager', async () => {
        const summarizer = await loader.getSummarizer();
        expect(summarizer).toBeDefined();
        expect((summarizer as unknown as { type: string }).type).toBe(
          'summarizer'
        );
      });
    });

    describe('isLoaded', () => {
      it('should return false for unloaded manager', () => {
        expect(loader.isLoaded('writer')).toBe(false);
      });

      it('should return true for loaded manager', async () => {
        await loader.getWriter();
        expect(loader.isLoaded('writer')).toBe(true);
      });
    });

    describe('preload', () => {
      it('should preload specified managers', async () => {
        expect(loader.isLoaded('writer')).toBe(false);
        expect(loader.isLoaded('rewriter')).toBe(false);

        await loader.preload(['writer', 'rewriter']);

        expect(loader.isLoaded('writer')).toBe(true);
        expect(loader.isLoaded('rewriter')).toBe(true);
      });

      it('should handle empty array', async () => {
        await expect(loader.preload([])).resolves.toBeUndefined();
      });
    });

    describe('clearCache', () => {
      it('should clear all cached managers', async () => {
        await loader.getWriter();
        await loader.getRewriter();

        expect(loader.isLoaded('writer')).toBe(true);
        expect(loader.isLoaded('rewriter')).toBe(true);

        loader.clearCache();

        expect(loader.isLoaded('writer')).toBe(false);
        expect(loader.isLoaded('rewriter')).toBe(false);
      });
    });

    describe('concurrent request handling', () => {
      it('should deduplicate concurrent requests for same manager', async () => {
        // Create new loader to ensure clean state
        const freshLoader = new AIManagerLoader();

        // Make concurrent requests
        const [writer1, writer2, writer3] = await Promise.all([
          freshLoader.getWriter(),
          freshLoader.getWriter(),
          freshLoader.getWriter(),
        ]);

        // All should return the same instance (referential equality)
        expect(writer1).toBe(writer2);
        expect(writer2).toBe(writer3);
      });
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * **Feature: next-phase-improvements, Property 16: Manager caching returns same instance**
     * **Validates: Requirements 6.2**
     *
     * For any manager type, subsequent calls to get that manager should return
     * the exact same instance (referential equality).
     */
    it('Property 16: Manager caching returns same instance', async () => {
      await fc.assert(
        fc.asyncProperty(managerTypeArb, async (managerType) => {
          const testLoader = new AIManagerLoader();

          // Get the manager getter function based on type
          const getManager = () => {
            switch (managerType) {
              case 'writer':
                return testLoader.getWriter();
              case 'rewriter':
                return testLoader.getRewriter();
              case 'proofreader':
                return testLoader.getProofreader();
              case 'translator':
                return testLoader.getTranslator();
              case 'summarizer':
                return testLoader.getSummarizer();
            }
          };

          // First call loads the manager
          const firstInstance = await getManager();

          // Second call should return cached instance
          const secondInstance = await getManager();

          // Third call should also return same instance
          const thirdInstance = await getManager();

          // All instances should be referentially equal
          expect(firstInstance).toBe(secondInstance);
          expect(secondInstance).toBe(thirdInstance);

          // Manager should be marked as loaded
          expect(testLoader.isLoaded(managerType)).toBe(true);

          // Cleanup
          testLoader.clearCache();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: next-phase-improvements, Property 17: Concurrent requests share promise**
     * **Validates: Requirements 6.3**
     *
     * For any manager type with multiple simultaneous requests, all requests
     * should receive the same promise, preventing duplicate module loading.
     */
    it('Property 17: Concurrent requests share promise', async () => {
      await fc.assert(
        fc.asyncProperty(
          managerTypeArb,
          fc.integer({ min: 2, max: 10 }),
          async (managerType, concurrentCount) => {
            const testLoader = new AIManagerLoader();

            // Get the manager getter function based on type
            const getManager = () => {
              switch (managerType) {
                case 'writer':
                  return testLoader.getWriter();
                case 'rewriter':
                  return testLoader.getRewriter();
                case 'proofreader':
                  return testLoader.getProofreader();
                case 'translator':
                  return testLoader.getTranslator();
                case 'summarizer':
                  return testLoader.getSummarizer();
              }
            };

            // Make concurrent requests
            const promises = Array.from({ length: concurrentCount }, () =>
              getManager()
            );
            const results = await Promise.all(promises);

            // All results should be the same instance
            const firstResult = results[0];
            for (const result of results) {
              expect(result).toBe(firstResult);
            }

            // Cleanup
            testLoader.clearCache();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Additional property test: Preload loads all specified managers
     */
    it('Preload loads all specified managers', async () => {
      await fc.assert(
        fc.asyncProperty(uniqueManagerTypesArb, async (managerTypes) => {
          const testLoader = new AIManagerLoader();

          // Initially none should be loaded
          for (const type of managerTypes) {
            expect(testLoader.isLoaded(type)).toBe(false);
          }

          // Preload all specified managers
          await testLoader.preload(managerTypes);

          // All should now be loaded
          for (const type of managerTypes) {
            expect(testLoader.isLoaded(type)).toBe(true);
          }

          // Cleanup
          testLoader.clearCache();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Additional property test: clearCache removes all cached instances
     */
    it('clearCache removes all cached instances', async () => {
      await fc.assert(
        fc.asyncProperty(uniqueManagerTypesArb, async (managerTypes) => {
          const testLoader = new AIManagerLoader();

          // Preload managers
          await testLoader.preload(managerTypes);

          // Verify all are loaded
          for (const type of managerTypes) {
            expect(testLoader.isLoaded(type)).toBe(true);
          }

          // Clear cache
          testLoader.clearCache();

          // None should be loaded anymore
          for (const type of managerTypes) {
            expect(testLoader.isLoaded(type)).toBe(false);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
