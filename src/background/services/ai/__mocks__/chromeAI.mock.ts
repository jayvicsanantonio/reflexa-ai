/**
 * Mock implementations for Chrome AI APIs
 * Used for testing fallback behavior and API unavailability scenarios
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */

import { vi } from 'vitest';
import type {
  AILanguageModel,
  AISummarizer,
  AIWriter,
  AIRewriter,
  AIProofreader,
  AILanguageDetector,
  AITranslator,
} from '../../../../types/chrome-ai';

/**
 * Mock Prompt API (LanguageModel)
 */
export const createMockLanguageModel = (): AILanguageModel => ({
  prompt: vi.fn().mockResolvedValue('AI generated response'),
  promptStreaming: vi.fn().mockReturnValue({
    getReader: () => ({
      read: vi
        .fn()
        .mockResolvedValueOnce({ done: false, value: 'AI ' })
        .mockResolvedValueOnce({ done: false, value: 'response' })
        .mockResolvedValueOnce({ done: true, value: undefined }),
      releaseLock: vi.fn(),
    }),
  }),
  countPromptTokens: vi.fn().mockResolvedValue(10),
  clone: vi.fn().mockResolvedValue({} as AILanguageModel),
  destroy: vi.fn(),
  maxTokens: 4096,
  tokensSoFar: 0,
  tokensLeft: 4096,
  topK: 40,
  temperature: 0.7,
});

export const createMockLanguageModelFactory = () => ({
  create: vi.fn().mockResolvedValue(createMockLanguageModel()),
  availability: vi.fn().mockResolvedValue('available'),
  capabilities: vi.fn().mockResolvedValue({
    available: 'readily',
    defaultTopK: 40,
    maxTopK: 128,
    defaultTemperature: 0.7,
  }),
});

/**
 * Mock Summarizer API
 */
export const createMockSummarizer = (): AISummarizer => ({
  summarize: vi.fn().mockResolvedValue('- Point 1\n- Point 2\n- Point 3'),
  summarizeStreaming: vi.fn().mockReturnValue({
    [Symbol.asyncIterator]: async function* () {
      yield '- Point 1\n';
      yield '- Point 2\n';
      yield '- Point 3';
    },
  }),
  destroy: vi.fn(),
});

export const createMockSummarizerFactory = () => ({
  create: vi.fn().mockResolvedValue(createMockSummarizer()),
  availability: vi.fn().mockResolvedValue('available'),
});

/**
 * Mock Writer API
 */
export const createMockWriter = (): AIWriter => ({
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
});

export const createMockWriterFactory = () => ({
  create: vi.fn().mockResolvedValue(createMockWriter()),
  availability: vi.fn().mockResolvedValue('available'),
});

/**
 * Mock Rewriter API
 */
export const createMockRewriter = (): AIRewriter => ({
  rewrite: vi
    .fn()
    .mockResolvedValue('This is the rewritten text with adjusted tone.'),
  rewriteStreaming: vi.fn().mockReturnValue({
    [Symbol.asyncIterator]: function* () {
      yield 'This is ';
      yield 'the rewritten ';
      yield 'text.';
    },
  }),
  destroy: vi.fn(),
});

export const createMockRewriterFactory = () => ({
  create: vi.fn().mockResolvedValue(createMockRewriter()),
  availability: vi.fn().mockResolvedValue('available'),
});

/**
 * Mock Proofreader API
 */
export const createMockProofreader = (): AIProofreader => ({
  proofread: vi.fn().mockResolvedValue({
    correction: 'This is the corrected text.',
    corrections: [
      {
        startIndex: 5,
        endIndex: 7,
        original: 'are',
      },
    ],
  }),
  destroy: vi.fn(),
});

export const createMockProofreaderFactory = () => ({
  create: vi.fn().mockResolvedValue(createMockProofreader()),
  availability: vi.fn().mockResolvedValue('available'),
});

/**
 * Mock Language Detector API
 */
export const createMockLanguageDetector = (): AILanguageDetector => ({
  detect: vi.fn().mockResolvedValue([
    {
      detectedLanguage: 'en',
      confidence: 0.95,
    },
  ]),
  destroy: vi.fn(),
});

export const createMockLanguageDetectorFactory = () => ({
  create: vi.fn().mockResolvedValue(createMockLanguageDetector()),
  availability: vi.fn().mockResolvedValue('available'),
});

/**
 * Mock Translator API
 */
export const createMockTranslator = (): AITranslator => ({
  translate: vi.fn().mockResolvedValue('Translated text'),
  translateStreaming: vi.fn().mockReturnValue({
    [Symbol.asyncIterator]: async function* () {
      yield 'Translated ';
      yield 'text';
    },
  }),
  destroy: vi.fn(),
});

export const createMockTranslatorFactory = () => ({
  create: vi.fn().mockResolvedValue(createMockTranslator()),
  availability: vi.fn().mockResolvedValue('available'),
  canTranslate: vi.fn().mockResolvedValue('readily'),
});

/**
 * Setup all Chrome AI APIs in global scope
 */
export const setupMockChromeAI = () => {
  (globalThis as any).LanguageModel = createMockLanguageModelFactory();
  (globalThis as any).Summarizer = createMockSummarizerFactory();
  (globalThis as any).Writer = createMockWriterFactory();
  (globalThis as any).Rewriter = createMockRewriterFactory();
  (globalThis as any).Proofreader = createMockProofreaderFactory();
  (globalThis as any).LanguageDetector = createMockLanguageDetectorFactory();
  (globalThis as any).Translator = createMockTranslatorFactory();
};

/**
 * Cleanup all Chrome AI APIs from global scope
 */
export const cleanupMockChromeAI = () => {
  delete (globalThis as any).LanguageModel;
  delete (globalThis as any).Summarizer;
  delete (globalThis as any).Writer;
  delete (globalThis as any).Rewriter;
  delete (globalThis as any).Proofreader;
  delete (globalThis as any).LanguageDetector;
  delete (globalThis as any).Translator;
};

/**
 * Make specific API unavailable
 */
export const makeAPIUnavailable = (apiName: string) => {
  delete (globalThis as any)[apiName];
};

/**
 * Make specific API return 'no' availability
 */
export const makeAPINotReady = (apiName: string) => {
  const factory = (globalThis as any)[apiName];
  if (factory?.availability) {
    factory.availability = vi.fn().mockResolvedValue('no');
  }
};
