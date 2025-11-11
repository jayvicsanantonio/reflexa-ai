import { useEffect, useState } from 'react';
import type { StreakData } from '../../types';
import { STORAGE_KEYS } from '../../constants';
import { devError } from '../../utils/logger';

/**
 * Custom hook for managing streak data
 */
export function useStreak() {
  const [streakData, setStreakData] = useState<StreakData>({
    current: 0,
    lastReflectionDate: '',
  });

  // Load streak on mount
  useEffect(() => {
    const loadStreak = async () => {
      try {
        const result = await chrome.storage.local.get(STORAGE_KEYS.STREAK);
        if (result[STORAGE_KEYS.STREAK]) {
          setStreakData(result[STORAGE_KEYS.STREAK] as StreakData);
        }
      } catch (error) {
        devError('Failed to load streak:', error);
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

  return streakData;
}
