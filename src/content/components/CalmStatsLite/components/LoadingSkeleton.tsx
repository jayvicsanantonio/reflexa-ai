/**
 * Loading Skeleton Component
 * Skeleton loader for CalmStatsLite
 */

import React from 'react';

export const LoadingSkeleton: React.FC = () => (
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
