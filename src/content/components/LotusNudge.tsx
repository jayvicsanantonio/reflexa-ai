import React, { useCallback, useState } from 'react';
import { createKeyboardHandler } from '../../utils/accessibility';

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
  onHelp?: () => void;
  onSettings?: () => void;
  onDashboard?: () => void;
}

/**
 * Floating lotus icon that appears when dwell threshold is reached
 * Provides a gentle nudge to encourage reflection
 */
export const LotusNudge: React.FC<LotusNudgeProps> = ({
  onClick,
  visible,
  position = 'bottom-left',
  onAnimationComplete,
  onHelp,
  onSettings,
  onDashboard,
}) => {
  const [open, setOpen] = useState(false);

  const handleAnimationEnd = (e: React.AnimationEvent) => {
    if (e.animationName === 'fadeIn' && onAnimationComplete) {
      onAnimationComplete();
    }
  };

  const handleKeyDown = createKeyboardHandler(onClick);

  const handleMouseEnter = () => setOpen(true);
  const handleMouseLeave = () => setOpen(false);
  const handleFocus = () => setOpen(true);
  const handleBlur = () => setOpen(false);

  const openSettings = useCallback(() => {
    if (onSettings) {
      onSettings();
      return;
    }
    try {
      void chrome.runtime.openOptionsPage();
    } catch {
      // Fallback if openOptionsPage is not available
      void chrome.runtime.sendMessage({ type: 'openOptions' });
    }
  }, [onSettings]);

  const openDashboard = useCallback(() => {
    if (onDashboard) {
      onDashboard();
      return;
    }
    try {
      // Fallback: ask background to open in active tab
      void chrome.runtime.sendMessage({ type: 'openDashboardInActiveTab' });
    } catch {
      // no-op
    }
  }, [onDashboard]);

  const openHelp = useCallback(() => {
    if (onHelp) onHelp();
    else openSettings();
  }, [onHelp, openSettings]);

  if (!visible) return null;

  return (
    <div
      className={`reflexa-nudge-wrapper reflexa-nudge-wrapper--${position}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      data-open={open ? 'true' : 'false'}
    >
      {/* Quick circular actions shown above the pill */}
      <div
        className="reflexa-nudge-quick"
        aria-label="Quick actions"
        role="group"
        aria-hidden={!open}
      >
        <button
          type="button"
          className="reflexa-nudge-quick__btn"
          title="Open dashboard"
          aria-label="Open dashboard"
          aria-hidden={!open}
          tabIndex={open ? 0 : -1}
          onClick={(event) => {
            event.stopPropagation();
            openDashboard();
          }}
        >
          {/* Screen icon */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="3" y="4" width="18" height="12" rx="2" ry="2"></rect>
            <line x1="8" y1="20" x2="16" y2="20"></line>
          </svg>
          <span className="reflexa-nudge-quick__tooltip" role="tooltip">
            Open dashboard
          </span>
        </button>
        <button
          type="button"
          className="reflexa-nudge-quick__btn"
          title="AI Status"
          aria-label="AI Status"
          aria-hidden={!open}
          tabIndex={open ? 0 : -1}
          onClick={(event) => {
            event.stopPropagation();
            openHelp();
          }}
        >
          {/* Brain icon */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M16 7a3 3 0 0 0-5.83-1A3 3 0 0 0 6 9v6a3 3 0 0 0 3 3h1" />
            <path d="M12 7a3 3 0 0 1 5.83-1A3 3 0 0 1 20 9v6a3 3 0 0 1-3 3h-1" />
          </svg>
          <span className="reflexa-nudge-quick__tooltip" role="tooltip">
            AI Status
          </span>
        </button>
        <button
          type="button"
          className="reflexa-nudge-quick__btn"
          title="Settings"
          aria-label="Open settings"
          aria-hidden={!open}
          tabIndex={open ? 0 : -1}
          onClick={(event) => {
            event.stopPropagation();
            openSettings();
          }}
        >
          {/* Gear icon */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.26 1.3.73 1.77.47.47 1.11.73 1.77.73h.09a2 2 0 1 1 0 4h-.09a2.49 2.49 0 0 1-1.77.5z"></path>
          </svg>
          <span className="reflexa-nudge-quick__tooltip" role="tooltip">
            Settings
          </span>
        </button>
      </div>

      {/* The lotus nudge button that expands into a pill */}
      <button
        onClick={onClick}
        onKeyDown={handleKeyDown}
        onAnimationEnd={handleAnimationEnd}
        className={`reflexa-lotus-nudge reflexa-lotus-nudge--${position}`}
        role="button"
        aria-haspopup="menu"
        aria-expanded={open}
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
          <circle cx="24" cy="24" r="6" fill="#f0abfc" opacity="1" />

          {/* Petals - arranged in lotus pattern */}
          {/* Top petal */}
          <ellipse
            cx="24"
            cy="12"
            rx="5"
            ry="10"
            fill="#ffffff"
            opacity="0.95"
          />

          {/* Top-right petal */}
          <ellipse
            cx="32"
            cy="16"
            rx="5"
            ry="10"
            fill="#ffffff"
            opacity="0.95"
            transform="rotate(45 32 16)"
          />

          {/* Right petal */}
          <ellipse
            cx="36"
            cy="24"
            rx="5"
            ry="10"
            fill="#ffffff"
            opacity="0.95"
            transform="rotate(90 36 24)"
          />

          {/* Bottom-right petal */}
          <ellipse
            cx="32"
            cy="32"
            rx="5"
            ry="10"
            fill="#ffffff"
            opacity="0.95"
            transform="rotate(135 32 32)"
          />

          {/* Bottom petal */}
          <ellipse
            cx="24"
            cy="36"
            rx="5"
            ry="10"
            fill="#ffffff"
            opacity="0.95"
          />

          {/* Bottom-left petal */}
          <ellipse
            cx="16"
            cy="32"
            rx="5"
            ry="10"
            fill="#ffffff"
            opacity="0.95"
            transform="rotate(-135 16 32)"
          />

          {/* Left petal */}
          <ellipse
            cx="12"
            cy="24"
            rx="5"
            ry="10"
            fill="#ffffff"
            opacity="0.95"
            transform="rotate(-90 12 24)"
          />

          {/* Top-left petal */}
          <ellipse
            cx="16"
            cy="16"
            rx="5"
            ry="10"
            fill="#ffffff"
            opacity="0.95"
            transform="rotate(-45 16 16)"
          />
        </svg>
        <span className="reflexa-lotus-nudge__label">Reflect</span>
      </button>
    </div>
  );
};
