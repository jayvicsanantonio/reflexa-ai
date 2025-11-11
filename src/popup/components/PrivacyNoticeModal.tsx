import React from 'react';
import { PRIVACY_NOTICE } from '../../constants';
import { useFocusTrap } from '../../utils/hooks';

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Privacy notice modal shown on first launch
 */
export const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);

  useFocusTrap(modalRef as React.RefObject<HTMLElement>, isOpen);

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
              aria-hidden="true"
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
