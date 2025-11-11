import { useEffect, useState, useCallback } from 'react';
import type { Settings, AICapabilities } from '../../types';
import { devError } from '../../utils/logger';

/**
 * Custom hook for managing AI capabilities
 * Handles loading and refreshing capabilities
 */
export function useAICapabilities(settings: Settings) {
  const [capabilities, setCapabilities] = useState<AICapabilities | null>(null);
  const [checkingCapabilities, setCheckingCapabilities] = useState(false);

  // Load capabilities on mount
  useEffect(() => {
    const loadCapabilities = async () => {
      try {
        const response: unknown = await chrome.runtime.sendMessage({
          type: 'getCapabilities',
        });

        if (
          response &&
          typeof response === 'object' &&
          'success' in response &&
          response.success &&
          'data' in response
        ) {
          setCapabilities(response.data as AICapabilities);
        }
      } catch (error) {
        devError('Failed to load capabilities:', error);
      }
    };

    void loadCapabilities();
  }, []);

  // Refresh capabilities
  const refreshCapabilities = useCallback(
    async (experimentalMode?: boolean) => {
      setCheckingCapabilities(true);
      try {
        const response: unknown = await chrome.runtime.sendMessage({
          type: 'getCapabilities',
          payload: {
            refresh: true,
            experimentalMode: experimentalMode ?? settings.experimentalMode,
          },
        });

        if (
          response &&
          typeof response === 'object' &&
          'success' in response &&
          response.success &&
          'data' in response
        ) {
          setCapabilities(response.data as AICapabilities);
        }
      } catch (error) {
        devError('Failed to refresh capabilities:', error);
      } finally {
        setCheckingCapabilities(false);
      }
    },
    [settings.experimentalMode]
  );

  return {
    capabilities,
    checkingCapabilities,
    refreshCapabilities,
  };
}
