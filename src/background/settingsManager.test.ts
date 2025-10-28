/**
 * Unit tests for SettingsManager
 * Tests settings validation and defaults
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsManager } from './settingsManager';
import { DEFAULT_SETTINGS } from '../constants';
import type { Settings } from '../types';

describe('SettingsManager', () => {
  let settingsManager: SettingsManager;
  let mockStorage: Map<string, any>;

  beforeEach(() => {
    settingsManager = new SettingsManager();
    mockStorage = new Map();

    // Mock chrome.storage.local
    vi.spyOn(chrome.storage.local, 'get').mockImplementation((keys) => {
      const result: Record<string, any> = {};
      if (typeof keys === 'string') {
        result[keys] = mockStorage.get(keys);
      }
      return Promise.resolve(result);
    });

    vi.spyOn(chrome.storage.local, 'set').mockImplementation((items) => {
      Object.entries(items).forEach(([key, value]) => {
        mockStorage.set(key, value);
      });
      return Promise.resolve();
    });
  });

  describe('getSettings', () => {
    it('should return default settings when none exist', async () => {
      const settings = await settingsManager.getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should return stored settings', async () => {
      const customSettings: Settings = {
        dwellThreshold: 120,
        enableSound: false,
        reduceMotion: true,
        proofreadEnabled: true,
        privacyMode: 'sync',
      };

      mockStorage.set('settings', customSettings);

      const settings = await settingsManager.getSettings();
      expect(settings).toEqual(customSettings);
    });

    it('should validate and fix invalid dwell threshold', async () => {
      const invalidSettings = {
        ...DEFAULT_SETTINGS,
        dwellThreshold: 500, // Exceeds max of 300
      };

      mockStorage.set('settings', invalidSettings);

      const settings = await settingsManager.getSettings();
      expect(settings.dwellThreshold).toBe(DEFAULT_SETTINGS.dwellThreshold);
    });

    it('should validate and fix invalid boolean settings', async () => {
      const invalidSettings = {
        ...DEFAULT_SETTINGS,
        enableSound: 'yes' as any, // Invalid type
      };

      mockStorage.set('settings', invalidSettings);

      const settings = await settingsManager.getSettings();
      expect(settings.enableSound).toBe(DEFAULT_SETTINGS.enableSound);
    });

    it('should validate and fix invalid privacy mode', async () => {
      const invalidSettings = {
        ...DEFAULT_SETTINGS,
        privacyMode: 'cloud' as any, // Invalid value
      };

      mockStorage.set('settings', invalidSettings);

      const settings = await settingsManager.getSettings();
      expect(settings.privacyMode).toBe(DEFAULT_SETTINGS.privacyMode);
    });
  });

  describe('updateSettings', () => {
    it('should update settings with partial values', async () => {
      await settingsManager.updateSettings({
        dwellThreshold: 90,
      });

      const settings = await settingsManager.getSettings();
      expect(settings.dwellThreshold).toBe(90);
      expect(settings.enableSound).toBe(DEFAULT_SETTINGS.enableSound);
    });

    it('should validate updated settings', async () => {
      await settingsManager.updateSettings({
        dwellThreshold: 400, // Exceeds max
      });

      const settings = await settingsManager.getSettings();
      expect(settings.dwellThreshold).toBe(DEFAULT_SETTINGS.dwellThreshold);
    });

    it('should update multiple settings at once', async () => {
      await settingsManager.updateSettings({
        dwellThreshold: 120,
        enableSound: false,
        reduceMotion: true,
      });

      const settings = await settingsManager.getSettings();
      expect(settings.dwellThreshold).toBe(120);
      expect(settings.enableSound).toBe(false);
      expect(settings.reduceMotion).toBe(true);
    });
  });

  describe('resetToDefaults', () => {
    it('should reset all settings to defaults', async () => {
      await settingsManager.updateSettings({
        dwellThreshold: 120,
        enableSound: false,
      });

      await settingsManager.resetToDefaults();

      const settings = await settingsManager.getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('isEnabled', () => {
    it('should return boolean value for enableSound', async () => {
      await settingsManager.updateSettings({ enableSound: false });
      const enabled = await settingsManager.isEnabled('enableSound');
      expect(enabled).toBe(false);
    });

    it('should return boolean value for reduceMotion', async () => {
      await settingsManager.updateSettings({ reduceMotion: true });
      const enabled = await settingsManager.isEnabled('reduceMotion');
      expect(enabled).toBe(true);
    });

    it('should return boolean value for proofreadEnabled', async () => {
      await settingsManager.updateSettings({ proofreadEnabled: true });
      const enabled = await settingsManager.isEnabled('proofreadEnabled');
      expect(enabled).toBe(true);
    });
  });

  describe('getDwellThreshold', () => {
    it('should return dwell threshold value', async () => {
      await settingsManager.updateSettings({ dwellThreshold: 90 });
      const threshold = await settingsManager.getDwellThreshold();
      expect(threshold).toBe(90);
    });
  });

  describe('getPrivacyMode', () => {
    it('should return privacy mode value', async () => {
      await settingsManager.updateSettings({ privacyMode: 'sync' });
      const mode = await settingsManager.getPrivacyMode();
      expect(mode).toBe('sync');
    });
  });

  describe('validation edge cases', () => {
    it('should accept minimum dwell threshold', async () => {
      await settingsManager.updateSettings({ dwellThreshold: 30 });
      const settings = await settingsManager.getSettings();
      expect(settings.dwellThreshold).toBe(30);
    });

    it('should accept maximum dwell threshold', async () => {
      await settingsManager.updateSettings({ dwellThreshold: 300 });
      const settings = await settingsManager.getSettings();
      expect(settings.dwellThreshold).toBe(300);
    });

    it('should reject dwell threshold below minimum', async () => {
      await settingsManager.updateSettings({ dwellThreshold: 20 });
      const settings = await settingsManager.getSettings();
      expect(settings.dwellThreshold).toBe(DEFAULT_SETTINGS.dwellThreshold);
    });

    it('should reject dwell threshold above maximum', async () => {
      await settingsManager.updateSettings({ dwellThreshold: 350 });
      const settings = await settingsManager.getSettings();
      expect(settings.dwellThreshold).toBe(DEFAULT_SETTINGS.dwellThreshold);
    });
  });
});
