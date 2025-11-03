/**
 * Modal Header Component
 */

import React from 'react';

interface ModalHeaderProps {
  onClose: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ onClose }) => (
  <div className="reflexa-modal__header">
    <h2 id="reflexa-help-title" className="reflexa-modal__title">
      Setup Chrome AI
    </h2>
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      className="reflexa-modal__close"
    >
      ×
    </button>
  </div>
);
