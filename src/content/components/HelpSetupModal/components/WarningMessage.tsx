/**
 * Warning Message Component
 */

import React from 'react';

export const WarningMessage: React.FC = () => (
  <div
    style={{
      marginTop: 12,
      borderRadius: 12,
      padding: 12,
      background: 'rgba(245,158,11,0.12)',
      border: '1px solid rgba(245,158,11,0.35)',
      color: 'var(--color-calm-200)',
      fontSize: 14,
    }}
  >
    <strong>Important: </strong>Close all Chrome windows and{' '}
    <strong>restart</strong> Chrome after enabling the flags.
  </div>
);
