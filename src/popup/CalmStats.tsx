import React from 'react';
import type { CalmStats as CalmStatsType } from '../types';

interface CalmStatsProps {
  stats: CalmStatsType;
  isLoading?: boolean;
}

/**
 * CalmStats Component
 * Displays reading vs reflection time ratio and statistics
 * in a calm, minimal design using the Zen aesthetic
 */
const CalmStatsComponent: React.FC<CalmStatsProps> = ({
  stats,
  isLoading = false,
}) => {
  const {
    totalReflections,
    averagePerDay,
    totalReadingTime,
    totalReflectionTime,
    reflectionRatio,
  } = stats;

  // Format time in minutes or hours
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  // Calculate percentage for visual bar (capped at 100%)
  const reflectionPercentage = Math.min(reflectionRatio * 100, 100);

  // Loading state - skeleton UI
  if (isLoading) {
    return (
      <div
        className="border-calm-200 shadow-soft animate-pulse rounded-xl border bg-white p-6"
        role="region"
        aria-label="Loading calm statistics"
        aria-busy="true"
      >
        {/* Header Skeleton */}
        <div className="mb-6 flex items-center gap-3">
          <div className="bg-calm-200 h-10 w-10 rounded-full"></div>
          <div className="flex-1">
            <div className="bg-calm-200 mb-2 h-5 w-24 rounded"></div>
            <div className="bg-calm-200 h-3 w-40 rounded"></div>
          </div>
        </div>

        {/* Metrics Grid Skeleton */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="bg-calm-200 mx-auto mb-2 h-9 w-12 rounded"></div>
            <div className="bg-calm-200 mx-auto h-3 w-16 rounded"></div>
          </div>
          <div className="text-center">
            <div className="bg-calm-200 mx-auto mb-2 h-9 w-12 rounded"></div>
            <div className="bg-calm-200 mx-auto h-3 w-12 rounded"></div>
          </div>
          <div className="text-center">
            <div className="bg-calm-200 mx-auto mb-2 h-9 w-12 rounded"></div>
            <div className="bg-calm-200 mx-auto h-3 w-16 rounded"></div>
          </div>
        </div>

        {/* Progress Bar Skeleton */}
        <div className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="bg-calm-200 h-4 w-24 rounded"></div>
            <div className="bg-calm-200 h-3 w-16 rounded"></div>
          </div>
          <div className="bg-calm-200 h-8 rounded-lg"></div>
          <div className="mt-2 flex items-center justify-between">
            <div className="bg-calm-200 h-3 w-12 rounded"></div>
            <div className="bg-calm-200 h-3 w-12 rounded"></div>
          </div>
        </div>

        {/* Insight Box Skeleton */}
        <div className="bg-calm-100 border-calm-200 rounded-lg border p-3">
          <div className="bg-calm-200 mb-2 h-3 rounded"></div>
          <div className="bg-calm-200 h-3 w-5/6 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="border-calm-200 shadow-soft rounded-xl border bg-white p-6"
      role="region"
      aria-label="Calm statistics"
    >
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-zen-100 flex h-10 w-10 items-center justify-center rounded-full">
          <svg
            className="text-zen-600 h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {/* Candle icon */}
            <path d="M9 2v2" />
            <path d="M15 2v2" />
            <path d="M12 2v2" />
            <path d="M6 8h12" />
            <path d="M6 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" />
            <path d="M12 8v8" />
          </svg>
        </div>
        <div>
          <h2 className="font-display text-calm-900 text-lg font-semibold">
            Calm Stats
          </h2>
          <p className="text-calm-500 text-xs">Your mindful reading journey</p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {/* Total Reflections */}
        <div className="text-center">
          <div className="font-display text-zen-600 text-3xl font-bold">
            {totalReflections}
          </div>
          <div className="text-calm-500 mt-1 text-xs font-medium">
            Reflections
          </div>
        </div>

        {/* Average Per Day */}
        <div className="text-center">
          <div className="font-display text-zen-600 text-3xl font-bold">
            {averagePerDay.toFixed(1)}
          </div>
          <div className="text-calm-500 mt-1 text-xs font-medium">Per Day</div>
        </div>

        {/* Reflection Ratio */}
        <div className="text-center">
          <div className="font-display text-zen-600 text-3xl font-bold">
            {Math.round(reflectionRatio * 100)}%
          </div>
          <div className="text-calm-500 mt-1 text-xs font-medium">
            Reflection
          </div>
        </div>
      </div>

      {/* Visual Bar Chart */}
      <div className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-calm-600 text-sm font-medium">
            Time Balance
          </span>
          <span className="text-calm-500 font-mono text-xs">
            {formatTime(totalReadingTime + totalReflectionTime)} total
          </span>
        </div>

        {/* Progress Bar */}
        <div
          className="bg-calm-100 relative h-8 overflow-hidden rounded-lg"
          role="progressbar"
          aria-label="Reading vs reflection time ratio"
          aria-valuenow={reflectionPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {/* Reading Time (background) */}
          <div
            className="from-calm-200 to-calm-300 absolute inset-0 bg-linear-to-r"
            style={{ width: '100%' }}
          />

          {/* Reflection Time (overlay) */}
          <div
            className="from-zen-400 to-zen-500 absolute inset-y-0 left-0 bg-linear-to-r transition-all duration-500 ease-out"
            style={
              {
                width: `${reflectionPercentage}%`,
              } as React.CSSProperties
            }
          />

          {/* Labels */}
          <div className="relative flex h-full items-center justify-between px-3">
            <span className="text-calm-700 text-xs font-medium">
              📖 Reading
            </span>
            <span className="text-xs font-medium text-white drop-shadow-sm">
              🪷 Reflecting
            </span>
          </div>
        </div>

        {/* Time Details */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-calm-300 h-3 w-3 rounded-sm" />
            <span className="text-calm-600 font-mono text-xs">
              {formatTime(totalReadingTime)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="from-zen-400 to-zen-500 h-3 w-3 rounded-sm bg-linear-to-br" />
            <span className="text-calm-600 font-mono text-xs">
              {formatTime(totalReflectionTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Insight Message */}
      <div className="bg-zen-50 border-zen-200 rounded-lg border p-3">
        <p className="text-calm-700 font-serif text-sm leading-relaxed italic">
          {getInsightMessage(reflectionRatio, totalReflections)}
        </p>
      </div>
    </div>
  );
};

/**
 * Get contextual insight message based on reflection ratio and count
 */
function getInsightMessage(ratio: number, count: number): string {
  if (count === 0) {
    return 'Start your first reflection to begin tracking your mindful reading journey.';
  }

  if (ratio < 0.1) {
    return 'Consider pausing more often to reflect. Even brief moments of contemplation deepen understanding.';
  }

  if (ratio < 0.2) {
    return "You're building a reflection practice. Each pause helps knowledge settle into memory.";
  }

  if (ratio < 0.3) {
    return 'Beautiful balance emerging. Your reflections are becoming a natural part of reading.';
  }

  if (ratio < 0.5) {
    return "Excellent mindful reading rhythm. You're giving ideas time to breathe and integrate.";
  }

  return "Deeply contemplative practice. You're transforming reading into true wisdom.";
}

// Memoized export with custom comparison for optimal performance
export const CalmStats = React.memo(
  CalmStatsComponent,
  (prevProps, nextProps) => {
    // Only re-render if stats or loading state changed
    return (
      prevProps.stats.totalReflections === nextProps.stats.totalReflections &&
      prevProps.stats.averagePerDay === nextProps.stats.averagePerDay &&
      prevProps.stats.totalReadingTime === nextProps.stats.totalReadingTime &&
      prevProps.stats.totalReflectionTime ===
        nextProps.stats.totalReflectionTime &&
      prevProps.stats.reflectionRatio === nextProps.stats.reflectionRatio &&
      prevProps.isLoading === nextProps.isLoading
    );
  }
);
