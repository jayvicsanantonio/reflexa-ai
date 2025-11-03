import React, { useEffect, useRef, useState } from 'react';
import { createKeyboardHandler, trapFocus } from '../../utils/accessibility';
import type { AICapabilities, Settings } from '../../types';
import {
  ExperimentalModeBanner,
  CapabilityGrid,
  SetupGuideSection,
  ModalHeader,
} from './AIStatusModal/index';

interface AIStatusModalProps {
  onClose: () => void;
}

export const AIStatusModal: React.FC<AIStatusModalProps> = ({ onClose }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [capabilities, setCapabilities] = useState<AICapabilities | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!contentRef.current) return;
    const cleanup = trapFocus(contentRef.current, onClose);
    return cleanup;
  }, [onClose]);

  const handleKeyDown = createKeyboardHandler(onClose);

  useEffect(() => {
    void chrome.runtime
      .sendMessage({ type: 'getCapabilities' })
      .then((resp: unknown) => {
        const r = resp as { success?: boolean; data?: unknown } | undefined;
        if (r?.success && r.data) {
          setCapabilities(r.data as AICapabilities);
        }
      })
      .catch(() => {
        // no-op
      });
    void chrome.runtime
      .sendMessage({ type: 'getSettings' })
      .then((resp: unknown) => {
        const r = resp as { success?: boolean; data?: unknown } | undefined;
        if (r?.success && r.data) {
          setSettings(r.data as Settings);
        }
      })
      .catch(() => {
        // no-op
      });
  }, []);

  // Refresh button removed per design; status updates on reopen

  const copyFlag = async (flagUrl: string) => {
    try {
      await navigator.clipboard.writeText(flagUrl);
      setCopiedKey(flagUrl);
      setTimeout(() => setCopiedKey(null), 1200);
    } catch {
      setCopiedKey(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[2147483646] flex animate-[fadeIn_0.3s_ease-in-out] items-center justify-center font-sans motion-reduce:animate-[fadeIn_0.15s_ease-in-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reflexa-ai-status-title"
    >
      <div
        className="-webkit-backdrop-blur-[6px] absolute inset-0 bg-black/50 backdrop-blur-[6px]"
        onClick={onClose}
      />
      <div
        ref={contentRef}
        className="relative z-[1] flex max-h-[84vh] min-h-0 w-[92vw] animate-[reflexaPopIn_220ms_cubic-bezier(0.2,0.8,0.2,1)] flex-col overflow-hidden rounded-3xl border border-slate-900/8 bg-white text-slate-900 shadow-[0_30px_80px_rgba(0,0,0,0.25)] min-[720px]:w-[720px] min-[840px]:max-h-[760px]"
        onKeyDown={handleKeyDown}
      >
        <ModalHeader onClose={onClose} />

        <div style={{ padding: '16px 20px', overflow: 'auto' }}>
          <ExperimentalModeBanner
            isEnabled={settings?.experimentalMode ?? false}
          />

          <CapabilityGrid capabilities={capabilities} />

          <SetupGuideSection copiedKey={copiedKey} onCopyFlag={copyFlag} />
        </div>

        <div className="flex justify-end border-t border-t-slate-900/6 px-5 py-3 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full border-none bg-gradient-to-r from-sky-500 to-sky-600 px-3.5 py-2.5 font-sans text-sm font-bold text-white transition-all duration-150 hover:from-sky-400 hover:to-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
