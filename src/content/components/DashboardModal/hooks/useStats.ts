/**
 * useStats Hook
 * Calculates statistics from reflections list
 */

import { useMemo } from 'react';
import type { Reflection } from '../../../../types';

export interface SimpleStats {
  totalReflections: number;
  averagePerDay: number;
  totalReadingTime: number;
  totalReflectionTime: number;
  reflectionRatio: number; // 0..1
}

export const useStats = (reflections: Reflection[] | null): SimpleStats => {
  return useMemo(() => {
    const list = reflections ?? [];
    if (list.length === 0)
      return {
        totalReflections: 0,
        averagePerDay: 0,
        totalReadingTime: 0,
        totalReflectionTime: 0,
        reflectionRatio: 0,
      };
    const first = list[list.length - 1];
    const days = Math.max(
      1,
      Math.ceil((Date.now() - first.createdAt) / (1000 * 60 * 60 * 24))
    );
    // re-use heuristics from popup: 5 min reading, 3 min reflection
    const totalReading = list.length * 5 * 60;
    const totalReflect = list.length * 3 * 60;
    return {
      totalReflections: list.length,
      averagePerDay: list.length / days,
      totalReadingTime: totalReading,
      totalReflectionTime: totalReflect,
      reflectionRatio: totalReflect / (totalReading + totalReflect),
    };
  }, [reflections]);
};
