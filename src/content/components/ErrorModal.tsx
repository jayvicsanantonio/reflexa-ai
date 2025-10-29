import React, { useEffect, useRef } from 'react';
import { trapFocus, announceToScreenReader } from '../../utils/accessibility';
import '../styles.css';

export interface ErrorModalProps {
  title: string;
  message: string;
  type: 'ai-unavailable' | 'ai-timeout' | 'content-truncated' | 'storage-full';
  onClose: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

/**
 * Error modal component for displaying error messages and fallback options
 * Provides accessible modal dialogs for various error scenarios
 */
export const ErrorModal: React.FC<ErrorModalProps> = ({
  title,
  message,
  type,
  onClose,
  onAction,
  actionLabel,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus first button on mount and announce to screen readers
  useEffect(() => {
    const cleanupAnnouncement = announceToScreenReader(
      `Error: ${title}. ${message}`,
      'assertive'
    );

    const timer = setTimeout(() => {
      firstButtonRef.current?.focus();
    }, 100);

    return () => {
      clearTimeout(timer);
      cleanupAnnouncement();
    };
  }, [title, message]);

  // Keyboard shortcuts: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Focus trap
  useEffect(() => {
    if (!modalRef.current) return;

    const cleanup = trapFocus(modalRef.current, onClose);
    return cleanup;
  }, [onClose]);

  // Get icon based on error type
  const getIcon = () => {
    switch (type) {
      case 'ai-unavailable':
        return '⚠️';
      case 'ai-timeout':
        return '⏱️';
      case 'content-truncated':
        return '📄';
      case 'storage-full':
        return '💾';
      default:
        return '⚠️';
    }
  };

  return (
    <div
      className="reflexa-error-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="error-modal-title"
      data-testid="error-modal"
    >
      <div className="reflexa-error-modal__backdrop" onClick={onClose} />

      <div ref={modalRef} className="reflexa-error-modal__content">
        <div className="reflexa-error-modal__icon">{getIcon()}</div>

        <h2 id="error-modal-title" className="reflexa-error-modal__title">
          {title}
        </h2>

        <p className="reflexa-error-modal__message">{message}</p>

        <div className="reflexa-error-modal__actions">
          {onAction && actionLabel && (
            <button
              ref={firstButtonRef}
              type="button"
              className="reflexa-error-modal__button reflexa-error-modal__button--primary"
              onClick={onAction}
              data-testid="error-modal-action"
            >
              {actionLabel}
            </button>
          )}
          <button
            ref={!onAction ? firstButtonRef : undefined}
            type="button"
            className="reflexa-error-modal__button reflexa-error-modal__button--secondary"
            onClick={onClose}
            data-testid="error-modal-close"
          >
            {onAction ? 'Cancel' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
