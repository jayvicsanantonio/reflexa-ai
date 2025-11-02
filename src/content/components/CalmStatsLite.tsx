import React from 'react';
import type { CalmStats as CalmStatsType } from '../../types';
import {
  LoadingSkeleton,
  StatsHeader,
  StatsMetrics,
  TimeBalance,
  InsightMessage,
} from './CalmStatsLite/components';

interface CalmStatsLiteProps {
  stats: CalmStatsType;
  isLoading?: boolean;
}

/**
 * CalmStatsLite
 * A light, inline-styled version of Calm Stats for use inside the content overlay.
 * Matches the popup visuals closely without relying on Tailwind classes.
 */
export const CalmStatsLite: React.FC<CalmStatsLiteProps> = ({
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

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div
      role="region"
      aria-label="Calm statistics"
      style={{
        border: '1px solid rgba(15, 23, 42, 0.08)',
        borderRadius: 16,
        background: '#ffffff',
        padding: 16,
      }}
    >
      <StatsHeader />
      <StatsMetrics
        totalReflections={totalReflections}
        averagePerDay={averagePerDay}
        reflectionRatio={reflectionRatio}
      />
      <TimeBalance
        totalReadingTime={totalReadingTime}
        totalReflectionTime={totalReflectionTime}
        reflectionRatio={reflectionRatio}
      />
      <InsightMessage
        reflectionRatio={reflectionRatio}
        totalReflections={totalReflections}
      />
    </div>
  );
};
