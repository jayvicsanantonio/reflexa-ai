/**
 * Experimental Mode Banner Component
 * Displays a banner when experimental mode is enabled
 */

import React from 'react';

interface ExperimentalModeBannerProps {
  isEnabled: boolean;
}

export const ExperimentalModeBanner: React.FC<ExperimentalModeBannerProps> = ({
  isEnabled,
}) => {
  if (!isEnabled) return null;

  return (
    <div
      style={{
        borderRadius: 16,
        padding: 14,
        background: 'rgba(59,130,246,0.08)',
        border: '1px solid rgba(30, 64, 175, 0.18)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          background: 'rgba(59,130,246,0.12)',
          color: '#60a5fa',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </span>
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontWeight: 700, color: '#0f172a' }}>
          Experimental Mode Active
        </div>
        <div style={{ color: '#334155', fontSize: 12 }}>
          Using beta AI features and capabilities
        </div>
      </div>
    </div>
  );
};
