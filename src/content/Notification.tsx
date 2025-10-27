import React, { useEffect } from 'react';
import { announceToScreenReader } from '../utils/accessibility';
import './styles.css';

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

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div
      className={`reflexa-notification reflexa-notification--${type}`}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      data-testid="notification"
    >
      <div className="reflexa-notification__icon">{getIcon()}</div>

      <div className="reflexa-notification__content">
        <h3 className="reflexa-notification__title">{title}</h3>
        <p className="reflexa-notification__message">{message}</p>
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
