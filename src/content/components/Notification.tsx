import React, { useEffect } from 'react';
import { announceToScreenReader } from '../../utils/accessibility';

export interface NotificationProps {
  title: string;
  message: string;
  type: 'warning' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

/**
 * Notification toast component for displaying temporary messages
 * Auto-dismisses after specified duration
 */
export const Notification: React.FC<NotificationProps> = ({
  title,
  message,
  type,
  duration = 5000,
  onClose,
}) => {
  // Auto-dismiss after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Announce to screen readers
  useEffect(() => {
    const priority = type === 'error' ? 'assertive' : 'polite';
    const cleanupAnnouncement = announceToScreenReader(
      `${title}. ${message}`,
      priority
    );

    return cleanupAnnouncement;
  }, [title, message, type]);

  // Icon styles based on type
  const iconStyles = {
    info: 'bg-blue-500/12 text-blue-700 border-blue-700/18',
    warning: 'bg-yellow-500/12 text-yellow-700 border-yellow-700/18',
    error: 'bg-red-500/12 text-red-600 border-red-600/18',
  };

  // Get elegant SVG icon based on type (decorative)
  const getIcon = () => {
    if (type === 'error') {
      return (
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
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    }
    if (type === 'warning') {
      return (
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
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    }
    // info (default): check-circle for success-like info
    return (
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
        <path d="M9 12l2 2 4-4" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    );
  };

  return (
    <div
      className="fixed top-5 right-5 z-[2147483647] flex max-w-[420px] animate-[toastIn_180ms_ease-out] items-center gap-3 rounded-2xl border border-slate-900/8 bg-white/85 px-3.5 py-3 font-sans text-slate-900 shadow-[0_10px_30px_rgba(2,8,23,0.15)] backdrop-blur-[12px] backdrop-saturate-[180%] motion-reduce:animate-[fadeIn_0.15s_ease-in-out] sm:top-4 sm:right-4 sm:left-4 sm:max-w-none"
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      data-testid="notification"
    >
      <div
        className={`inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border ${iconStyles[type]}`}
        aria-hidden
      >
        {getIcon()}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h3 className="m-0 text-sm font-bold text-slate-900">{title}</h3>
        {message ? (
          <p className="m-0 text-xs leading-normal text-slate-600">{message}</p>
        ) : null}
      </div>

      <button
        type="button"
        className="inline-flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-900/8 bg-transparent text-base leading-none text-slate-600 transition-all duration-150 hover:bg-slate-900/4 hover:text-slate-900 focus-visible:rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        onClick={onClose}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};
