/**
 * SettingsManager - Handles all user settings operations
 */

import type { Settings } from '../types';
import { DEFAULT_SETTINGS, STORAGE_KEYS, TIMING } from '../constants';

export class SettingsManager {
  // Cache for settings to reduce storage reads
  private cache: Settings | null = null;

  /**
   * Get current user settings
   * Uses caching to reduce storage reads
   * @returns Settings object
   */
  async getSettings(): Promise<Settings> {
    // Check cache first
    if (this.cache) {
      return this.cache;
    }

    // Cache miss, fetch from storage
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    const settings = (result[STORAGE_KEYS.SETTINGS] ??
      DEFAULT_SETTINGS) as Settings;

    // Validate and sanitize settings
    const validatedSettings = this.validateSettings(settings);

    // Update cache
    this.cache = validatedSettings;

    return validatedSettings;
  }

  /**
   * Update user settings (partial update supported)
   * @param partial Partial settings object with values to update
   * @returns Updated settings object
   */
  async updateSettings(partial: Partial<Settings>): Promise<Settings> {
    // Get current settings
    const currentSettings = await this.getSettings();

    // Merge with partial update
    const updatedSettings: Settings = {
      ...currentSettings,
      ...partial,
    };

    // Validate merged settings
    const validatedSettings = this.validateSettings(updatedSettings);

    // Save to storage
    await chrome.storage.local.set({
      [STORAGE_KEYS.SETTINGS]: validatedSettings,
    });

    // Update cache
    this.cache = validatedSettings;

    return validatedSettings;
  }

  /**
   * Reset settings to default values
   * @returns Default settings object
   */
  async resetToDefaults(): Promise<Settings> {
    // Save default settings to storage
    await chrome.storage.local.set({
      [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS,
    });

    // Update cache
    this.cache = DEFAULT_SETTINGS;

    return DEFAULT_SETTINGS;
  }

  /**
   * Validate and sanitize settings to ensure values are within acceptable ranges
   * @param settings Settings object to validate
   * @returns Validated settings object
   */
  private validateSettings(settings: Settings): Settings {
    const validated: Settings = { ...settings };

    // Validate dwellThreshold (30-300 seconds)
    if (
      typeof validated.dwellThreshold !== 'number' ||
      validated.dwellThreshold < TIMING.DWELL_MIN ||
      validated.dwellThreshold > TIMING.DWELL_MAX
    ) {
      validated.dwellThreshold = TIMING.DWELL_DEFAULT;
    }

    // Validate enableSound (boolean)
    if (typeof validated.enableSound !== 'boolean') {
      validated.enableSound = DEFAULT_SETTINGS.enableSound;
    }

    // Validate reduceMotion (boolean)
    if (typeof validated.reduceMotion !== 'boolean') {
      validated.reduceMotion = DEFAULT_SETTINGS.reduceMotion;
    }

    // Validate proofreadEnabled (boolean)
    if (typeof validated.proofreadEnabled !== 'boolean') {
      validated.proofreadEnabled = DEFAULT_SETTINGS.proofreadEnabled;
    }

    // Validate privacyMode ('local' or 'sync')
    if (validated.privacyMode !== 'local' && validated.privacyMode !== 'sync') {
      validated.privacyMode = DEFAULT_SETTINGS.privacyMode;
    }

    return validated;
  }

  /**
   * Invalidate the settings cache
   * Call this if settings are modified externally
   */
  invalidateCache(): void {
    this.cache = null;
  }

  /**
   * Check if a specific setting is enabled
   * Convenience method for boolean settings
   * @param key Setting key to check
   * @returns Boolean value of the setting
   */
  async isEnabled(
    key: 'enableSound' | 'reduceMotion' | 'proofreadEnabled'
  ): Promise<boolean> {
    const settings = await this.getSettings();
    return settings[key];
  }

  /**
   * Get dwell threshold value
   * Convenience method for dwell threshold
   * @returns Dwell threshold in seconds
   */
  async getDwellThreshold(): Promise<number> {
    const settings = await this.getSettings();
    return settings.dwellThreshold;
  }

  /**
   * Get privacy mode
   * Convenience method for privacy mode
   * @returns Privacy mode ('local' or 'sync')
   */
  async getPrivacyMode(): Promise<'local' | 'sync'> {
    const settings = await this.getSettings();
    return settings.privacyMode;
  }
}
