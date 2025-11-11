import { useState, useEffect, useCallback, useRef } from 'react';
import type { Settings } from '../../types';
import { DEFAULT_SETTINGS, TIMING } from '../../constants';
import { useChromeMessage } from '../../utils/hooks';
import { devError } from '../../utils/logger';

/**
 * Hook for managing extension settings with auto-save
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const { sendMessage } = useChromeMessage();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async (): Promise<void> => {
      try {
        const response = await sendMessage<Settings>({
          type: 'getSettings',
        });

        if (response.success && response.data) {
          setSettings(response.data);
        }
      } catch (error) {
        devError('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, [sendMessage]);

  // Debounced auto-save function
  const debouncedSave = useCallback(
    (updatedSettings: Settings): void => {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for debounced save
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await sendMessage({
            type: 'updateSettings',
            payload: updatedSettings,
          });
        } catch (error) {
          devError('Failed to save settings:', error);
        }
      }, TIMING.SETTINGS_DEBOUNCE);
    },
    [sendMessage]
  );

  // Update a specific setting
  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]): void => {
      const updatedSettings = { ...settings, [key]: value };
      setSettings(updatedSettings);
      debouncedSave(updatedSettings);
    },
    [settings, debouncedSave]
  );

  // Reset to defaults
  const resetSettings = useCallback(async (): Promise<boolean> => {
    try {
      const response = await sendMessage<Settings>({
        type: 'resetSettings',
      });

      if (response.success && response.data) {
        setSettings(response.data);
        return true;
      }
      return false;
    } catch (error) {
      devError('Failed to reset settings:', error);
      return false;
    }
  }, [sendMessage]);

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
    updateSetting,
    resetSettings,
  };
}
