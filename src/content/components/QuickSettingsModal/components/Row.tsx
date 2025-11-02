/**
 * Row Component
 * Settings row with icon, title, description, and trailing control
 */

import React from 'react';

interface RowProps {
  title: string;
  desc: React.ReactNode;
  icon: React.ReactNode;
  trailing?: React.ReactNode;
}

export const Row: React.FC<RowProps> = ({ title, desc, icon, trailing }) => (
  <div className="reflexa-settings-row">
    <div className="reflexa-settings-row__meta">
      <span
        className="reflexa-settings-row__icon"
        aria-hidden
        style={{
          background: 'rgba(59,130,246,0.12)',
          color: '#60a5fa',
          border: '1px solid rgba(30,64,175,0.18)',
        }}
      >
        {icon}
      </span>
      <span>
        <div
          className="reflexa-settings-row__title"
          style={{ color: '#0f172a', fontWeight: 700 }}
        >
          {title}
        </div>
        <div
          className="reflexa-settings-row__desc"
          style={{ color: '#334155', fontSize: 13 }}
        >
          {desc}
        </div>
      </span>
    </div>
    <div>{trailing}</div>
  </div>
);
