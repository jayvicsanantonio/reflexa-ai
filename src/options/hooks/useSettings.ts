import { useState, useEffect, useCallback, useRef } from 'react';
import type { Settings } from '../../types';
import { DEFAULT_SETTINGS, TIMING } from '../../constants';
import { devError } from '../../utils/logger';

export interface UseSettingsResult {
  settings: Settings;
  isLoading: boolean;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => Promise<void>;
  showSaveIndicator: boolean;
}

/**
 * Hook for managing settings with debounced auto-save
 * Handles loading, debounced saving, and reset functionality
 *
 * @returns UseSettingsResult with settings state and actions
 */
export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // NECESSARY: Async initialization to load settings from chrome.runtime on mount
  // Cannot be replaced with useMemo as it requires async message passing
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const response: unknown = await chrome.runtime.sendMessage({
          type: 'getSettings',
        });

        if (
          response &&
          typeof response === 'object' &&
          'success' in response &&
          response.success &&
          'data' in response
        ) {
          setSettings(response.data as Settings);
        }
      } catch (error) {
        devError('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadSettings();
  }, []);

  // NECESSARY: Cleanup effect to clear debounce timeout on unmount
  // Prevents memory leaks and ensures pending saves are cancelled
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Debounced save function
  const debouncedSave = useCallback((updatedSettings: Settings) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await chrome.runtime.sendMessage({
          type: 'updateSettings',
          payload: updatedSettings,
        });

        // Show save indicator
        setShowSaveIndicator(true);
      } catch (error) {
        devError('Failed to save settings:', error);
      }
    }, TIMING.SETTINGS_DEBOUNCE);
  }, []);

  // Update a specific setting
  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      const updatedSettings = { ...settings, [key]: value };
      setSettings(updatedSettings);
      debouncedSave(updatedSettings);
    },
    [settings, debouncedSave]
  );

  // Reset to defaults
  const resetSettings = useCallback(async () => {
    try {
      const response: unknown = await chrome.runtime.sendMessage({
        type: 'resetSettings',
      });

      if (
        response &&
        typeof response === 'object' &&
        'success' in response &&
        response.success &&
        'data' in response
      ) {
        setSettings(response.data as Settings);
        setShowSaveIndicator(true);
      }
    } catch (error) {
      devError('Failed to reset settings:', error);
    }
  }, []);

  return {
    settings,
    isLoading,
    updateSetting,
    resetSettings,
    showSaveIndicator,
  };
}
