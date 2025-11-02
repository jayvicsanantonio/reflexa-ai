/**
 * Stats Header Component
 * Header section with icon and title
 */

import React from 'react';
import { IconCalendar } from '../icons';

export const StatsHeader: React.FC = () => (
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
      {IconCalendar}
    </span>
    <div>
      <div style={{ fontWeight: 800, color: '#0f172a' }}>Calm Stats</div>
      <div style={{ color: '#64748b', fontSize: 12 }}>
        Your mindful reading journey
      </div>
    </div>
  </div>
);
