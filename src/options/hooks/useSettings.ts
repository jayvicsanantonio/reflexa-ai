import { useEffect, useState, useCallback, useRef } from 'react';
import type { Settings } from '../../types';
import { DEFAULT_SETTINGS, TIMING } from '../../constants';
import { devError } from '../../utils/logger';

/**
 * Custom hook for managing settings
 * Handles loading, saving, and auto-save debouncing
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
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
        setLoading(false);
      }
    };

    void loadSettings();
  }, []);

  // Debounced auto-save function
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
    if (
      !confirm(
        'Are you sure you want to reset all settings to their default values?'
      )
    ) {
      return;
    }

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    settings,
    loading,
    showSaveIndicator,
    updateSetting,
    resetSettings,
    setShowSaveIndicator,
  };
}
