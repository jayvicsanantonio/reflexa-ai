/**
 * Modal Footer Component
 */

import React from 'react';

interface ModalFooterProps {
  onClose: () => void;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ onClose }) => (
  <div className="reflexa-modal__footer" style={{ justifyContent: 'flex-end' }}>
    <button
      type="button"
      onClick={onClose}
      className="reflexa-btn reflexa-btn--primary"
    >
      Got it
    </button>
  </div>
);
