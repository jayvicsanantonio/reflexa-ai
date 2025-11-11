/**
 * Custom hook for managing AI capabilities
 */

import { useEffect, useState, useCallback } from 'react';
import type { AICapabilities, Settings } from '../../types';
import { sendMessageTyped } from '../../utils/messageClient';
import { devError } from '../../utils/logger';

/**
 * Hook to manage AI capabilities state
 */
export function useCapabilities(experimentalMode: boolean) {
  const [capabilities, setCapabilities] = useState<AICapabilities | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Load capabilities on mount
  useEffect(() => {
    const loadCapabilities = async () => {
      try {
        const response = await sendMessageTyped<AICapabilities>('getCapabilities');

        if (response.success && response.data) {
          setCapabilities(response.data);
        }
      } catch (error) {
        devError('Failed to load capabilities:', error);
      }
    };

    void loadCapabilities();
  }, []);

  // Refresh capabilities
  const refreshCapabilities = useCallback(
    async (experimentalModeOverride?: boolean) => {
      setIsChecking(true);
      try {
        const response = await sendMessageTyped<AICapabilities>('getCapabilities', {
          refresh: true,
          experimentalMode: experimentalModeOverride ?? experimentalMode,
        });

        if (response.success && response.data) {
          setCapabilities(response.data);
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
    refreshCapabilities,
  };
}
