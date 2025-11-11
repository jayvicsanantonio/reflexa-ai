/**
 * Privacy notice modal component
 * Shown on first launch
 */

import React, { useEffect, useRef } from 'react';
import { PRIVACY_NOTICE } from '../../constants';

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Privacy notice modal with focus trap
 */
export const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap for accessibility
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-notice-title"
    >
      <div
        ref={modalRef}
        className="mx-6 max-w-sm rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="bg-zen-100 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
            <svg
              className="text-zen-600 h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2
              id="privacy-notice-title"
              className="font-display text-calm-900 mb-2 text-lg font-semibold"
            >
              Your Privacy Matters
            </h2>
            <p className="text-calm-700 mb-4 text-sm leading-relaxed">
              {PRIVACY_NOTICE}
            </p>
            <p className="text-calm-600 text-xs">
              All processing happens on your device. No data is ever sent to
              external servers.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="from-zen-500 to-zen-600 hover:from-zen-600 hover:to-zen-700 focus-visible:outline-zen-500 w-full rounded-lg bg-linear-to-r px-4 py-2.5 text-sm font-semibold text-white transition-all focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
