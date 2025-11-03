/**
 * Modal Footer Component
 * Footer with Done button
 */

import React from 'react';

interface ModalFooterProps {
  onClose: () => void;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ onClose }) => (
  <div
    style={{
      padding: '12px 20px 16px 20px',
      display: 'flex',
      justifyContent: 'flex-end',
      borderTop: '1px solid rgba(15, 23, 42, 0.06)',
    }}
  >
    <button
      type="button"
      onClick={onClose}
      className="reflexa-btn reflexa-btn--primary"
    >
      Done
    </button>
  </div>
);
