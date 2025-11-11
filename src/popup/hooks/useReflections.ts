/**
 * Custom hook for managing reflection data in popup
 * Handles loading, storage sync, and deletion of reflections
 */

import { useEffect, useState, useCallback } from 'react';
import type { Reflection, StreakData } from '../../types';
import { STORAGE_KEYS } from '../../constants';
import { devError } from '../../utils/logger';

/**
 * Hook return type
 */
interface UseReflectionsReturn {
  reflections: Reflection[];
  streakData: StreakData;
  isLoading: boolean;
  handleDelete: (id: string) => Promise<void>;
}

/**
 * Custom hook for managing reflections
 * Syncs with Chrome storage and provides deletion capability
 */
export function useReflections(): UseReflectionsReturn {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [streakData, setStreakData] = useState<StreakData>({
    current: 0,
    lastReflectionDate: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load data from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        const result = await chrome.storage.local.get([
          STORAGE_KEYS.REFLECTIONS,
          STORAGE_KEYS.STREAK,
        ]);

        const loadedReflections = (result[STORAGE_KEYS.REFLECTIONS] ??
          []) as Reflection[];
        const sortedReflections = loadedReflections.sort(
          (a, b) => b.createdAt - a.createdAt
        );
        setReflections(sortedReflections);

        if (result[STORAGE_KEYS.STREAK]) {
          setStreakData(result[STORAGE_KEYS.STREAK] as StreakData);
        }
      } catch (error) {
        devError('Failed to load reflections:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== 'local') return;

      if (changes[STORAGE_KEYS.REFLECTIONS]?.newValue) {
        const newReflections = changes[STORAGE_KEYS.REFLECTIONS]
          .newValue as Reflection[];
        const sortedReflections = newReflections.sort(
          (a, b) => b.createdAt - a.createdAt
        );
        setReflections(sortedReflections);
      }

      if (changes[STORAGE_KEYS.STREAK]?.newValue) {
        setStreakData(changes[STORAGE_KEYS.STREAK].newValue as StreakData);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Handle reflection deletion
  const handleDelete = useCallback(async (id: string) => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.REFLECTIONS);
      const currentReflections = (result[STORAGE_KEYS.REFLECTIONS] ??
        []) as Reflection[];

      const updatedReflections = currentReflections.filter((r) => r.id !== id);

      await chrome.storage.local.set({
        [STORAGE_KEYS.REFLECTIONS]: updatedReflections,
      });

      // Recalculate streak
      if (updatedReflections.length > 0) {
        // Streak calculation logic would go here
        // For now, let storage listener handle it
      } else {
        await chrome.storage.local.set({
          [STORAGE_KEYS.STREAK]: {
            current: 0,
            lastReflectionDate: '',
          },
        });
      }

      setReflections(
        updatedReflections.sort((a, b) => b.createdAt - a.createdAt)
      );
    } catch (error) {
      devError('Failed to delete reflection:', error);
      throw error;
    }
  }, []);

  return {
    reflections,
    streakData,
    isLoading,
    handleDelete,
  };
}
