/**
 * Shared Modal Header Component
 * Reusable header with title, subtitle, icon, and close button
 */

import React from 'react';

export interface SharedModalHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClose: () => void;
  /** Optional ID for the title element (for aria-labelledby) */
  titleId?: string;
}

export const SharedModalHeader: React.FC<SharedModalHeaderProps> = ({
  title,
  subtitle,
  icon,
  onClose,
  titleId,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '18px 20px 8px 20px',
      borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {icon && (
        <span
          aria-hidden
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            background: 'rgba(59,130,246,0.12)',
            color: '#60a5fa',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </span>
      )}
      <div>
        <div id={titleId} style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ color: '#334155', fontSize: 12 }}>{subtitle}</div>
        )}
      </div>
    </div>
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      className="reflexa-modal__close"
      style={{ borderColor: 'rgba(15,23,42,0.15)', color: '#0f172a' }}
    >
      ×
    </button>
  </div>
);
