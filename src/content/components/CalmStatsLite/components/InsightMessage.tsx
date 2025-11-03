/**
 * Insight Message Component
 * Displays contextual insight based on reflection stats
 */

import React from 'react';
import { getInsightMessage } from '../utils/getInsightMessage';

interface InsightMessageProps {
  reflectionRatio: number;
  totalReflections: number;
}

export const InsightMessage: React.FC<InsightMessageProps> = ({
  reflectionRatio,
  totalReflections,
}) => (
  <div
    style={{
      background: '#eff6ff',
      border: '1px solid #bfdbfe',
      borderRadius: 10,
      padding: 12,
      marginTop: 12,
    }}
  >
    <p
      style={{
        color: '#334155',
        fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
        fontSize: 14,
        margin: 0,
        lineHeight: 1.6,
        fontStyle: 'italic',
      }}
    >
      {getInsightMessage(reflectionRatio, totalReflections)}
    </p>
  </div>
);
