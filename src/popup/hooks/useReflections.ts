import { useState, useEffect, useCallback } from 'react';
import type { Reflection, StreakData } from '../../types';
import { STORAGE_KEYS } from '../../constants';
import { formatISODate } from '../../utils';
import { devError } from '../../utils/logger';

/**
 * Hook for managing reflections data with automatic synchronization
 */
export function useReflections() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [streakData, setStreakData] = useState<StreakData>({
    current: 0,
    lastReflectionDate: '',
  });
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        setLoading(true);

        const result = await chrome.storage.local.get([
          STORAGE_KEYS.REFLECTIONS,
          STORAGE_KEYS.STREAK,
        ]);

        // Set reflections (sorted by date, most recent first)
        const loadedReflections = (result[STORAGE_KEYS.REFLECTIONS] ??
          []) as Reflection[];
        const sortedReflections = loadedReflections.sort(
          (a, b) => b.createdAt - a.createdAt
        );
        setReflections(sortedReflections);

        // Set streak data
        if (result[STORAGE_KEYS.STREAK]) {
          setStreakData(result[STORAGE_KEYS.STREAK] as StreakData);
        }
      } catch (error) {
        devError('Failed to load reflections data:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ): void => {
      if (areaName !== 'local') return;

      // Update reflections if changed
      if (changes[STORAGE_KEYS.REFLECTIONS]?.newValue) {
        const newReflections = changes[STORAGE_KEYS.REFLECTIONS]
          .newValue as Reflection[];
        const sortedReflections = newReflections.sort(
          (a, b) => b.createdAt - a.createdAt
        );
        setReflections(sortedReflections);
      }

      // Update streak if changed
      if (changes[STORAGE_KEYS.STREAK]?.newValue) {
        setStreakData(changes[STORAGE_KEYS.STREAK].newValue as StreakData);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Delete reflection and recalculate streak
  const deleteReflection = useCallback(async (id: string): Promise<void> => {
    try {
      // Get current reflections
      const result = await chrome.storage.local.get(STORAGE_KEYS.REFLECTIONS);
      const currentReflections = (result[STORAGE_KEYS.REFLECTIONS] ??
        []) as Reflection[];

      // Filter out deleted reflection
      const updatedReflections = currentReflections.filter((r) => r.id !== id);

      // Save updated reflections
      await chrome.storage.local.set({
        [STORAGE_KEYS.REFLECTIONS]: updatedReflections,
      });

      // Recalculate streak
      if (updatedReflections.length > 0) {
        const dates = updatedReflections.map((r) => formatISODate(r.createdAt));
        const uniqueDates = [...new Set(dates)].sort(
          (a, b) => new Date(b).getTime() - new Date(a).getTime()
        );

        // Calculate streak
        const today = formatISODate(Date.now());
        const yesterday = formatISODate(Date.now() - 24 * 60 * 60 * 1000);

        let streak = 0;
        if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
          streak = 1;
          let currentDate = new Date(uniqueDates[0]);

          for (let i = 1; i < uniqueDates.length; i++) {
            const prevDate = new Date(uniqueDates[i]);
            const dayDiff = Math.floor(
              (currentDate.getTime() - prevDate.getTime()) /
                (24 * 60 * 60 * 1000)
            );

            if (dayDiff === 1) {
              streak++;
              currentDate = prevDate;
            } else if (dayDiff > 1) {
              break;
            }
          }
        }

        await chrome.storage.local.set({
          [STORAGE_KEYS.STREAK]: {
            current: streak,
            lastReflectionDate: uniqueDates[0],
          },
        });
      } else {
        // No reflections left, reset streak
        await chrome.storage.local.set({
          [STORAGE_KEYS.STREAK]: {
            current: 0,
            lastReflectionDate: '',
          },
        });
      }

      // Update local state
      setReflections(
        updatedReflections.sort((a, b) => b.createdAt - a.createdAt)
      );
    } catch (error) {
      devError('Failed to delete reflection:', error);
    }
  }, []);

  return {
    reflections,
    streakData,
    loading,
    deleteReflection,
  };
}
