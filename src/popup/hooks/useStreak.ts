/**
 * Custom hook for managing streak data
 */

import { useEffect, useState } from 'react';
import type { StreakData } from '../../types';
import { STORAGE_KEYS } from '../../constants';
import { devError } from '../../utils/logger';

/**
 * Hook to manage streak state
 * @returns Streak data and loading state
 */
export function useStreak() {
  const [streakData, setStreakData] = useState<StreakData>({
    current: 0,
    lastReflectionDate: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load streak from storage
  useEffect(() => {
    const loadStreak = async () => {
      try {
        const result = await chrome.storage.local.get(STORAGE_KEYS.STREAK);
        if (result[STORAGE_KEYS.STREAK]) {
          setStreakData(result[STORAGE_KEYS.STREAK] as StreakData);
        }
      } catch (error) {
        devError('Failed to load streak:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadStreak();
  }, []);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== 'local') return;

      if (changes[STORAGE_KEYS.STREAK]?.newValue) {
        setStreakData(changes[STORAGE_KEYS.STREAK].newValue as StreakData);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  return {
    streakData,
    isLoading,
  };
}
