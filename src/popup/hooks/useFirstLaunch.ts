/**
 * Custom hook for managing first-launch experience
 * Shows privacy notice on first popup open
 */

import { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../../constants';
import { devError } from '../../utils/logger';

/**
 * Custom hook for first-launch user experience
 */
export function useFirstLaunch() {
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const result = await chrome.storage.local.get(
          STORAGE_KEYS.FIRST_LAUNCH
        );

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

  return { showPrivacyNotice, setShowPrivacyNotice };
}
