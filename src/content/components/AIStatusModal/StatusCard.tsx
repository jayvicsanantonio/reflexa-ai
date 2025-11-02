/**
 * Status Card Component
 * Displays an AI capability status with icon and availability indicator
 */

import React from 'react';

interface StatusCardProps {
  label: string;
  ok?: boolean;
  icon: React.ReactNode;
}

export const StatusCard: React.FC<StatusCardProps> = ({ label, ok, icon }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 16px',
      borderRadius: 16,
      border: '1px solid rgba(30, 64, 175, 0.18)',
      background: 'rgba(59, 130, 246, 0.06)',
    }}
  >
    <span
      aria-hidden
      style={{
        width: 32,
        height: 32,
        borderRadius: 999,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(59, 130, 246, 0.12)',
        color: '#60a5fa',
      }}
    >
      {icon}
    </span>
    <div style={{ flex: 1, textAlign: 'left' }}>
      <div
        style={{
          color: '#0f172a',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 180,
        }}
        title={label}
      >
        {label}
      </div>
      <div
        style={{
          color: '#1f2937',
          fontSize: 13,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {ok ? (
          <>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span>Available</span>
          </>
        ) : (
          <span>• Unavailable</span>
        )}
      </div>
    </div>
  </div>
);
