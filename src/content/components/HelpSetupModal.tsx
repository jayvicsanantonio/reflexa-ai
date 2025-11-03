import React, { useEffect, useRef } from 'react';
import { createKeyboardHandler, trapFocus } from '../../utils/accessibility';
import {
  ModalHeader,
  ModalFooter,
  BaseAISection,
  CoreAPIsSection,
  WritingAssistanceSection,
  TranslationSection,
  WarningMessage,
} from './HelpSetupModal/components';

interface HelpSetupModalProps {
  onClose: () => void;
}

export const HelpSetupModal: React.FC<HelpSetupModalProps> = ({ onClose }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;
    const cleanup = trapFocus(contentRef.current, onClose);
    return cleanup;
  }, [onClose]);

  const handleKeyDown = createKeyboardHandler(onClose);

  return (
    <div
      className="reflexa-error-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reflexa-help-title"
    >
      <div className="reflexa-error-modal__backdrop" onClick={onClose} />
      <div
        ref={contentRef}
        className="reflexa-modal reflexa-modal--lg reflexa-modal-animate"
        onKeyDown={handleKeyDown}
      >
        <ModalHeader onClose={onClose} />

        {/* Accent bar */}
        <div className="reflexa-modal__accent" />

        <div className="reflexa-modal__body">
          <p style={{ color: 'var(--color-calm-200)', margin: '0 0 12px 0' }}>
            Reflexa uses Chrome's on-device AI (Gemini Nano). Enable the flags
            below, then restart Chrome.
          </p>

          <BaseAISection />
          <CoreAPIsSection />
          <WritingAssistanceSection />
          <TranslationSection />

          <WarningMessage />
        </div>

        <ModalFooter onClose={onClose} />
      </div>
    </div>
  );
};
