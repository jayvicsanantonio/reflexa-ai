/**
 * Shared Modal Footer Component
 * Reusable footer with primary and secondary action buttons
 */

import React from 'react';

export interface SharedModalFooterProps {
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  primaryDisabled?: boolean;
}

export const SharedModalFooter: React.FC<SharedModalFooterProps> = ({
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  primaryDisabled = false,
}) => (
  <div
    style={{
      padding: '12px 20px 16px 20px',
      display: 'flex',
      justifyContent: secondaryLabel ? 'space-between' : 'flex-end',
      borderTop: '1px solid rgba(15, 23, 42, 0.06)',
      gap: 8,
    }}
  >
    {secondaryLabel && onSecondary && (
      <button
        type="button"
        onClick={onSecondary}
        className="reflexa-btn reflexa-btn--ghost"
      >
        {secondaryLabel}
      </button>
    )}
    {primaryLabel && onPrimary && (
      <button
        type="button"
        onClick={onPrimary}
        disabled={primaryDisabled}
        className="reflexa-btn reflexa-btn--primary"
        style={
          primaryDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined
        }
      >
        {primaryLabel}
      </button>
    )}
  </div>
);
