import React from 'react';
import { createKeyboardHandler } from '../utils/accessibility';

export type LotusNudgePosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left';

interface LotusNudgeProps {
  onClick: () => void;
  visible: boolean;
  position?: LotusNudgePosition;
  onAnimationComplete?: () => void;
}

/**
 * Floating lotus icon that appears when dwell threshold is reached
 * Provides a gentle nudge to encourage reflection
 */
export const LotusNudge: React.FC<LotusNudgeProps> = ({
  onClick,
  visible,
  position = 'bottom-right',
  onAnimationComplete,
}) => {
  if (!visible) return null;

  const handleAnimationEnd = (e: React.AnimationEvent) => {
    if (e.animationName === 'fadeIn' && onAnimationComplete) {
      onAnimationComplete();
    }
  };

  const handleKeyDown = createKeyboardHandler(onClick);

  return (
    <button
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onAnimationEnd={handleAnimationEnd}
      className={`reflexa-lotus-nudge reflexa-lotus-nudge--${position}`}
      role="button"
      aria-label="Start reflection session. Press Enter or Space to begin."
      data-testid="lotus-nudge"
      tabIndex={0}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Lotus flower icon with zen aesthetic */}
        {/* Center circle */}
        <circle cx="24" cy="24" r="6" fill="#f0abfc" opacity="0.9" />

        {/* Petals - arranged in lotus pattern */}
        {/* Top petal */}
        <ellipse cx="24" cy="12" rx="5" ry="10" fill="#0ea5e9" opacity="0.8" />

        {/* Top-right petal */}
        <ellipse
          cx="32"
          cy="16"
          rx="5"
          ry="10"
          fill="#0ea5e9"
          opacity="0.8"
          transform="rotate(45 32 16)"
        />

        {/* Right petal */}
        <ellipse
          cx="36"
          cy="24"
          rx="5"
          ry="10"
          fill="#0ea5e9"
          opacity="0.8"
          transform="rotate(90 36 24)"
        />

        {/* Bottom-right petal */}
        <ellipse
          cx="32"
          cy="32"
          rx="5"
          ry="10"
          fill="#0ea5e9"
          opacity="0.8"
          transform="rotate(135 32 32)"
        />

        {/* Bottom petal */}
        <ellipse cx="24" cy="36" rx="5" ry="10" fill="#0ea5e9" opacity="0.8" />

        {/* Bottom-left petal */}
        <ellipse
          cx="16"
          cy="32"
          rx="5"
          ry="10"
          fill="#0ea5e9"
          opacity="0.8"
          transform="rotate(-135 16 32)"
        />

        {/* Left petal */}
        <ellipse
          cx="12"
          cy="24"
          rx="5"
          ry="10"
          fill="#0ea5e9"
          opacity="0.8"
          transform="rotate(-90 12 24)"
        />

        {/* Top-left petal */}
        <ellipse
          cx="16"
          cy="16"
          rx="5"
          ry="10"
          fill="#0ea5e9"
          opacity="0.8"
          transform="rotate(-45 16 16)"
        />
      </svg>
    </button>
  );
};
