/**
 * Custom hook for managing settings
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Settings } from '../../types';
import { DEFAULT_SETTINGS, TIMING } from '../../constants';
import { sendMessageTyped } from '../../utils/messageClient';
import { devError } from '../../utils/logger';

/**
 * Hook to manage settings state with automatic save
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await sendMessageTyped<Settings>('getSettings');

        if (response.success && response.data) {
          setSettings(response.data);
        }
      } catch (error) {
        devError('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
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
        const response = await sendMessageTyped('updateSettings', updatedSettings);

        if (response.success) {
          // Show save indicator
          setShowSaveIndicator(true);
          setTimeout(() => setShowSaveIndicator(false), 2000);
        }
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
      const response = await sendMessageTyped<Settings>('resetSettings');

      if (response.success && response.data) {
        setSettings(response.data);
        setShowSaveIndicator(true);
        setTimeout(() => setShowSaveIndicator(false), 2000);
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
    isLoading,
    showSaveIndicator,
    updateSetting,
    resetSettings,
  };
}
