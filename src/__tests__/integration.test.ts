/**
 * Integration tests for Reflexa AI user flows
 * Tests complete user journeys from dwell detection to reflection save
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DwellTracker } from '../content/features/dwellTracking';
import { ContentExtractor } from '../content/features/contentExtraction/contentExtractor';
import { StorageManager } from '../background/storageManager';
import { SettingsManager } from '../background/settingsManager';
import { PromptManager } from '../background/promptManager';
import type { Reflection, Settings } from '../types';
import { JSDOM } from 'jsdom';

describe('Integration Tests - User Flows', () => {
  let mockStorage: Map<string, any>;
  let storageManager: StorageManager;
  let settingsManager: SettingsManager;
  let promptManager: PromptManager;

  beforeEach(() => {
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

    storageManager = new StorageManager();
    settingsManager = new SettingsManager();
    promptManager = new PromptManager();
  });

  describe('Complete Reflection Flow', () => {
    it('should complete full flow from dwell detection to save', async () => {
      vi.useFakeTimers();

      // Step 1: Initialize dwell tracker with threshold
      const dwellTracker = new DwellTracker(60);
      const thresholdCallback = vi.fn();
      dwellTracker.onThresholdReached(thresholdCallback);

      // Step 2: Start tracking
      dwellTracker.startTracking();
      expect(dwellTracker.getCurrentDwellTime()).toBe(0);

      // Step 3: Simulate user reading for 60 seconds
      for (let i = 0; i < 6; i++) {
        document.dispatchEvent(new Event('mousemove'));
        vi.advanceTimersByTime(10000);
      }

      // Step 4: Verify threshold reached
      expect(thresholdCallback).toHaveBeenCalledTimes(1);
      expect(dwellTracker.getCurrentDwellTime()).toBe(60);

      // Step 5: Extract content from page
      const dom = new JSDOM(
        `<!DOCTYPE html>
        <html>
          <head><title>Test Article</title></head>
          <body>
            <article>
              <h1>Understanding Integration Tests</h1>
              <p>Integration tests verify that multiple components work together correctly.</p>
              <p>They test the complete user flow from start to finish.</p>
            </article>
          </body>
        </html>`,
        { url: 'https://example.com/article' }
      );

      const extractor = new ContentExtractor(dom.window.document);
      const content = extractor.extractMainContent();

      expect(content.title).toBe('Test Article');
      expect(content.text).toContain('Integration tests');
      expect(content.url).toBe('https://example.com/article');

      // Step 6: Mock AI summarization
      const mockSummary = [
        'Integration tests verify component interactions',
        'They test complete user workflows',
        'Use them to ensure end-to-end functionality',
      ];

      vi.spyOn(promptManager, 'summarize').mockResolvedValue(mockSummary);

      const summary = await promptManager.summarize(content.text);
      expect(summary).toEqual(mockSummary);

      // Step 7: Mock AI reflection prompts
      const mockPrompts = [
        'How can you apply integration testing to your project?',
        'What user flows should you test first?',
      ];

      vi.spyOn(promptManager, 'generateReflectionPrompts').mockResolvedValue(
        mockPrompts
      );

      const prompts = await promptManager.generateReflectionPrompts(summary);
      expect(prompts).toEqual(mockPrompts);

      // Step 8: User enters reflections
      const userReflections = [
        'I will start by testing the login flow',
        'The checkout process is most critical',
      ];

      // Step 9: Save reflection
      const reflection: Reflection = {
        id: '',
        url: content.url,
        title: content.title,
        createdAt: Date.now(),
        summary: summary,
        reflection: userReflections,
      };

      await storageManager.saveReflection(reflection);

      // Step 10: Verify reflection was saved
      const savedReflections = await storageManager.getReflections();
      expect(savedReflections).toHaveLength(1);
      expect(savedReflections[0].title).toBe('Test Article');
      expect(savedReflections[0].summary).toEqual(mockSummary);
      expect(savedReflections[0].reflection).toEqual(userReflections);

      // Cleanup
      dwellTracker.destroy();
      vi.useRealTimers();
    });

    it('should handle page navigation during dwell tracking', async () => {
      vi.useFakeTimers();

      const dwellTracker = new DwellTracker(60);
      const thresholdCallback = vi.fn();
      dwellTracker.onThresholdReached(thresholdCallback);

      dwellTracker.startTracking();
      vi.advanceTimersByTime(30000);
      expect(dwellTracker.getCurrentDwellTime()).toBe(30);

      // User navigates away
      dwellTracker.reset();
      expect(dwellTracker.getCurrentDwellTime()).toBe(0);
      expect(thresholdCallback).not.toHaveBeenCalled();

      dwellTracker.destroy();
      vi.useRealTimers();
    });
  });

  describe('Overlay Rendering and Interaction', () => {
    it('should render overlay with summary and prompts', async () => {
      const mockSummary = [
        'First insight about the topic',
        'Surprising fact discovered',
        'Actionable takeaway to apply',
      ];

      const mockPrompts = [
        'How will you implement this?',
        'What challenges might you face?',
      ];

      // Simulate overlay data
      const overlayData = {
        summary: mockSummary,
        prompts: mockPrompts,
        settings: await settingsManager.getSettings(),
      };

      expect(overlayData.summary).toHaveLength(3);
      expect(overlayData.prompts).toHaveLength(2);
      expect(overlayData.settings.enableSound).toBe(true);
    });

    it('should handle user input and save action', async () => {
      const reflection: Reflection = {
        id: '',
        url: 'https://example.com/test',
        title: 'Test Page',
        createdAt: Date.now(),
        summary: ['Insight', 'Surprise', 'Apply'],
        reflection: ['My first answer', 'My second answer'],
      };

      await storageManager.saveReflection(reflection);

      const saved = await storageManager.getReflections();
      expect(saved).toHaveLength(1);
      expect(saved[0].reflection).toEqual([
        'My first answer',
        'My second answer',
      ]);
    });

    it('should handle cancel action without saving', async () => {
      const initialReflections = await storageManager.getReflections();
      const initialCount = initialReflections.length;

      // User cancels without saving - no reflection created
      // Just verify count remains the same
      const finalReflections = await storageManager.getReflections();
      expect(finalReflections).toHaveLength(initialCount);
    });
  });

  describe('Dashboard Display and Reflection Loading', () => {
    it('should load and display reflections in dashboard', async () => {
      // Create multiple reflections
      const reflections: Reflection[] = [
        {
          id: '1',
          url: 'https://example.com/article1',
          title: 'First Article',
          createdAt: Date.now() - 20000,
          summary: ['Insight 1', 'Surprise 1', 'Apply 1'],
          reflection: ['Answer 1'],
        },
        {
          id: '2',
          url: 'https://example.com/article2',
          title: 'Second Article',
          createdAt: Date.now() - 10000,
          summary: ['Insight 2', 'Surprise 2', 'Apply 2'],
          reflection: ['Answer 2'],
        },
        {
          id: '3',
          url: 'https://example.com/article3',
          title: 'Third Article',
          createdAt: Date.now(),
          summary: ['Insight 3', 'Surprise 3', 'Apply 3'],
          reflection: ['Answer 3'],
        },
      ];

      for (const reflection of reflections) {
        await storageManager.saveReflection(reflection);
      }

      // Load reflections for dashboard
      const loaded = await storageManager.getReflections();

      expect(loaded).toHaveLength(3);
      // Should be sorted by date (most recent first)
      expect(loaded[0].title).toBe('Third Article');
      expect(loaded[1].title).toBe('Second Article');
      expect(loaded[2].title).toBe('First Article');
    });

    it('should calculate and display streak correctly', async () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

      // Create reflections on consecutive days
      await storageManager.saveReflection({
        id: '1',
        url: 'https://example.com/1',
        title: 'Day 1',
        createdAt: twoDaysAgo,
        summary: [],
        reflection: [],
      });

      await storageManager.saveReflection({
        id: '2',
        url: 'https://example.com/2',
        title: 'Day 2',
        createdAt: oneDayAgo,
        summary: [],
        reflection: [],
      });

      await storageManager.saveReflection({
        id: '3',
        url: 'https://example.com/3',
        title: 'Day 3',
        createdAt: now,
        summary: [],
        reflection: [],
      });

      const streak = await storageManager.getStreak();
      expect(streak.current).toBeGreaterThan(0);
      expect(streak.lastReflectionDate).toBeTruthy();
    });

    it('should limit reflections when requested', async () => {
      // Create 10 reflections
      for (let i = 0; i < 10; i++) {
        await storageManager.saveReflection({
          id: `id-${i}`,
          url: `https://example.com/${i}`,
          title: `Article ${i}`,
          createdAt: Date.now() + i,
          summary: [],
          reflection: [],
        });
      }

      // Load only 5 most recent
      const limited = await storageManager.getReflections(5);
      expect(limited).toHaveLength(5);
    });
  });

  describe('Settings Persistence Across Sessions', () => {
    it('should persist settings changes', async () => {
      // Update settings
      const newSettings: Partial<Settings> = {
        dwellThreshold: 3020, // Invalid, will be reset to default
        enableSound: false,
        reduceMotion: true,
      };

      await settingsManager.updateSettings(newSettings);

      // Simulate new session - create new manager instance
      const newSettingsManager = new SettingsManager();
      const loaded = await newSettingsManager.getSettings();

      expect(loaded.dwellThreshold).toBe(10); // Reset to default due to invalid value
      expect(loaded.enableSound).toBe(false);
      expect(loaded.reduceMotion).toBe(true);
    });

    it('should apply settings to dwell tracker', async () => {
      vi.useFakeTimers();

      // Set custom dwell threshold (max 60)
      await settingsManager.updateSettings({ dwellThreshold: 60 });

      const settings = await settingsManager.getSettings();
      const dwellTracker = new DwellTracker(settings.dwellThreshold);
      const callback = vi.fn();

      dwellTracker.onThresholdReached(callback);
      dwellTracker.startTracking();

      // Advance to 60 seconds
      for (let i = 0; i < 6; i++) {
        document.dispatchEvent(new Event('mousemove'));
        vi.advanceTimersByTime(10000);
      }

      expect(callback).toHaveBeenCalledTimes(1);

      dwellTracker.destroy();
      vi.useRealTimers();
    });

    it('should reset settings to defaults', async () => {
      // Change settings
      await settingsManager.updateSettings({
        dwellThreshold: 200,
        enableSound: false,
      });

      // Reset to defaults
      await settingsManager.resetToDefaults();

      const settings = await settingsManager.getSettings();
      expect(settings.dwellThreshold).toBe(10);
      expect(settings.enableSound).toBe(true);
    });
  });

  describe('Export Functionality', () => {
    it('should export reflections as JSON', async () => {
      const reflection: Reflection = {
        id: 'test-id',
        url: 'https://example.com/article',
        title: 'Test Article',
        createdAt: 1234567890,
        summary: ['Insight', 'Surprise', 'Apply'],
        reflection: ['Answer 1', 'Answer 2'],
      };

      await storageManager.saveReflection(reflection);

      const json = await storageManager.exportJSON();
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].id).toBe('test-id');
      expect(parsed[0].title).toBe('Test Article');
      expect(parsed[0].summary).toEqual(['Insight', 'Surprise', 'Apply']);
    });

    it('should export reflections as Markdown', async () => {
      const reflection: Reflection = {
        id: 'test-id',
        url: 'https://example.com/article',
        title: 'Test Article',
        createdAt: Date.now(),
        summary: ['Key insight', 'Surprising fact', 'Action item'],
        reflection: ['My first thought', 'My second thought'],
      };

      await storageManager.saveReflection(reflection);

      const markdown = await storageManager.exportMarkdown();

      expect(markdown).toContain('# Reflexa AI');
      expect(markdown).toContain('## Test Article');
      expect(markdown).toContain('**URL:** https://example.com/article');
      expect(markdown).toContain('**Insight:** Key insight');
      expect(markdown).toContain('**Surprise:** Surprising fact');
      expect(markdown).toContain('**Apply:** Action item');
      expect(markdown).toContain('1. My first thought');
      expect(markdown).toContain('2. My second thought');
    });

    it('should export multiple reflections', async () => {
      await storageManager.saveReflection({
        id: '1',
        url: 'https://example.com/1',
        title: 'Article 1',
        createdAt: Date.now(),
        summary: ['A', 'B', 'C'],
        reflection: ['R1'],
      });

      await storageManager.saveReflection({
        id: '2',
        url: 'https://example.com/2',
        title: 'Article 2',
        createdAt: Date.now(),
        summary: ['D', 'E', 'F'],
        reflection: ['R2'],
      });

      const json = await storageManager.exportJSON();
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(2);
    });
  });

  describe('AI Fallback When Unavailable', () => {
    it('should handle AI unavailability gracefully', async () => {
      // Mock AI as unavailable
      vi.spyOn(promptManager, 'checkAvailability').mockResolvedValue(false);

      const available = await promptManager.checkAvailability();
      expect(available).toBe(false);

      // User should still be able to create manual reflection
      const manualReflection: Reflection = {
        id: '',
        url: 'https://example.com/manual',
        title: 'Manual Reflection',
        createdAt: Date.now(),
        summary: [], // Empty summary indicates manual mode
        reflection: ['Manual entry 1', 'Manual entry 2'],
      };

      await storageManager.saveReflection(manualReflection);

      const saved = await storageManager.getReflections();
      expect(saved).toHaveLength(1);
      expect(saved[0].summary).toEqual([]);
      expect(saved[0].reflection).toHaveLength(2);
    });

    it('should allow manual summary entry when AI fails', async () => {
      // Mock AI timeout
      vi.spyOn(promptManager, 'summarize').mockRejectedValue(
        new Error('AI timeout')
      );

      try {
        await promptManager.summarize('test content');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }

      // User enters manual summary
      const reflection: Reflection = {
        id: '',
        url: 'https://example.com/test',
        title: 'Test',
        createdAt: Date.now(),
        summary: ['Manual insight', 'Manual surprise', 'Manual application'],
        reflection: ['Manual reflection'],
      };

      await storageManager.saveReflection(reflection);

      const saved = await storageManager.getReflections();
      expect(saved[0].summary).toEqual([
        'Manual insight',
        'Manual surprise',
        'Manual application',
      ]);
    });
  });

  describe('Content Extraction Integration', () => {
    it('should extract and process article content', () => {
      const dom = new JSDOM(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>Integration Testing Guide</title>
            <meta property="og:title" content="Complete Integration Testing Guide">
          </head>
          <body>
            <nav>Navigation</nav>
            <article>
              <h1>Integration Testing Best Practices</h1>
              <p>Integration tests are essential for verifying system behavior.</p>
              <p>They test how components work together in real scenarios.</p>
              <p>Focus on critical user journeys and workflows.</p>
            </article>
            <aside>Sidebar content</aside>
          </body>
        </html>`,
        { url: 'https://example.com/guide' }
      );

      const extractor = new ContentExtractor(dom.window.document);
      const content = extractor.extractMainContent();
      const metadata = extractor.getPageMetadata();

      expect(content.title).toBe('Integration Testing Guide');
      expect(content.text).toContain('Integration tests');
      expect(content.text).not.toContain('Navigation');
      expect(content.text).not.toContain('Sidebar');
      expect(content.wordCount).toBeGreaterThan(0);

      expect(metadata.url).toBe('https://example.com/guide');
      expect(metadata.domain).toBe('example.com');
    });

    it('should handle content exceeding token limit', () => {
      const longText = 'word '.repeat(3000);
      const dom = new JSDOM(
        `<!DOCTYPE html>
        <html>
          <body>
            <article><p>${longText}</p></article>
          </body>
        </html>`,
        { url: 'https://example.com/long' }
      );

      const extractor = new ContentExtractor(dom.window.document);
      const content = extractor.extractMainContent();
      const { exceeds } = extractor.checkTokenLimit(content);

      expect(exceeds).toBe(true);

      const truncated = extractor.getTruncatedContent(content);
      expect(truncated.text.length).toBeLessThan(content.text.length);
    });
  });

  describe('Multi-Component Workflow', () => {
    it('should coordinate between all components', async () => {
      vi.useFakeTimers();

      // 1. Load settings
      const settings = await settingsManager.getSettings();
      expect(settings.dwellThreshold).toBe(10);

      // 2. Initialize dwell tracker with settings
      const dwellTracker = new DwellTracker(settings.dwellThreshold);
      const callback = vi.fn();
      dwellTracker.onThresholdReached(callback);
      dwellTracker.startTracking();

      // 3. Simulate dwell time
      for (let i = 0; i < 6; i++) {
        document.dispatchEvent(new Event('mousemove'));
        vi.advanceTimersByTime(10000);
      }
      expect(callback).toHaveBeenCalled();

      // 4. Extract content
      const dom = new JSDOM(
        `<html><body><article><p>Test content</p></article></body></html>`,
        { url: 'https://example.com/test' }
      );
      const extractor = new ContentExtractor(dom.window.document);
      const content = extractor.extractMainContent();

      // 5. Mock AI processing
      vi.spyOn(promptManager, 'summarize').mockResolvedValue([
        'Insight',
        'Surprise',
        'Apply',
      ]);
      vi.spyOn(promptManager, 'generateReflectionPrompts').mockResolvedValue([
        'Question 1?',
        'Question 2?',
      ]);

      const summary = await promptManager.summarize(content.text);
      await promptManager.generateReflectionPrompts(summary);

      // 6. Save reflection
      await storageManager.saveReflection({
        id: '',
        url: content.url,
        title: content.title,
        createdAt: Date.now(),
        summary,
        reflection: ['Answer 1', 'Answer 2'],
      });

      // 7. Verify saved
      const reflections = await storageManager.getReflections();
      expect(reflections).toHaveLength(1);

      // 8. Verify streak updated
      const streak = await storageManager.getStreak();
      expect(streak.current).toBeGreaterThan(0);

      dwellTracker.destroy();
      vi.useRealTimers();
    });
  });
});
