import React, { useEffect } from 'react';
import { announceToScreenReader } from '../../utils/accessibility';
import '../styles.css';

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
      className={`reflexa-notification reflexa-notification--${type}`}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      data-testid="notification"
    >
      <div className="reflexa-notification__icon" aria-hidden>
        {getIcon()}
      </div>

      <div className="reflexa-notification__content">
        <h3 className="reflexa-notification__title">{title}</h3>
        {message ? (
          <p className="reflexa-notification__message">{message}</p>
        ) : null}
      </div>

      <button
        type="button"
        className="reflexa-notification__close"
        onClick={onClose}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};
