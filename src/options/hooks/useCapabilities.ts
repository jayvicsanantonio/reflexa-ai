/**
 * Custom hook for managing AI capabilities
 * Handles loading and refreshing AI capabilities from the background service worker
 */

import { useEffect, useState, useCallback } from 'react';
import type { AICapabilities, Settings } from '../../types';
import { devError } from '../../utils/logger';
import type { AIResponse } from '../../types';

/**
 * Hook to manage AI capabilities state
 * @param experimentalMode Current experimental mode setting
 * @returns Object with capabilities, loading state, and refresh handler
 */
export function useCapabilities(experimentalMode: boolean) {
  const [capabilities, setCapabilities] = useState<AICapabilities | null>(null);
  const [checkingCapabilities, setCheckingCapabilities] = useState(false);

  // Load capabilities from background service worker
  const loadCapabilities = useCallback(async () => {
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
  }, []);

  // Refresh capabilities
  const refreshCapabilities = useCallback(
    async (experimentalModeOverride?: boolean) => {
      setCheckingCapabilities(true);
      try {
        const response: unknown = await chrome.runtime.sendMessage({
          type: 'getCapabilities',
          payload: {
            refresh: true,
            experimentalMode: experimentalModeOverride ?? experimentalMode,
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
    [experimentalMode]
  );

  // Load on mount
  useEffect(() => {
    void loadCapabilities();
  }, [loadCapabilities]);

  return {
    capabilities,
    checkingCapabilities,
    refreshCapabilities,
  };
}
