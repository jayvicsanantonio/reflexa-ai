/**
 * Info Hint Component
 * Tooltip with information icon
 */

import React from 'react';

interface InfoHintProps {
  message: string;
}

export const InfoHint: React.FC<InfoHintProps> = ({ message }) => (
  <span className="ml-1.5 inline-flex items-center gap-1.5">
    <span
      className="relative flex h-4 w-4 cursor-help items-center justify-center text-slate-400 transition-opacity duration-150 hover:opacity-100 focus:opacity-100 [&:focus_.reflexa-info-tooltip]:opacity-100 [&:hover_.reflexa-info-tooltip]:opacity-100"
      aria-label={message}
      tabIndex={0}
      role="img"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <span
        className="reflexa-info-tooltip pointer-events-none absolute top-1/2 left-[22px] -translate-y-1/2 rounded-lg border border-white/8 bg-slate-900 px-2 py-1.5 text-xs whitespace-nowrap text-white opacity-0 shadow-[0_8px_20px_rgba(0,0,0,0.25)] transition-opacity duration-150"
        role="tooltip"
      >
        {message}
      </span>
    </span>
  </span>
);
