/**
 * Info Hint Component
 * Tooltip with information icon
 */

import React from 'react';

interface InfoHintProps {
  message: string;
}

export const InfoHint: React.FC<InfoHintProps> = ({ message }) => (
  <span className="reflexa-info">
    <span
      className="reflexa-info__icon"
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
      <span className="reflexa-info__tooltip" role="tooltip">
        {message}
      </span>
    </span>
  </span>
);
