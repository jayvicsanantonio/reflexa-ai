import { useState, useEffect, useCallback } from 'react';
import type { AICapabilities } from '../../types';
import { devError } from '../../utils/logger';

export interface UseCapabilitiesResult {
  capabilities: AICapabilities | null;
  isChecking: boolean;
  refresh: (experimentalMode?: boolean) => Promise<void>;
}

/**
 * Hook for managing AI capabilities checking
 * Handles loading and refresh with experimental mode support
 *
 * @param experimentalMode - Whether experimental mode is enabled
 * @returns UseCapabilitiesResult with capabilities state and refresh action
 */
export function useCapabilities(
  experimentalMode: boolean
): UseCapabilitiesResult {
  const [capabilities, setCapabilities] = useState<AICapabilities | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // NECESSARY: Async initialization to load AI capabilities from chrome.runtime on mount
  // Cannot be replaced with useMemo as it requires async message passing
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

  // Refresh capabilities with optional experimental mode override
  const refresh = useCallback(
    async (experimentalModeOverride?: boolean) => {
      setIsChecking(true);
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
        setIsChecking(false);
      }
    },
    [experimentalMode]
  );

  return {
    capabilities,
    isChecking,
    refresh,
  };
}
