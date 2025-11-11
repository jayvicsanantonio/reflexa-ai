/**
 * Unified storage service layer for Chrome Extension storage operations
 * Provides type-safe, consistent storage access across the extension
 */

import type { Reflection, StreakData, Settings } from '../types';
import { STORAGE_KEYS } from '../constants';
import { devError, devLog } from './logger';

/**
 * Storage service for managing extension data
 */
class StorageService {
  /**
   * Get reflections from storage
   */
  async getReflections(): Promise<Reflection[]> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.REFLECTIONS);
      return (result[STORAGE_KEYS.REFLECTIONS] ?? []) as Reflection[];
    } catch (error) {
      devError('Failed to get reflections:', error);
      return [];
    }
  }

  /**
   * Save reflections to storage
   */
  async saveReflections(reflections: Reflection[]): Promise<void> {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.REFLECTIONS]: reflections,
      });
      devLog(`Saved ${reflections.length} reflections`);
    } catch (error) {
      devError('Failed to save reflections:', error);
      throw error;
    }
  }

  /**
   * Get streak data from storage
   */
  async getStreak(): Promise<StreakData | null> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.STREAK);
      return (result[STORAGE_KEYS.STREAK] as StreakData) ?? null;
    } catch (error) {
      devError('Failed to get streak:', error);
      return null;
    }
  }

  /**
   * Save streak data to storage
   */
  async saveStreak(streak: StreakData): Promise<void> {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.STREAK]: streak,
      });
    } catch (error) {
      devError('Failed to save streak:', error);
      throw error;
    }
  }

  /**
   * Get settings from storage
   */
  async getSettings(): Promise<Settings | null> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
      return (result[STORAGE_KEYS.SETTINGS] as Settings) ?? null;
    } catch (error) {
      devError('Failed to get settings:', error);
      return null;
    }
  }

  /**
   * Save settings to storage
   */
  async saveSettings(settings: Settings): Promise<void> {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.SETTINGS]: settings,
      });
    } catch (error) {
      devError('Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Clear all extension data (use with caution)
   */
  async clearAll(): Promise<void> {
    try {
      await chrome.storage.local.clear();
      devLog('Cleared all extension data');
    } catch (error) {
      devError('Failed to clear storage:', error);
      throw error;
    }
  }

  /**
   * Get storage usage information
   */
  async getStorageUsage(): Promise<chrome.storage.StorageAreaSyncBytesInUse> {
    try {
      return await chrome.storage.local.getBytesInUse();
    } catch (error) {
      devError('Failed to get storage usage:', error);
      return 0;
    }
  }
}

export const storageService = new StorageService();
