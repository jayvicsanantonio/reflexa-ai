/**
 * Unit tests for StorageManager
 * Tests storage CRUD operations, export formats, and streak calculation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageManager } from './storageManager';
import type { Reflection } from '../types';

describe('StorageManager', () => {
  let storageManager: StorageManager;
  let mockStorage: Map<string, any>;

  beforeEach(() => {
    storageManager = new StorageManager();
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

    vi.spyOn(chrome.storage.local, 'getBytesInUse').mockResolvedValue(1000);
  });

  describe('saveReflection', () => {
    it('should save a new reflection', async () => {
      const reflection: Reflection = {
        id: 'test-id',
        url: 'https://example.com',
        title: 'Test Article',
        createdAt: Date.now(),
        summary: ['Insight', 'Surprise', 'Apply'],
        reflection: ['Answer 1', 'Answer 2'],
      };

      await storageManager.saveReflection(reflection);

      const reflections = await storageManager.getReflections();
      expect(reflections).toHaveLength(1);
      expect(reflections[0]).toEqual(reflection);
    });

    it('should generate ID if not provided', async () => {
      const reflection: Reflection = {
        id: '',
        url: 'https://example.com',
        title: 'Test',
        createdAt: Date.now(),
        summary: [],
        reflection: [],
      };

      await storageManager.saveReflection(reflection);

      const reflections = await storageManager.getReflections();
      expect(reflections[0].id).toBeTruthy();
      expect(reflections[0].id).not.toBe('');
    });

    it('should update streak when saving reflection', async () => {
      const reflection: Reflection = {
        id: 'test-id',
        url: 'https://example.com',
        title: 'Test',
        createdAt: Date.now(),
        summary: [],
        reflection: [],
      };

      await storageManager.saveReflection(reflection);

      const streak = await storageManager.getStreak();
      expect(streak.current).toBeGreaterThan(0);
    });
  });

  describe('getReflections', () => {
    it('should return empty array when no reflections exist', async () => {
      const reflections = await storageManager.getReflections();
      expect(reflections).toEqual([]);
    });

    it('should return reflections sorted by date (most recent first)', async () => {
      const reflection1: Reflection = {
        id: '1',
        url: 'https://example.com/1',
        title: 'First',
        createdAt: Date.now() - 10000,
        summary: [],
        reflection: [],
      };

      const reflection2: Reflection = {
        id: '2',
        url: 'https://example.com/2',
        title: 'Second',
        createdAt: Date.now(),
        summary: [],
        reflection: [],
      };

      await storageManager.saveReflection(reflection1);
      await storageManager.saveReflection(reflection2);

      const reflections = await storageManager.getReflections();
      expect(reflections[0].id).toBe('2'); // Most recent first
      expect(reflections[1].id).toBe('1');
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 5; i++) {
        await storageManager.saveReflection({
          id: `id-${i}`,
          url: 'https://example.com',
          title: `Test ${i}`,
          createdAt: Date.now() + i,
          summary: [],
          reflection: [],
        });
      }

      const reflections = await storageManager.getReflections(3);
      expect(reflections).toHaveLength(3);
    });
  });

  describe('getReflectionById', () => {
    it('should return reflection by ID', async () => {
      const reflection: Reflection = {
        id: 'test-id',
        url: 'https://example.com',
        title: 'Test',
        createdAt: Date.now(),
        summary: [],
        reflection: [],
      };

      await storageManager.saveReflection(reflection);

      const found = await storageManager.getReflectionById('test-id');
      expect(found).toEqual(reflection);
    });

    it('should return null if reflection not found', async () => {
      const found = await storageManager.getReflectionById('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('deleteReflection', () => {
    it('should delete reflection by ID', async () => {
      const reflection: Reflection = {
        id: 'test-id',
        url: 'https://example.com',
        title: 'Test',
        createdAt: Date.now(),
        summary: [],
        reflection: [],
      };

      await storageManager.saveReflection(reflection);
      await storageManager.deleteReflection('test-id');

      const reflections = await storageManager.getReflections();
      expect(reflections).toHaveLength(0);
    });

    it('should recalculate streak after deletion', async () => {
      const today = Date.now();
      const yesterday = today - 24 * 60 * 60 * 1000;

      await storageManager.saveReflection({
        id: '1',
        url: 'https://example.com',
        title: 'Today',
        createdAt: today,
        summary: [],
        reflection: [],
      });

      await storageManager.saveReflection({
        id: '2',
        url: 'https://example.com',
        title: 'Yesterday',
        createdAt: yesterday,
        summary: [],
        reflection: [],
      });

      await storageManager.deleteReflection('1');

      const streak = await storageManager.getStreak();
      // Yesterday still counts as valid for streak
      expect(streak.current).toBe(1);
    });
  });

  describe('exportJSON', () => {
    it('should export reflections as JSON', async () => {
      const reflection: Reflection = {
        id: 'test-id',
        url: 'https://example.com',
        title: 'Test Article',
        createdAt: Date.now(),
        summary: ['Insight', 'Surprise', 'Apply'],
        reflection: ['Answer 1', 'Answer 2'],
      };

      await storageManager.saveReflection(reflection);

      const json = await storageManager.exportJSON();
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0]).toEqual(reflection);
    });
  });

  describe('exportMarkdown', () => {
    it('should export reflections as Markdown', async () => {
      const reflection: Reflection = {
        id: 'test-id',
        url: 'https://example.com',
        title: 'Test Article',
        createdAt: Date.now(),
        summary: ['Insight text', 'Surprise text', 'Apply text'],
        reflection: ['Answer 1', 'Answer 2'],
      };

      await storageManager.saveReflection(reflection);

      const markdown = await storageManager.exportMarkdown();

      expect(markdown).toContain('# Reflexa AI');
      expect(markdown).toContain('## Test Article');
      expect(markdown).toContain('**URL:** https://example.com');
      expect(markdown).toContain('### Summary');
      expect(markdown).toContain('**Insight:** Insight text');
      expect(markdown).toContain('**Surprise:** Surprise text');
      expect(markdown).toContain('**Apply:** Apply text');
      expect(markdown).toContain('### Reflections');
      expect(markdown).toContain('1. Answer 1');
      expect(markdown).toContain('2. Answer 2');
    });

    it('should include proofread version if present', async () => {
      const reflection: Reflection = {
        id: 'test-id',
        url: 'https://example.com',
        title: 'Test',
        createdAt: Date.now(),
        summary: [],
        reflection: ['Original text'],
        proofreadVersion: 'Proofread text',
      };

      await storageManager.saveReflection(reflection);

      const markdown = await storageManager.exportMarkdown();
      expect(markdown).toContain('### Proofread Version');
      expect(markdown).toContain('Proofread text');
    });
  });

  describe('getStreak', () => {
    it('should return default streak when no reflections exist', async () => {
      const streak = await storageManager.getStreak();
      expect(streak.current).toBe(0);
      expect(streak.lastReflectionDate).toBe('');
    });
  });

  describe('checkStorageQuota', () => {
    it('should return storage usage information', async () => {
      const quota = await storageManager.checkStorageQuota();
      expect(quota.bytesUsed).toBeGreaterThanOrEqual(0);
      expect(quota.quota).toBeGreaterThan(0);
    });
  });

  describe('isStorageNearLimit', () => {
    it('should return false when storage is not near limit', async () => {
      vi.spyOn(chrome.storage.local, 'getBytesInUse').mockResolvedValue(1000);
      const nearLimit = await storageManager.isStorageNearLimit();
      expect(nearLimit).toBe(false);
    });

    it('should return true when storage is near limit', async () => {
      const quota = chrome.storage.local.QUOTA_BYTES;
      vi.spyOn(chrome.storage.local, 'getBytesInUse').mockResolvedValue(
        quota * 0.95
      );
      const nearLimit = await storageManager.isStorageNearLimit();
      expect(nearLimit).toBe(true);
    });
  });

  describe('clearAllReflections', () => {
    it('should clear all reflections and reset streak', async () => {
      await storageManager.saveReflection({
        id: 'test-id',
        url: 'https://example.com',
        title: 'Test',
        createdAt: Date.now(),
        summary: [],
        reflection: [],
      });

      await storageManager.clearAllReflections();

      const reflections = await storageManager.getReflections();
      const streak = await storageManager.getStreak();

      expect(reflections).toHaveLength(0);
      expect(streak.current).toBe(0);
    });
  });
});
