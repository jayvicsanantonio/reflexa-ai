/**
 * Stats Metrics Component
 * Displays three key metrics: Reflections, Per Day, Reflection %
 */

import React from 'react';

interface StatsMetricsProps {
  totalReflections: number;
  averagePerDay: number;
  reflectionRatio: number;
}

export const StatsMetrics: React.FC<StatsMetricsProps> = ({
  totalReflections,
  averagePerDay,
  reflectionRatio,
}) => (
  <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 22 }}>
        {totalReflections}
      </div>
      <div style={{ color: '#64748b', fontSize: 12 }}>Reflections</div>
    </div>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 22 }}>
        {averagePerDay.toFixed(1)}
      </div>
      <div style={{ color: '#64748b', fontSize: 12 }}>Per Day</div>
    </div>
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: '#2563eb', fontSize: 22, fontWeight: 800 }}>
        {Math.round(reflectionRatio * 100)}%
      </div>
      <div style={{ color: '#64748b', fontSize: 12 }}>Reflection</div>
    </div>
  </div>
);
