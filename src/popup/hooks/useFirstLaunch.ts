import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../../constants';

/**
 * Hook to check and handle first launch
 * Returns whether this is the first launch and a function to mark as launched
 */
export function useFirstLaunch(): [boolean, () => Promise<void>] {
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  useEffect(() => {
    const checkFirstLaunch = async (): Promise<void> => {
      try {
        const result = await chrome.storage.local.get(
          STORAGE_KEYS.FIRST_LAUNCH
        );
        if (!result[STORAGE_KEYS.FIRST_LAUNCH]) {
          setIsFirstLaunch(true);
        }
      } catch (error) {
        console.error('Failed to check first launch:', error);
      }
    };

    void checkFirstLaunch();
  }, []);

  const markAsLaunched = async (): Promise<void> => {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.FIRST_LAUNCH]: true,
      });
      setIsFirstLaunch(false);
    } catch (error) {
      console.error('Failed to mark as launched:', error);
    }
  };

  return [isFirstLaunch, markAsLaunched];
}
