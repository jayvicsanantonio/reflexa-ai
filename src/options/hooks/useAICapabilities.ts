import { useState, useEffect, useCallback } from 'react';
import type { AICapabilities } from '../../types';
import { useChromeMessage } from '../../utils/hooks';
import { devError } from '../../utils/logger';

/**
 * Hook for managing AI capabilities state
 */
export function useAICapabilities() {
  const [capabilities, setCapabilities] = useState<AICapabilities | null>(null);
  const [checkingCapabilities, setCheckingCapabilities] = useState(false);
  const { sendMessage } = useChromeMessage();

  // Load capabilities on mount
  useEffect(() => {
    const loadCapabilities = async (): Promise<void> => {
      try {
        const response = await sendMessage<AICapabilities>({
          type: 'getCapabilities',
        });

        if (response.success && response.data) {
          setCapabilities(response.data);
        }
      } catch (error) {
        devError('Failed to load capabilities:', error);
      }
    };

    void loadCapabilities();
  }, [sendMessage]);

  // Refresh capabilities
  const refreshCapabilities = useCallback(
    async (experimentalMode?: boolean): Promise<void> => {
      setCheckingCapabilities(true);
      try {
        const response = await sendMessage<AICapabilities>({
          type: 'getCapabilities',
          payload: {
            refresh: true,
            experimentalMode,
          },
        });

        if (response.success && response.data) {
          setCapabilities(response.data);
        }
      } catch (error) {
        devError('Failed to refresh capabilities:', error);
      } finally {
        setCheckingCapabilities(false);
      }
    },
    [sendMessage]
  );

  return {
    capabilities,
    checkingCapabilities,
    refreshCapabilities,
  };
}
