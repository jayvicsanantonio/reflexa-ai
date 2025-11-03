/**
 * Action Buttons Component
 * Accept and Discard buttons
 */

import React from 'react';

interface ActionButtonsProps {
  onAccept: () => void;
  onDiscard: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onAccept,
  onDiscard,
}) => (
  <div className="flex justify-center gap-3 pt-2 sm:w-full sm:flex-col">
    <button
      type="button"
      className="flex cursor-pointer items-center gap-2 rounded-2xl border border-none border-white/15 bg-white/5 px-6 py-3 font-sans text-sm font-semibold text-(--color-calm-200) shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 active:translate-y-0 motion-reduce:hover:translate-y-0 sm:w-full sm:justify-center"
      onClick={onDiscard}
      data-testid="discard-button"
      aria-label="Keep original text"
    >
      <span className="text-base leading-none">✕</span>
      <span className="text-sm font-semibold">Keep Original</span>
    </button>
    <button
      type="button"
      className="flex cursor-pointer items-center gap-2 rounded-2xl border-none bg-gradient-to-br from-sky-500 to-sky-700 px-6 py-3 font-sans text-sm font-semibold text-white shadow-[0_2px_8px_rgba(14,165,233,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:from-sky-400 hover:to-sky-500 hover:shadow-[0_4px_12px_rgba(14,165,233,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 active:translate-y-0 motion-reduce:hover:translate-y-0 sm:w-full sm:justify-center"
      onClick={onAccept}
      data-testid="accept-button"
      aria-label="Apply corrections"
    >
      <span className="text-base leading-none">✓</span>
      <span className="text-sm font-semibold">Apply Corrections</span>
    </button>
  </div>
);
