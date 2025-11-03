/**
 * Get Insight Message Utility
 * Generates contextual insight message based on reflection ratio and count
 */

export const getInsightMessage = (ratio: number, count: number): string => {
  if (count === 0)
    return 'Start your first reflection to begin tracking your mindful reading journey.';
  if (ratio < 0.1)
    return 'Consider pausing more often to reflect. Even brief moments of contemplation deepen understanding.';
  if (ratio < 0.2)
    return "You're building a reflection practice. Each pause helps knowledge settle into memory.";
  if (ratio < 0.3)
    return 'Beautiful balance emerging. Your reflections are becoming a natural part of reading.';
  if (ratio < 0.5)
    return "Excellent mindful reading rhythm. You're giving ideas time to breathe and integrate.";
  return "Deeply contemplative practice. You're transforming reading into true wisdom.";
};
