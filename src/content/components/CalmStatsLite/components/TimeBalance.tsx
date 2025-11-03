/**
 * Time Balance Component
 * Progress bar showing reading vs reflection time ratio
 */

import React from 'react';
import { formatTime } from '../utils/formatTime';
import { IconBook, IconHeart } from '../icons';

interface TimeBalanceProps {
  totalReadingTime: number;
  totalReflectionTime: number;
  reflectionRatio: number;
}

export const TimeBalance: React.FC<TimeBalanceProps> = ({
  totalReadingTime,
  totalReflectionTime,
  reflectionRatio,
}) => {
  const reflectionPercentage = Math.min(reflectionRatio * 100, 100);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <span style={{ color: '#334155', fontSize: 14, fontWeight: 600 }}>
          Time Balance
        </span>
        <span
          style={{
            color: '#64748b',
            fontFamily: 'ui-monospace, monospace',
            fontSize: 12,
          }}
        >
          {formatTime(totalReadingTime + totalReflectionTime)} total
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Reading vs reflection time ratio"
        aria-valuenow={reflectionPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          height: 28,
          borderRadius: 8,
          overflow: 'hidden',
          background: '#e2e8f0',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: `${reflectionPercentage}%`,
            background: 'linear-gradient(90deg, #60a5fa, #3b82f6)',
            transition: 'width .35s ease-out',
          }}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '100%',
            padding: '0 10px',
          }}
        >
          <span
            style={{
              color: '#475569',
              fontSize: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {IconBook}
            <span>Reading</span>
          </span>
          <span
            style={{
              color: '#ffffff',
              fontSize: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              textShadow: '0 1px 1px rgba(0,0,0,0.25)',
            }}
          >
            {IconHeart}
            <span>Reflecting</span>
          </span>
        </div>
      </div>
      <div
        style={{
          marginTop: 8,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              background: '#cbd5e1',
              width: 12,
              height: 12,
              borderRadius: 2,
            }}
          />
          <span
            style={{
              color: '#64748b',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 12,
            }}
          >
            {formatTime(totalReadingTime)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
              width: 12,
              height: 12,
              borderRadius: 2,
            }}
          />
          <span
            style={{
              color: '#64748b',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 12,
            }}
          >
            {formatTime(totalReflectionTime)}
          </span>
        </div>
      </div>
    </div>
  );
};
