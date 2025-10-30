/**
 * API Mock Tests
 * Tests mock responses, API unavailability scenarios, and Prompt API fallback behavior
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PromptManager } from './promptManager';
import { SummarizerManager } from './summarizerManager';
import { WriterManager } from './writerManager';
import { RewriterManager } from './rewriterManager';
import { ProofreaderManager } from './proofreaderManager';
import { TranslatorManager } from './translatorManager';
import { capabilityDetector } from '../capabilities/capabilityDetector';
import {
  setupMockChromeAI,
  cleanupMockChromeAI,
  makeAPIUnavailable,
  createMockLanguageModel,
} from './__mocks__/chromeAI.mock';
import type { WriterOptions } from '../../../types';

describe('API Mock Tests', () => {
  beforeEach(() => {
    cleanupMockChromeAI();
    vi.clearAllMocks();
    capabilityDetector.clearCache(); // Clear capability cache between tests
    setupMockChromeAI();
  });

  afterEach(() => {
    cleanupMockChromeAI();
    capabilityDetector.clearCache();
    vi.clearAllMocks();
  });

  describe('Mock Response Validation', () => {
    it('should return mock bullet point summary from Summarizer API', async () => {
      const manager = new SummarizerManager();
      await manager.checkAvailability();

      const result = await manager.summarize('test text', 'bullets');

      expect(result).toHaveLength(3);
      expect(result[0]).toBe('Point 1');

      manager.destroy();
    });

    it('should return mock draft from Writer API', async () => {
      const manager = new WriterManager();
      await manager.checkAvailability();

      const options: WriterOptions = { tone: 'calm', length: 'short' };
      const result = await manager.generate('test topic', options);

      expect(result).toBe('This is a generated draft about the topic.');

      manager.destroy();
    });

    it('should return mock rewritten text from Rewriter API', async () => {
      const manager = new RewriterManager();
      await manager.checkAvailability();

      const result = await manager.rewrite('original text', 'calm');

      expect(result).toHaveProperty('rewritten');

      manager.destroy();
    });

    it('should return mock proofread result from Proofreader API', async () => {
      const manager = new ProofreaderManager();
      await manager.checkAvailability();

      const result = await manager.proofread('This are wrong.');

      expect(result).toHaveProperty('correctedText');
      expect(result).toHaveProperty('corrections');

      manager.destroy();
    });

    it('should return mock prompt response from Prompt API', async () => {
      const manager = new PromptManager();
      await manager.checkAvailability();

      const result = await manager.prompt('test prompt');

      expect(result).toBe('AI generated response');

      manager.destroy();
    });
  });

  describe('API Unavailability Scenarios', () => {
    it('should detect when Summarizer API is unavailable', async () => {
      // Clean up and setup without Summarizer
      cleanupMockChromeAI();
      setupMockChromeAI();
      makeAPIUnavailable('Summarizer');

      const manager = new SummarizerManager();
      const available = await manager.checkAvailability();

      expect(available).toBe(false);
    });

    it('should detect when Writer API is unavailable', async () => {
      // Clean up and setup without Writer
      cleanupMockChromeAI();
      setupMockChromeAI();
      makeAPIUnavailable('Writer');

      const manager = new WriterManager();
      const available = await manager.checkAvailability();

      expect(available).toBe(false);
    });

    it('should detect when Prompt API is unavailable', async () => {
      // Clean up and setup without Prompt API
      cleanupMockChromeAI();
      setupMockChromeAI();
      makeAPIUnavailable('LanguageModel');

      const manager = new PromptManager();
      const available = await manager.checkAvailability();

      expect(available).toBe(false);
    });
  });

  describe('Prompt API Fallback Behavior', () => {
    describe('Summarizer Fallback (Requirement 8.1)', () => {
      it('should use Prompt API when Summarizer unavailable', async () => {
        // Ensure Prompt API is available but Summarizer is not
        cleanupMockChromeAI();
        setupMockChromeAI();
        makeAPIUnavailable('Summarizer');

        const manager = new PromptManager();
        await manager.checkAvailability();

        const mockLanguageModel = createMockLanguageModel();
        mockLanguageModel.prompt = vi
          .fn()
          .mockResolvedValue(
            '- Fallback point 1\n- Fallback point 2\n- Fallback point 3'
          );

        (globalThis as any).LanguageModel.create = vi
          .fn()
          .mockResolvedValue(mockLanguageModel);

        const result = await manager.summarize('test text', 'bullets');

        expect(result).toHaveLength(3);
        expect(mockLanguageModel.prompt).toHaveBeenCalled();

        manager.destroy();
      });
    });

    describe('Writer Fallback (Requirement 8.2)', () => {
      it('should use Prompt API when Writer unavailable', async () => {
        // Ensure Prompt API is available but Writer is not
        cleanupMockChromeAI();
        setupMockChromeAI();
        makeAPIUnavailable('Writer');

        const manager = new PromptManager();
        await manager.checkAvailability();

        const mockLanguageModel = createMockLanguageModel();
        mockLanguageModel.prompt = vi
          .fn()
          .mockResolvedValue('Fallback generated draft content.');

        (globalThis as any).LanguageModel.create = vi
          .fn()
          .mockResolvedValue(mockLanguageModel);

        const options: WriterOptions = { tone: 'calm', length: 'short' };
        const result = await manager.generateDraft('test topic', options);

        expect(result).toBe('Fallback generated draft content.');

        manager.destroy();
      });
    });

    describe('Rewriter Fallback (Requirement 8.3)', () => {
      it('should use Prompt API when Rewriter unavailable', async () => {
        // Ensure Prompt API is available but Rewriter is not
        cleanupMockChromeAI();
        setupMockChromeAI();
        makeAPIUnavailable('Rewriter');

        const manager = new PromptManager();
        await manager.checkAvailability();

        const mockLanguageModel = createMockLanguageModel();
        mockLanguageModel.prompt = vi
          .fn()
          .mockResolvedValue('Fallback rewritten text.');

        (globalThis as any).LanguageModel.create = vi
          .fn()
          .mockResolvedValue(mockLanguageModel);

        const result = await manager.rewrite('original text', 'calm');

        expect(result).toBe('Fallback rewritten text.');

        manager.destroy();
      });
    });

    describe('Proofreader No Fallback (Requirement 8.4)', () => {
      it('should not provide fallback for Proofreader', async () => {
        cleanupMockChromeAI();
        setupMockChromeAI();
        makeAPIUnavailable('Proofreader');

        const manager = new ProofreaderManager();
        await manager.checkAvailability();

        expect(manager.isAvailable()).toBe(false);
        await expect(manager.proofread('test')).rejects.toThrow();
      });
    });

    describe('Translation No Fallback (Requirement 8.5)', () => {
      it('should not provide fallback for Translator', async () => {
        cleanupMockChromeAI();
        setupMockChromeAI();
        makeAPIUnavailable('Translator');

        const manager = new TranslatorManager();
        await manager.checkAvailability();

        expect(manager.isAvailable()).toBe(false);
        await expect(manager.translate('test', 'en', 'es')).rejects.toThrow();
      });
    });
  });

  describe('Prompt Formatting Verification', () => {
    it('should use factual temperature for summarization', async () => {
      cleanupMockChromeAI();
      setupMockChromeAI();
      makeAPIUnavailable('Summarizer');

      const manager = new PromptManager();
      await manager.checkAvailability();

      await manager.summarize('test', 'bullets');

      const createCall = (globalThis as any).LanguageModel.create.mock
        .calls[0][0];
      expect(createCall.temperature).toBe(0.3);

      manager.destroy();
    });

    it('should use creative temperature for draft generation', async () => {
      cleanupMockChromeAI();
      setupMockChromeAI();
      makeAPIUnavailable('Writer');

      const manager = new PromptManager();
      await manager.checkAvailability();

      const options: WriterOptions = { tone: 'calm', length: 'short' };
      await manager.generateDraft('topic', options);

      const createCall = (globalThis as any).LanguageModel.create.mock
        .calls[0][0];
      expect(createCall.temperature).toBe(0.9);

      manager.destroy();
    });

    it('should include proper system prompt for summarization', async () => {
      cleanupMockChromeAI();
      setupMockChromeAI();
      makeAPIUnavailable('Summarizer');

      const manager = new PromptManager();
      await manager.checkAvailability();

      await manager.summarize('test', 'bullets');

      const createCall = (globalThis as any).LanguageModel.create.mock
        .calls[0][0];
      expect(createCall.systemPrompt).toContain('summarization');

      manager.destroy();
    });
  });
});
