/**
 * Modal Footer Component
 */

import React from 'react';

interface ModalFooterProps {
  onClose: () => void;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ onClose }) => (
  <div className="flex justify-end gap-2 border-t border-t-white/8 bg-slate-900 px-5 py-3 pb-4">
    <button
      type="button"
      onClick={onClose}
      className="cursor-pointer rounded-full border-none bg-gradient-to-r from-sky-500 to-sky-600 px-3.5 py-2.5 font-sans text-sm font-bold text-white transition-all duration-150 hover:from-sky-400 hover:to-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
    >
      Got it
    </button>
  </div>
);
