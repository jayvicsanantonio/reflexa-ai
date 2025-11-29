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
    const iconProps = {
      width: 24,
      height: 24,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
      'aria-hidden': true,
    };

    switch (type) {
      case 'ai-unavailable':
        return (
          <svg {...iconProps}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case 'ai-timeout':
        return (
          <svg {...iconProps}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case 'content-truncated':
        return (
          <svg {...iconProps}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        );
      case 'storage-full':
        return (
          <svg {...iconProps}>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        );
      default:
        return (
          <svg {...iconProps}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
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
