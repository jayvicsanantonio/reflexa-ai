/**
 * Custom hook for managing privacy notice display
 */

import { useEffect, useState, useCallback } from 'react';
import { STORAGE_KEYS } from '../../constants';
import { devError } from '../../utils/logger';

/**
 * Hook to manage privacy notice state
 * Shows on first launch only
 */
export function usePrivacyNotice() {
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);

  // Check if first launch
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const result = await chrome.storage.local.get(STORAGE_KEYS.FIRST_LAUNCH);
        if (!result[STORAGE_KEYS.FIRST_LAUNCH]) {
          setShowPrivacyNotice(true);
          // Mark as launched
          await chrome.storage.local.set({
            [STORAGE_KEYS.FIRST_LAUNCH]: true,
          });
        }
      } catch (error) {
        devError('Failed to check first launch:', error);
      }
    };

    void checkFirstLaunch();
  }, []);

  const dismissPrivacyNotice = useCallback(() => {
    setShowPrivacyNotice(false);
  }, []);

  return {
    showPrivacyNotice,
    dismissPrivacyNotice,
  };
}
