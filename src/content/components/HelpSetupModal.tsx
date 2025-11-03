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
      className="fixed inset-0 z-[2147483646] flex animate-[fadeIn_0.3s_ease-in-out] items-center justify-center font-sans motion-reduce:animate-[fadeIn_0.15s_ease-in-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reflexa-help-title"
    >
      <div
        className="-webkit-backdrop-blur-[6px] absolute inset-0 bg-black/50 backdrop-blur-[6px]"
        onClick={onClose}
      />
      <div
        ref={contentRef}
        className="relative z-[1] flex max-h-[80vh] min-h-0 w-[92vw] animate-[reflexaPopIn_220ms_cubic-bezier(0.2,0.8,0.2,1)] flex-col overflow-hidden rounded-3xl border border-white/6 bg-slate-900 text-white shadow-[0_30px_80px_rgba(0,0,0,0.6)] min-[680px]:w-[680px] min-[720px]:max-h-[720px]"
        onKeyDown={handleKeyDown}
      >
        <ModalHeader onClose={onClose} />

        {/* Accent bar */}
        <div className="h-0.5 bg-gradient-to-r from-sky-500 to-sky-600" />

        <div className="overflow-auto px-5 py-4">
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
