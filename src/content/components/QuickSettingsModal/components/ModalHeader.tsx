/**
 * Modal Header Component
 * Header with title and close button
 */

import React from 'react';
import { IconSettings } from '../icons';

interface ModalHeaderProps {
  onClose: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ onClose }) => (
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
        {IconSettings}
      </span>
      <div>
        <div
          id="reflexa-quick-settings-title"
          style={{ margin: 0, fontSize: 18, fontWeight: 800 }}
        >
          Settings
        </div>
        <div style={{ color: '#334155', fontSize: 12 }}>
          Preferences & Features
        </div>
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
