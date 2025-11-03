/**
 * Modal Header Component
 */

import React from 'react';

interface ModalHeaderProps {
  onClose: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ onClose }) => (
  <div className="flex items-center justify-between border-b border-b-white/8 bg-slate-800 px-5 py-4">
    <h2 id="reflexa-help-title" className="m-0 text-lg font-bold text-white">
      Setup Chrome AI
    </h2>
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      className="h-8 w-8 cursor-pointer rounded-full border border-white/15 bg-transparent text-white transition-all duration-150 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
    >
      ×
    </button>
  </div>
);
