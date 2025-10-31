import React from 'react';
import type { CalmStats as CalmStatsType } from '../../types';

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

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  const reflectionPercentage = Math.min(reflectionRatio * 100, 100);

  if (isLoading) {
    return (
      <div
        aria-busy
        role="region"
        aria-label="Loading calm statistics"
        style={{
          border: '1px solid rgba(15,23,42,0.08)',
          borderRadius: 16,
          background: '#ffffff',
          padding: 16,
          opacity: 0.8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              background: '#e2e8f0',
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: 16,
                width: 120,
                background: '#e2e8f0',
                borderRadius: 6,
                marginBottom: 6,
              }}
            />
            <div
              style={{
                height: 12,
                width: 160,
                background: '#e2e8f0',
                borderRadius: 6,
              }}
            />
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 14,
            marginTop: 16,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div
                style={{
                  height: 28,
                  width: 48,
                  background: '#e2e8f0',
                  borderRadius: 8,
                  margin: '0 auto 6px',
                }}
              />
              <div
                style={{
                  height: 12,
                  width: 64,
                  background: '#e2e8f0',
                  borderRadius: 6,
                  margin: '0 auto',
                }}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                height: 14,
                width: 100,
                background: '#e2e8f0',
                borderRadius: 6,
              }}
            />
            <div
              style={{
                height: 12,
                width: 80,
                background: '#e2e8f0',
                borderRadius: 6,
              }}
            />
          </div>
          <div style={{ height: 28, background: '#e2e8f0', borderRadius: 8 }} />
        </div>
      </div>
    );
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
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            background: 'rgba(59,130,246,0.12)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M9 2v2" />
            <path d="M15 2v2" />
            <path d="M12 2v2" />
            <path d="M6 8h12" />
            <path d="M6 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" />
            <path d="M12 8v8" />
          </svg>
        </span>
        <div>
          <div style={{ fontWeight: 800, color: '#0f172a' }}>Calm Stats</div>
          <div style={{ color: '#64748b', fontSize: 12 }}>
            Your mindful reading journey
          </div>
        </div>
      </div>

      {/* Metrics */}
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

      {/* Time Balance */}
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
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M3 6h7a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2V6z" />
                <path d="M12 18V8a2 2 0 0 1 2-2h7v10a2 2 0 0 1-2 2h-7" />
              </svg>
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
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 7c-2 2-6 2-8 2 2 2 3 6 8 8 5-2 6-6 8-8-2 0-6 0-8-2z" />
              </svg>
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

      {/* Insight */}
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
    </div>
  );
};

function getInsightMessage(ratio: number, count: number): string {
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
}
