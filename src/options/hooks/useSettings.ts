/**
 * Custom hook for managing settings
 * Handles loading, saving, and syncing settings with the background service worker
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Settings } from '../../types';
import { DEFAULT_SETTINGS, TIMING } from '../../constants';
import { devError } from '../../utils/logger';
import type { AIResponse } from '../../types';

/**
 * Hook to manage settings state and operations
 * @returns Object with settings, loading state, update handler, and reset handler
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load settings from background service worker
  const loadSettings = useCallback(async () => {
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
        const response: unknown = await chrome.runtime.sendMessage({
          type: 'updateSettings',
          payload: updatedSettings,
        });

        // Validate response
        if (
          response &&
          typeof response === 'object' &&
          'success' in response &&
          (response as AIResponse).success
        ) {
          setShowSaveIndicator(true);
          // Hide indicator after 2 seconds
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
        setTimeout(() => setShowSaveIndicator(false), 2000);
      }
    } catch (error) {
      devError('Failed to reset settings:', error);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

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
    refreshSettings: loadSettings,
  };
}
