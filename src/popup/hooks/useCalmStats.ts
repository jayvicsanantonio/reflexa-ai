/**
 * Custom hook for calculating calm statistics from reflections
 */

import { useMemo } from 'react';
import type { Reflection, CalmStats as CalmStatsType } from '../../types';

/**
 * Hook to calculate calm statistics from reflections
 * @param reflections Array of reflections
 * @returns Calculated calm stats
 */
export function useCalmStats(reflections: Reflection[]): CalmStatsType {
  return useMemo<CalmStatsType>(() => {
    if (reflections.length === 0) {
      return {
        totalReflections: 0,
        averagePerDay: 0,
        totalReadingTime: 0,
        totalReflectionTime: 0,
        reflectionRatio: 0,
      };
    }

    // Calculate days since first reflection
    const firstReflection = reflections[reflections.length - 1];
    const daysSinceFirst = Math.max(
      1,
      Math.ceil((Date.now() - firstReflection.createdAt) / (1000 * 60 * 60 * 24))
    );

    // Estimate reading time (assume 200 words per minute, 5 min average per article)
    const totalReadingTime = reflections.length * 5 * 60; // 5 minutes per article in seconds

    // Estimate reflection time (assume 3 minutes per reflection)
    const totalReflectionTime = reflections.length * 3 * 60; // 3 minutes per reflection in seconds

    return {
      totalReflections: reflections.length,
      averagePerDay: reflections.length / daysSinceFirst,
      totalReadingTime,
      totalReflectionTime,
      reflectionRatio: totalReflectionTime / (totalReadingTime + totalReflectionTime),
    };
  }, [reflections]);
}
