import React, { useEffect, useRef } from 'react';
import { trapFocus, announceToScreenReader } from '../../utils/accessibility';

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
      className="fixed inset-0 z-[2147483646] flex animate-[fadeIn_0.3s_ease-in-out] items-center justify-center font-sans motion-reduce:animate-[fadeIn_0.15s_ease-in-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="error-modal-title"
      data-testid="error-modal"
    >
      <div
        className="-webkit-backdrop-blur-[6px] absolute inset-0 bg-black/50 backdrop-blur-[6px]"
        onClick={onClose}
      />

      <div
        ref={modalRef}
        className="relative flex w-[90%] max-w-[480px] flex-col items-center gap-5 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-700/98 to-slate-600/98 p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.4)] sm:p-6"
      >
        <div className="mb-2 text-5xl leading-none">{getIcon()}</div>

        <h2
          id="error-modal-title"
          className="font-display m-0 text-2xl font-semibold tracking-tight text-(--color-zen-100) sm:text-xl"
        >
          {title}
        </h2>

        <p className="m-0 text-base leading-relaxed text-(--color-calm-200) sm:text-sm">
          {message}
        </p>

        <div className="mt-3 flex w-full flex-col gap-3 sm:flex-col">
          {onAction && actionLabel && (
            <button
              ref={firstButtonRef}
              type="button"
              className="flex-1 cursor-pointer rounded-2xl border-none bg-gradient-to-br from-sky-500 to-sky-700 px-6 py-3 font-sans text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(14,165,233,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:from-sky-400 hover:to-sky-500 hover:shadow-[0_4px_12px_rgba(14,165,233,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-zen-400) active:translate-y-0 motion-reduce:hover:translate-y-0 sm:w-full"
              onClick={onAction}
              data-testid="error-modal-action"
            >
              {actionLabel}
            </button>
          )}
          <button
            ref={!onAction ? firstButtonRef : undefined}
            type="button"
            className="flex-1 cursor-pointer rounded-2xl border border-none border-white/20 bg-white/8 px-6 py-3 font-sans text-[15px] font-semibold text-(--color-calm-200) transition-all duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-zen-400) active:translate-y-0 motion-reduce:hover:translate-y-0 sm:w-full"
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
