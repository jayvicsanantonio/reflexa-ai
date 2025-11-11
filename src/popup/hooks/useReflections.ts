/**
 * Custom hook for managing reflections data
 * Handles loading, storage sync, and deletion of reflections
 */

import { useEffect, useState, useCallback } from 'react';
import type { Reflection, StreakData } from '../../types';
import { STORAGE_KEYS } from '../../constants';
import { formatISODate } from '../../utils';
import { devError } from '../../utils/logger';

/**
 * Hook to manage reflections state and operations
 * @returns Object with reflections, loading state, and delete handler
 */
export function useReflections() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load reflections from storage
  const loadReflections = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await chrome.storage.local.get(STORAGE_KEYS.REFLECTIONS);
      const loadedReflections = (result[STORAGE_KEYS.REFLECTIONS] ?? []) as Reflection[];
      const sortedReflections = loadedReflections.sort(
        (a, b) => b.createdAt - a.createdAt
      );
      setReflections(sortedReflections);
    } catch (error) {
      devError('Failed to load reflections:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete a reflection
  const deleteReflection = useCallback(async (id: string) => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.REFLECTIONS);
      const currentReflections = (result[STORAGE_KEYS.REFLECTIONS] ?? []) as Reflection[];

      const updatedReflections = currentReflections.filter((r) => r.id !== id);

      await chrome.storage.local.set({
        [STORAGE_KEYS.REFLECTIONS]: updatedReflections,
      });

      // Recalculate streak
      if (updatedReflections.length > 0) {
        const dates = updatedReflections.map((r) => formatISODate(r.createdAt));
        const uniqueDates = [...new Set(dates)].sort(
          (a, b) => new Date(b).getTime() - new Date(a).getTime()
        );

        const today = formatISODate(Date.now());
        const yesterday = formatISODate(Date.now() - 24 * 60 * 60 * 1000);

        let streak = 0;
        if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
          streak = 1;
          let currentDate = new Date(uniqueDates[0]);

          for (let i = 1; i < uniqueDates.length; i++) {
            const prevDate = new Date(uniqueDates[i]);
            const dayDiff = Math.floor(
              (currentDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000)
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
          } as StreakData,
        });
      } else {
        await chrome.storage.local.set({
          [STORAGE_KEYS.STREAK]: {
            current: 0,
            lastReflectionDate: '',
          } as StreakData,
        });
      }

      setReflections(updatedReflections.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      devError('Failed to delete reflection:', error);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    void loadReflections();
  }, [loadReflections]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== 'local') return;

      if (changes[STORAGE_KEYS.REFLECTIONS]?.newValue) {
        const newReflections = changes[STORAGE_KEYS.REFLECTIONS].newValue as Reflection[];
        const sortedReflections = newReflections.sort(
          (a, b) => b.createdAt - a.createdAt
        );
        setReflections(sortedReflections);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  return {
    reflections,
    isLoading,
    deleteReflection,
    refreshReflections: loadReflections,
  };
}
