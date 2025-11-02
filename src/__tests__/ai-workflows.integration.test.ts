/**
 * Integration tests for Chrome AI APIs workflows
 * Tests complete user journeys with AI features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aiService } from '../background/services/ai/aiService';
import { handleMessage } from '../background/handlers/messageHandlers';
import type {
  Message,
  AIResponse,
  TonePreset,
  SummaryFormat,
  ProofreadResult,
  Settings,
} from '../types';
import { SettingsManager } from '../background/services/storage/settingsManager';
import { StorageManager } from '../background/services/storage/storageManager';

describe('AI Workflows Integration Tests', () => {
  let mockStorage: Map<string, any>;
  let settingsManager: SettingsManager;
  let storageManager: StorageManager;

  beforeEach(async () => {
    mockStorage = new Map();

    // Mock chrome.storage.local
    vi.spyOn(chrome.storage.local, 'get').mockImplementation((keys) => {
      const result: Record<string, any> = {};
      if (typeof keys === 'string') {
        result[keys] = mockStorage.get(keys);
      } else if (Array.isArray(keys)) {
        keys.forEach((key) => {
          result[key] = mockStorage.get(key);
        });
      }
      return Promise.resolve(result);
    });

    vi.spyOn(chrome.storage.local, 'set').mockImplementation((items) => {
      Object.entries(items).forEach(([key, value]) => {
        mockStorage.set(key, value);
      });
      return Promise.resolve();
    });

    vi.spyOn(chrome.storage.local, 'getBytesInUse').mockResolvedValue(
      1000 as never
    );

    settingsManager = new SettingsManager();
    storageManager = new StorageManager();

    // Initialize AI service
    aiService.initialize(false);
    vi.spyOn(aiService.summarizer, 'checkAvailability').mockResolvedValue(true);
    vi.spyOn(aiService.writer, 'checkAvailability').mockResolvedValue(true);
    vi.spyOn(aiService.rewriter, 'checkAvailability').mockResolvedValue(true);
    vi.spyOn(aiService.proofreader, 'checkAvailability').mockResolvedValue(
      true
    );
    const checkAvailSpy = vi.spyOn(
      aiService.languageDetector,
      'checkAvailability'
    );
    checkAvailSpy.mockResolvedValue(true);
    // Set aiAvailable flag via handler
    await handleMessage({ type: 'checkAI' } as Message);
  });

  describe('Complete Multilingual Reflection Flow', () => {
    it('should complete detect → translate → draft → rewrite → proofread workflow', async () => {
      // Step 1: Detect language (direct API call since message handler not implemented)
      vi.spyOn(aiService.languageDetector, 'detect').mockResolvedValue({
        detectedLanguage: 'es',
        confidence: 0.95,
        languageName: 'Spanish',
      });

      const detectedLanguage = await aiService.languageDetector.detect(
        'Hola mundo, este es un texto de prueba.'
      );

      expect(detectedLanguage.detectedLanguage).toBe('es');
      expect(detectedLanguage.confidence).toBeGreaterThan(0.9);

      // Step 2: Translate to English
      const translateMessage: Message = {
        type: 'translate',
        payload: {
          text: 'Hola mundo, este es un texto de prueba.',
          source: 'es',
          target: 'en',
        },
      };

      // Mock translator
      vi.spyOn(aiService.translator, 'canTranslate').mockResolvedValue(true);
      vi.spyOn(aiService.translator, 'translate').mockResolvedValue(
        'Hello world, this is a test text.'
      );

      const translateResponse = (await handleMessage(
        translateMessage,
        {} as chrome.runtime.MessageSender
      )) as AIResponse<string>;

      expect(translateResponse.success).toBe(true);
      if (translateResponse.success) {
        expect(translateResponse.data).toContain('Hello world');
      }

      // Step 3: Generate draft with Writer API
      const writeMessage: Message = {
        type: 'write',
        payload: {
          prompt: 'Write a reflection about learning new languages',
          options: { tone: 'neutral', length: 'short' },
        },
      };

      // Mock writer
      vi.spyOn(aiService.writer, 'checkAvailability').mockResolvedValue(true);
      vi.spyOn(aiService.writer, 'write').mockResolvedValue(
        'Learning new languages opens doors to understanding different cultures and perspectives.'
      );

      const writeResponse = (await handleMessage(
        writeMessage,
        {} as chrome.runtime.MessageSender
      )) as AIResponse<string>;

      expect(writeResponse.success).toBe(true);
      if (writeResponse.success) {
        expect(writeResponse.data.length).toBeGreaterThan(0);
      }

      // Step 4: Rewrite with different tone
      const rewriteMessage: Message = {
        type: 'rewrite',
        payload: {
          text: writeResponse.success ? writeResponse.data : '',
          preset: 'academic' as TonePreset,
        },
      };

      // Mock rewriter
      vi.spyOn(aiService.rewriter, 'checkAvailability').mockResolvedValue(true);
      vi.spyOn(aiService.rewriter, 'rewrite').mockResolvedValue({
        original: writeResponse.success ? writeResponse.data : '',
        rewritten:
          'The acquisition of additional languages facilitates cross-cultural comprehension and broadens intellectual horizons.',
      });

      const rewriteResponse = (await handleMessage(
        rewriteMessage,
        {} as chrome.runtime.MessageSender
      )) as AIResponse<{ original: string; rewritten: string }>;

      expect(rewriteResponse.success).toBe(true);
      if (rewriteResponse.success) {
        expect(rewriteResponse.data.rewritten).not.toBe(
          rewriteResponse.data.original
        );
      }

      // Step 5: Proofread final text
      const proofreadMessage: Message = {
        type: 'proofread',
        payload: {
          text: rewriteResponse.success ? rewriteResponse.data.rewritten : '',
        },
      };

      // Mock proofreader
      vi.spyOn(aiService.proofreader, 'checkAvailability').mockResolvedValue(
        true
      );
      vi.spyOn(aiService.proofreader, 'proofread').mockResolvedValue({
        correctedText:
          'The acquisition of additional languages facilitates cross-cultural comprehension and broadens intellectual horizons.',
        corrections: [],
      });

      const proofreadResponse = (await handleMessage(
        proofreadMessage,
        {} as chrome.runtime.MessageSender
      )) as AIResponse<ProofreadResult>;

      expect(proofreadResponse.success).toBe(true);
      if (proofreadResponse.success) {
        expect(proofreadResponse.data.correctedText).toBeTruthy();
      }

      // Verify all steps completed successfully
      expect(detectedLanguage.detectedLanguage).toBe('es');
      expect(translateResponse.success).toBe(true);
      expect(writeResponse.success).toBe(true);
      expect(rewriteResponse.success).toBe(true);
      expect(proofreadResponse.success).toBe(true);
    });
  });

  describe('Summary Format Switching', () => {
    it('should generate summaries in different formats', async () => {
      const testContent =
        'Integration testing is crucial for verifying that multiple components work together correctly. It helps catch issues that unit tests might miss. Teams should prioritize testing critical user workflows.';

      const formats: SummaryFormat[] = [
        'bullets',
        'paragraph',
        'headline-bullets',
      ];

      // Mock summarizer for different formats
      vi.spyOn(aiService.summarizer, 'checkAvailability').mockResolvedValue(
        true
      );

      for (const format of formats) {
        const message: Message = {
          type: 'summarize',
          payload: { content: testContent, format },
        };

        // Mock different responses based on format
        if (format === 'bullets') {
          vi.spyOn(aiService.prompt, 'summarize').mockResolvedValue([
            'Integration testing verifies component interactions',
            'Catches issues missed by unit tests',
            'Prioritize critical user workflows',
          ]);
        } else if (format === 'paragraph') {
          vi.spyOn(aiService.prompt, 'summarize').mockResolvedValue([
            'Integration testing is essential for ensuring components work together, catching issues that unit tests miss, and teams should focus on critical workflows.',
          ]);
        } else {
          vi.spyOn(aiService.prompt, 'summarize').mockResolvedValue([
            'Testing Component Interactions',
            'Integration testing verifies component interactions',
            'Catches issues missed by unit tests',
            'Prioritize critical user workflows',
          ]);
        }

        const response = (await handleMessage(
          message,
          {} as chrome.runtime.MessageSender
        )) as AIResponse<string[]>;

        expect(response.success).toBe(true);
        if (response.success) {
          if (format === 'bullets') {
            expect(response.data).toHaveLength(3);
          } else if (format === 'paragraph') {
            expect(response.data).toHaveLength(1);
          } else {
            expect(response.data.length).toBeGreaterThan(3);
          }
        }
      }
    });

    it('should persist selected format in settings', async () => {
      const newFormat: SummaryFormat = 'headline-bullets';

      await settingsManager.updateSettings({
        defaultSummaryFormat: newFormat,
      });

      const settings = await settingsManager.getSettings();
      expect(settings.defaultSummaryFormat).toBe(newFormat);

      // Verify persistence across sessions
      const newSettingsManager = new SettingsManager();
      const loadedSettings = await newSettingsManager.getSettings();
      expect(loadedSettings.defaultSummaryFormat).toBe(newFormat);
    });
  });

  describe('Tone Adjustment Workflow', () => {
    it('should rewrite text with different tone presets', async () => {
      const originalText =
        'I think we should consider implementing this feature soon.';
      const tones: TonePreset[] = ['calm', 'concise', 'empathetic', 'academic'];

      vi.spyOn(aiService.rewriter, 'checkAvailability').mockResolvedValue(true);

      for (const tone of tones) {
        const message: Message = {
          type: 'rewrite',
          payload: { text: originalText, preset: tone },
        };

        // Mock different rewrites based on tone
        const rewrittenTexts: Record<TonePreset, string> = {
          calm: 'We might want to thoughtfully consider implementing this feature in the near future.',
          concise: 'Implement this feature soon.',
          empathetic:
            'I understand the importance of this feature and believe we should implement it soon.',
          academic:
            'It is recommended that consideration be given to the implementation of this feature in the near term.',
        };

        vi.spyOn(aiService.rewriter, 'rewrite').mockResolvedValue({
          original: originalText,
          rewritten: rewrittenTexts[tone],
        });

        const response = (await handleMessage(
          message,
          {} as chrome.runtime.MessageSender
        )) as AIResponse<{ original: string; rewritten: string }>;

        expect(response.success).toBe(true);
        if (response.success) {
          expect(response.data.original).toBe(originalText);
          expect(response.data.rewritten).not.toBe(originalText);
          expect(response.data.rewritten).toBe(rewrittenTexts[tone]);
        }
      }
    });

    it('should handle tone selection in UI component', () => {
      const toneOptions: TonePreset[] = [
        'calm',
        'concise',
        'empathetic',
        'academic',
      ];
      let selectedTone: TonePreset | undefined;

      const handleToneSelect = (tone: TonePreset) => {
        selectedTone = tone;
      };

      // Simulate user clicking each tone
      toneOptions.forEach((tone) => {
        handleToneSelect(tone);
        expect(selectedTone).toBe(tone);
      });
    });
  });

  describe('Proofreading with Diff View Acceptance', () => {
    it('should display corrections and allow acceptance', async () => {
      const originalText =
        'This is a sentance with some erors that need fixing.';

      const message: Message = {
        type: 'proofread',
        payload: { text: originalText },
      };

      vi.spyOn(aiService.proofreader, 'checkAvailability').mockResolvedValue(
        true
      );
      vi.spyOn(aiService.proofreader, 'proofread').mockResolvedValue({
        correctedText: 'This is a sentence with some errors that need fixing.',
        corrections: [
          { startIndex: 10, endIndex: 18, original: 'sentance' },
          { startIndex: 29, endIndex: 34, original: 'erors' },
        ],
      });

      const response = (await handleMessage(
        message,
        {} as chrome.runtime.MessageSender
      )) as AIResponse<ProofreadResult>;

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.data.corrections).toHaveLength(2);
        expect(response.data.correctedText).not.toBe(originalText);

        // Simulate user accepting corrections
        const acceptedText = response.data.correctedText;
        expect(acceptedText).toBe(
          'This is a sentence with some errors that need fixing.'
        );

        // Verify corrections are tracked
        expect(response.data.corrections[0].original).toBe('sentance');
        expect(response.data.corrections[1].original).toBe('erors');
      }
    });

    it('should handle no corrections needed', async () => {
      const perfectText = 'This text is already perfect.';

      const message: Message = {
        type: 'proofread',
        payload: { text: perfectText },
      };

      vi.spyOn(aiService.proofreader, 'checkAvailability').mockResolvedValue(
        true
      );
      vi.spyOn(aiService.proofreader, 'proofread').mockResolvedValue({
        correctedText: perfectText,
        corrections: [],
      });

      const response = (await handleMessage(
        message,
        {} as chrome.runtime.MessageSender
      )) as AIResponse<ProofreadResult>;

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.data.corrections).toHaveLength(0);
        expect(response.data.correctedText).toBe(perfectText);
      }
    });
  });

  describe('AI Status Panel Updates', () => {
    it('should check all AI APIs availability', async () => {
      const message: Message = {
        type: 'checkAllAI',
      };

      // Mock all APIs as available
      vi.spyOn(aiService.prompt, 'checkAvailability').mockResolvedValue(true);
      vi.spyOn(aiService.proofreader, 'checkAvailability').mockResolvedValue(
        true
      );
      vi.spyOn(aiService.summarizer, 'checkAvailability').mockResolvedValue(
        true
      );
      vi.spyOn(aiService.writer, 'checkAvailability').mockResolvedValue(true);
      vi.spyOn(aiService.rewriter, 'checkAvailability').mockResolvedValue(true);
      vi.spyOn(
        aiService.languageDetector,
        'checkAvailability'
      ).mockResolvedValue(true);

      const response = (await handleMessage(
        message,
        {} as chrome.runtime.MessageSender
      )) as AIResponse<{
        prompt: boolean;
        proofreader: boolean;
        summarizer: boolean;
        translator: boolean;
        writer: boolean;
        rewriter: boolean;
      }>;

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.data.prompt).toBe(true);
        expect(response.data.proofreader).toBe(true);
        expect(response.data.summarizer).toBe(true);
        expect(response.data.writer).toBe(true);
        expect(response.data.rewriter).toBe(true);
      }
    });

    it('should track usage statistics', async () => {
      // Perform multiple operations
      vi.spyOn(aiService.prompt, 'summarize').mockResolvedValue([
        'Summary point 1',
        'Summary point 2',
        'Summary point 3',
      ]);

      await handleMessage(
        { type: 'summarize', payload: { content: 'Test content' } },
        {} as chrome.runtime.MessageSender
      );

      await handleMessage(
        { type: 'summarize', payload: { content: 'More content' } },
        {} as chrome.runtime.MessageSender
      );

      // Get usage stats
      const statsMessage: Message = {
        type: 'getUsageStats',
      };

      const response = (await handleMessage(
        statsMessage,
        {} as chrome.runtime.MessageSender
      )) as AIResponse<{
        stats: {
          summarizations: number;
          drafts: number;
          rewrites: number;
          proofreads: number;
          translations: number;
          totalOperations: number;
        };
      }>;

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.data.stats.summarizations).toBeGreaterThan(0);
        expect(response.data.stats.totalOperations).toBeGreaterThan(0);
      }
    });

    it('should track performance metrics', async () => {
      vi.spyOn(aiService.prompt, 'summarize').mockResolvedValue(['Summary']);

      await handleMessage(
        { type: 'summarize', payload: { content: 'Test' } },
        {} as chrome.runtime.MessageSender
      );

      const perfMessage: Message = {
        type: 'getPerformanceStats',
      };

      const response = (await handleMessage(
        perfMessage,
        {} as chrome.runtime.MessageSender
      )) as AIResponse<{
        averageResponseTime: number;
        totalOperations: number;
        operationsByType: Record<string, { count: number }>;
      }>;

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.data.averageResponseTime).toBeGreaterThanOrEqual(0);
        expect(response.data.totalOperations).toBeGreaterThan(0);
      }
    });
  });

  describe('Settings Persistence for AI Options', () => {
    it('should persist default summary format', async () => {
      const format: SummaryFormat = 'headline-bullets';

      await settingsManager.updateSettings({
        defaultSummaryFormat: format,
      });

      const settings = await settingsManager.getSettings();
      expect(settings.defaultSummaryFormat).toBe(format);
    });

    it('should persist proofreading toggle', async () => {
      await settingsManager.updateSettings({
        enableProofreading: true,
      });

      let settings = await settingsManager.getSettings();
      expect(settings.enableProofreading).toBe(true);

      await settingsManager.updateSettings({
        enableProofreading: false,
      });

      settings = await settingsManager.getSettings();
      expect(settings.enableProofreading).toBe(false);
    });

    it('should persist translation settings', async () => {
      await settingsManager.updateSettings({
        enableTranslation: true,
        preferredTranslationLanguage: 'es',
        autoDetectLanguage: true,
      });

      const settings = await settingsManager.getSettings();
      expect(settings.enableTranslation).toBe(true);
      expect(settings.preferredTranslationLanguage).toBe('es');
      expect(settings.autoDetectLanguage).toBe(true);
    });

    it('should persist experimental mode toggle', async () => {
      await settingsManager.updateSettings({
        experimentalMode: true,
      });

      let settings = await settingsManager.getSettings();
      expect(settings.experimentalMode).toBe(true);

      // Verify capabilities refresh when experimental mode changes
      aiService.refreshCapabilities(true);
      const capabilities = aiService.getCapabilities();
      expect(capabilities.experimental).toBe(true);

      await settingsManager.updateSettings({
        experimentalMode: false,
      });

      settings = await settingsManager.getSettings();
      expect(settings.experimentalMode).toBe(false);
    });

    it('should load all AI settings on initialization', async () => {
      const aiSettings: Partial<Settings> = {
        defaultSummaryFormat: 'bullets',
        enableProofreading: true,
        enableTranslation: true,
        preferredTranslationLanguage: 'fr',
        experimentalMode: false,
        autoDetectLanguage: true,
      };

      await settingsManager.updateSettings(aiSettings);

      // Simulate new session
      const newSettingsManager = new SettingsManager();
      const loadedSettings = await newSettingsManager.getSettings();

      expect(loadedSettings.defaultSummaryFormat).toBe('bullets');
      expect(loadedSettings.enableProofreading).toBe(true);
      expect(loadedSettings.enableTranslation).toBe(true);
      expect(loadedSettings.preferredTranslationLanguage).toBe('fr');
      expect(loadedSettings.experimentalMode).toBe(false);
      expect(loadedSettings.autoDetectLanguage).toBe(true);
    });
  });

  describe('Translation Availability Checks', () => {
    it('should check if language pair is supported', async () => {
      const message: Message = {
        type: 'canTranslate',
        payload: { source: 'en', target: 'es' },
      };

      vi.spyOn(aiService.translator, 'canTranslate').mockResolvedValue(true);

      const response = (await handleMessage(
        message,
        {} as chrome.runtime.MessageSender
      )) as AIResponse<boolean>;

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.data).toBe(true);
      }
    });

    it('should check multiple target languages at once', async () => {
      const message: Message = {
        type: 'checkTranslationAvailability',
        payload: {
          source: 'en',
          targets: ['es', 'fr', 'de', 'zh'],
        },
      };

      // Mock some languages as available, others not
      vi.spyOn(aiService.translator, 'canTranslate')
        .mockResolvedValueOnce(true) // es
        .mockResolvedValueOnce(true) // fr
        .mockResolvedValueOnce(false) // de
        .mockResolvedValueOnce(false); // zh

      const response = (await handleMessage(
        message,
        {} as chrome.runtime.MessageSender
      )) as AIResponse<{
        source: string;
        available: string[];
        unavailable: string[];
      }>;

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.data.source).toBe('en');
        expect(response.data.available).toContain('es');
        expect(response.data.available).toContain('fr');
        expect(response.data.unavailable).toContain('de');
        expect(response.data.unavailable).toContain('zh');
      }
    });
  });

  describe('End-to-End Reflection with AI Metadata', () => {
    it('should save reflection with complete AI metadata', async () => {
      // Generate summary
      vi.spyOn(aiService.prompt, 'summarize').mockResolvedValue([
        'Key insight from article',
        'Surprising discovery',
        'Practical application',
      ]);

      const summaryResponse = (await handleMessage(
        { type: 'summarize', payload: { content: 'Article content' } },
        {} as chrome.runtime.MessageSender
      )) as AIResponse<string[]>;

      expect(summaryResponse.success).toBe(true);

      // Generate draft
      vi.spyOn(aiService.writer, 'checkAvailability').mockResolvedValue(true);
      vi.spyOn(aiService.writer, 'write').mockResolvedValue(
        'This article provides valuable insights into the topic.'
      );

      const draftResponse = (await handleMessage(
        {
          type: 'write',
          payload: {
            prompt: 'Write reflection',
            options: { tone: 'neutral', length: 'short' },
          },
        },
        {} as chrome.runtime.MessageSender
      )) as AIResponse<string>;

      expect(draftResponse.success).toBe(true);

      // Rewrite with tone
      vi.spyOn(aiService.rewriter, 'checkAvailability').mockResolvedValue(true);
      vi.spyOn(aiService.rewriter, 'rewrite').mockResolvedValue({
        original: draftResponse.success ? draftResponse.data : '',
        rewritten:
          'This scholarly article offers profound insights into the subject matter.',
      });

      const rewriteResponse = (await handleMessage(
        {
          type: 'rewrite',
          payload: {
            text: draftResponse.success ? draftResponse.data : '',
            preset: 'academic',
          },
        },
        {} as chrome.runtime.MessageSender
      )) as AIResponse<{ original: string; rewritten: string }>;

      expect(rewriteResponse.success).toBe(true);

      // Proofread
      vi.spyOn(aiService.proofreader, 'checkAvailability').mockResolvedValue(
        true
      );
      vi.spyOn(aiService.proofreader, 'proofread').mockResolvedValue({
        correctedText: rewriteResponse.success
          ? rewriteResponse.data.rewritten
          : '',
        corrections: [],
      });

      const proofreadResponse = (await handleMessage(
        {
          type: 'proofread',
          payload: {
            text: rewriteResponse.success ? rewriteResponse.data.rewritten : '',
          },
        },
        {} as chrome.runtime.MessageSender
      )) as AIResponse<ProofreadResult>;

      expect(proofreadResponse.success).toBe(true);

      // Save reflection with AI metadata
      const reflection = {
        id: '',
        url: 'https://example.com/article',
        title: 'Test Article',
        createdAt: Date.now(),
        summary: summaryResponse.success ? summaryResponse.data : [],
        reflection: [
          proofreadResponse.success ? proofreadResponse.data.correctedText : '',
        ],
        summaryFormat: 'bullets' as SummaryFormat,
        toneUsed: 'academic' as TonePreset,
        proofreadVersion: proofreadResponse.success
          ? proofreadResponse.data.correctedText
          : undefined,
        aiMetadata: {
          summarizerUsed: false,
          writerUsed: true,
          rewriterUsed: true,
          proofreaderUsed: true,
          translatorUsed: false,
          promptFallback: true,
          processingTime:
            (summaryResponse.duration || 0) +
            (draftResponse.duration || 0) +
            (rewriteResponse.duration || 0) +
            (proofreadResponse.duration || 0),
        },
      };

      await storageManager.saveReflection(reflection);

      const saved = await storageManager.getReflections();
      expect(saved).toHaveLength(1);
      expect(saved[0].aiMetadata?.writerUsed).toBe(true);
      expect(saved[0].aiMetadata?.rewriterUsed).toBe(true);
      expect(saved[0].aiMetadata?.proofreaderUsed).toBe(true);
      expect(saved[0].toneUsed).toBe('academic');
    });
  });

  describe('Error Handling in Workflows', () => {
    it('should handle API unavailability gracefully', async () => {
      vi.spyOn(aiService.writer, 'checkAvailability').mockResolvedValue(false);

      const message: Message = {
        type: 'write',
        payload: { prompt: 'Test', options: {} },
      };

      const response = (await handleMessage(
        message,
        {} as chrome.runtime.MessageSender
      )) as AIResponse<string>;

      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error).toContain('not available');
      }
    });

    it('should handle translation unavailability for language pair', async () => {
      vi.spyOn(aiService.translator, 'canTranslate').mockResolvedValue(false);

      const message: Message = {
        type: 'translate',
        payload: { text: 'Test', source: 'en', target: 'xyz' },
      };

      const response = (await handleMessage(
        message,
        {} as chrome.runtime.MessageSender
      )) as AIResponse<string>;

      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error).toContain('not available');
      }
    });

    it('should handle API errors with user-friendly messages', async () => {
      vi.spyOn(aiService.prompt, 'summarize').mockRejectedValue(
        new Error('API timeout')
      );

      const message: Message = {
        type: 'summarize',
        payload: { content: 'Test content' },
      };

      const response = (await handleMessage(
        message,
        {} as chrome.runtime.MessageSender
      )) as AIResponse<string[]>;

      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error).toBeTruthy();
      }
    });
  });
});
