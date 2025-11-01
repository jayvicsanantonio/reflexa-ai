/**
 * Unit tests for PromptManager
 * Tests capability detection, prompting, fallback methods, and streaming
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PromptManager } from './promptManager';
import type { AILanguageModel } from '../../../types/chrome-ai';
import type { WriterOptions, TonePreset } from '../../../types';

describe('PromptManager', () => {
  let manager: PromptManager;
  let mockLanguageModel: AILanguageModel;

  beforeEach(() => {
    manager = new PromptManager();

    // Mock language model session
    mockLanguageModel = {
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
    };

    // Set up global LanguageModel
    (globalThis as any).LanguageModel = {
      create: vi.fn().mockResolvedValue(mockLanguageModel),
      availability: vi.fn().mockResolvedValue('available'),
      capabilities: vi.fn().mockResolvedValue({
        available: 'readily',
        defaultTopK: 40,
        maxTopK: 128,
        defaultTemperature: 0.7,
      }),
    };
  });

  afterEach(() => {
    manager.destroy();
    delete (globalThis as any).LanguageModel;
    vi.clearAllMocks();
  });

  describe('checkAvailability', () => {
    it('should detect when Prompt API is available', async () => {
      const available = await manager.checkAvailability();
      expect(available).toBe(true);
      expect(manager.isAvailable()).toBe(true);
    });

    it('should detect when Prompt API is unavailable', async () => {
      delete (globalThis as any).LanguageModel;
      const available = await manager.checkAvailability();
      expect(available).toBe(false);
      expect(manager.isAvailable()).toBe(false);
    });

    it('should detect downloadable status as available', async () => {
      (globalThis as any).LanguageModel.availability = vi
        .fn()
        .mockResolvedValue('downloadable');
      const available = await manager.checkAvailability();
      expect(available).toBe(true);
    });
  });

  describe('prompt', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should execute basic prompt', async () => {
      const result = await manager.prompt('What is AI?');

      expect(result).toBe('AI generated response');
      expect(mockLanguageModel.prompt).toHaveBeenCalledWith('What is AI?');
    });

    it('should use custom system prompt', async () => {
      await manager.prompt('test', {
        systemPrompt: 'You are a helpful assistant',
      });

      expect((globalThis as any).LanguageModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          systemPrompt: 'You are a helpful assistant',
        })
      );
    });

    it('should use custom temperature', async () => {
      await manager.prompt('test', { temperature: 0.9 });

      expect((globalThis as any).LanguageModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.9,
        })
      );
    });

    it('should use custom topK', async () => {
      await manager.prompt('test', { topK: 50 });

      expect((globalThis as any).LanguageModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          topK: 50,
        })
      );
    });
  });

  describe('summarize fallback', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should summarize in bullets format', async () => {
      mockLanguageModel.prompt = vi
        .fn()
        .mockResolvedValue('- Point 1\n- Point 2\n- Point 3');

      const result = await manager.summarize('Long article text', 'bullets');

      expect(result).toHaveLength(3);
      expect(result).toEqual(['Point 1', 'Point 2', 'Point 3']);
    });

    it('should summarize in paragraph format', async () => {
      mockLanguageModel.prompt = vi
        .fn()
        .mockResolvedValue('This is a summary paragraph.');

      const result = await manager.summarize('Long article text', 'paragraph');

      expect(result).toHaveLength(1);
      expect(result[0]).toBe('This is a summary paragraph.');
    });

    it('should summarize in headline-bullets format', async () => {
      mockLanguageModel.prompt = vi
        .fn()
        .mockResolvedValue('Main Headline\n- Point 1\n- Point 2\n- Point 3');

      const result = await manager.summarize(
        'Long article text',
        'headline-bullets'
      );

      expect(result).toHaveLength(4);
      expect(result[0]).toBe('Main Headline');
      expect(result[1]).toBe('Point 1');
    });

    it('should use factual temperature for summarization', async () => {
      await manager.summarize('text', 'bullets');

      expect((globalThis as any).LanguageModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.3, // Factual temperature
        })
      );
    });
  });

  describe('generateDraft fallback', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should generate draft with calm tone', async () => {
      const options: WriterOptions = { tone: 'calm', length: 'short' };
      const result = await manager.generateDraft('test topic', options);

      expect(result).toBe('AI generated response');
      expect((globalThis as any).LanguageModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          systemPrompt: expect.stringContaining(
            'calm, reflective, and mindful'
          ),
        })
      );
    });

    it('should generate draft with professional tone', async () => {
      const options: WriterOptions = { tone: 'professional', length: 'medium' };
      await manager.generateDraft('test topic', options);

      expect((globalThis as any).LanguageModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          systemPrompt: expect.stringContaining(
            'professional, clear, and formal'
          ),
        })
      );
    });

    it('should include context in draft generation', async () => {
      const options: WriterOptions = { tone: 'calm', length: 'short' };
      const context = 'Background context';

      await manager.generateDraft('topic', options, context);

      expect(mockLanguageModel.prompt).toHaveBeenCalledWith(
        expect.stringContaining(context)
      );
    });

    it('should use creative temperature for draft generation', async () => {
      const options: WriterOptions = { tone: 'calm', length: 'short' };
      await manager.generateDraft('topic', options);

      expect((globalThis as any).LanguageModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.9, // Creative temperature
        })
      );
    });
  });

  describe('rewrite fallback', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    const presets: TonePreset[] = ['calm', 'concise', 'empathetic', 'academic'];

    presets.forEach((preset) => {
      it.skip(`should rewrite with ${preset} preset`, async () => {
        const result = await manager.rewrite('original text', preset);

        expect(result).toBe('AI generated response');
        expect((globalThis as any).LanguageModel.create).toHaveBeenCalledWith(
          expect.objectContaining({
            systemPrompt: expect.stringContaining(preset),
          })
        );
      });
    });

    it('should include context in rewriting', async () => {
      const context = 'Background context';
      await manager.rewrite('text', 'calm', context);

      expect(mockLanguageModel.prompt).toHaveBeenCalledWith(
        expect.stringContaining(context)
      );
    });
  });

  describe('timeout and retry logic', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it.skip('should timeout after 5 seconds on first attempt', async () => {
      mockLanguageModel.prompt = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 6000))
        );

      await expect(manager.prompt('test')).rejects.toThrow(
        'Prompt operation failed'
      );
    }, 10000);

    it('should retry with extended timeout on failure', async () => {
      let callCount = 0;
      mockLanguageModel.prompt = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve('Success');
      });

      const result = await manager.prompt('test');

      expect(result).toBe('Success');
      expect(mockLanguageModel.prompt).toHaveBeenCalledTimes(2);
    });
  });

  describe('session management', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should reuse cached sessions for same configuration', async () => {
      await manager.prompt('prompt 1', {
        systemPrompt: 'test',
        temperature: 0.7,
      });
      await manager.prompt('prompt 2', {
        systemPrompt: 'test',
        temperature: 0.7,
      });

      expect((globalThis as any).LanguageModel.create).toHaveBeenCalledTimes(1);
    });

    it('should create separate sessions for different configurations', async () => {
      await manager.prompt('prompt', { systemPrompt: 'test1' });
      await manager.prompt('prompt', { systemPrompt: 'test2' });

      expect((globalThis as any).LanguageModel.create).toHaveBeenCalledTimes(2);
    });

    it('should destroy all sessions on cleanup', async () => {
      await manager.prompt('test 1');
      await manager.prompt('test 2', { systemPrompt: 'different' });

      manager.destroy();

      expect(mockLanguageModel.destroy).toHaveBeenCalled();
    });

    it('should destroy specific session', async () => {
      await manager.prompt('test', { systemPrompt: 'test' });

      manager.destroySession('test-0.7');

      expect(mockLanguageModel.destroy).toHaveBeenCalled();
    });
  });

  describe('streaming support', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should stream prompt response', async () => {
      const chunks: string[] = [];
      const onChunk = (chunk: string) => chunks.push(chunk);

      const result = await manager.promptStreaming('test', undefined, onChunk);

      expect(result).toBe('AI response');
      expect(chunks).toEqual(['AI ', 'response']);
    });

    it('should call onChunk for each chunk', async () => {
      const onChunk = vi.fn();

      await manager.promptStreaming('test', undefined, onChunk);

      expect(onChunk).toHaveBeenCalledTimes(2);
      expect(onChunk).toHaveBeenCalledWith('AI ');
      expect(onChunk).toHaveBeenCalledWith('response');
    });

    it('should handle streaming errors', async () => {
      mockLanguageModel.promptStreaming = vi.fn().mockReturnValue({
        getReader: () => ({
          read: vi.fn().mockRejectedValue(new Error('Stream error')),
          releaseLock: vi.fn(),
        }),
      });

      await expect(
        manager.promptStreaming('test', undefined, () => {})
      ).rejects.toThrow('Streaming prompt failed');
    });
  });

  describe('advanced methods', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should get model capabilities', async () => {
      const capabilities = await manager.getCapabilities();

      expect(capabilities).toEqual({
        available: 'readily',
        defaultTopK: 40,
        maxTopK: 128,
        defaultTemperature: 0.7,
      });
    });

    it('should count tokens', async () => {
      await manager.prompt('test'); // Create a session first

      const count = await manager.countTokens('test prompt');

      expect(count).toBe(10);
      expect(mockLanguageModel.countPromptTokens).toHaveBeenCalledWith(
        'test prompt'
      );
    });

    it('should clone session', async () => {
      await manager.prompt('test', { systemPrompt: 'test' });

      const cloned = await manager.cloneSession('test-0.7');

      expect(cloned).toBeDefined();
      expect(mockLanguageModel.clone).toHaveBeenCalled();
    });

    it('should handle clone of non-existent session', async () => {
      const cloned = await manager.cloneSession('non-existent');

      expect(cloned).toBeNull();
    });
  });

  describe('backward compatibility methods', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should generate reflection prompts', async () => {
      mockLanguageModel.prompt = vi
        .fn()
        .mockResolvedValue(
          '1. What insights resonate?\n2. How to apply?\n3. What questions arise?'
        );

      const summary = ['Point 1', 'Point 2', 'Point 3'];
      const prompts = await manager.generateReflectionPrompts(summary);

      expect(prompts).toHaveLength(3);
      expect(prompts[0]).toContain('insights');
    });

    it('should provide default prompts if parsing fails', async () => {
      mockLanguageModel.prompt = vi.fn().mockResolvedValue('');

      const prompts = await manager.generateReflectionPrompts(['test']);

      expect(prompts).toHaveLength(3);
      expect(prompts[0]).toContain('insights');
    });

    it('should proofread text', async () => {
      mockLanguageModel.prompt = vi
        .fn()
        .mockResolvedValue('This is corrected text.');

      const result = await manager.proofread('This are wrong.');

      expect(result).toBe('This is corrected text.');
      expect((globalThis as any).LanguageModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.3, // Factual temperature for proofreading
        })
      );
    });
  });

  describe('error handling', () => {
    it('should throw error when API is unavailable', async () => {
      delete (globalThis as any).LanguageModel;
      await manager.checkAvailability();

      await expect(manager.prompt('test')).rejects.toThrow(
        'Prompt API is not available'
      );
    });

    it('should handle session creation failure', async () => {
      await manager.checkAvailability();
      (globalThis as any).LanguageModel.create = vi
        .fn()
        .mockResolvedValue(null);

      await expect(manager.prompt('test')).rejects.toThrow(
        'Failed to create prompt session'
      );
    });

    it('should handle prompt errors', async () => {
      await manager.checkAvailability();
      mockLanguageModel.prompt = vi
        .fn()
        .mockRejectedValue(new Error('Prompt error'));

      await expect(manager.prompt('test')).rejects.toThrow(
        'Prompt operation failed'
      );
    });
  });

  describe('response parsing', () => {
    beforeEach(async () => {
      await manager.checkAvailability();
    });

    it('should parse bullets without markers', async () => {
      mockLanguageModel.prompt = vi
        .fn()
        .mockResolvedValue('Point 1\nPoint 2\nPoint 3');

      const result = await manager.summarize('text', 'bullets');

      expect(result).toEqual(['Point 1', 'Point 2', 'Point 3']);
    });

    it('should handle asterisk bullets', async () => {
      mockLanguageModel.prompt = vi
        .fn()
        .mockResolvedValue('* Point 1\n* Point 2\n* Point 3');

      const result = await manager.summarize('text', 'bullets');

      expect(result).toEqual(['Point 1', 'Point 2', 'Point 3']);
    });

    it('should filter empty lines', async () => {
      mockLanguageModel.prompt = vi
        .fn()
        .mockResolvedValue('- Point 1\n\n- Point 2\n\n- Point 3');

      const result = await manager.summarize('text', 'bullets');

      expect(result).toHaveLength(3);
      expect(result).not.toContain('');
    });
  });
});
