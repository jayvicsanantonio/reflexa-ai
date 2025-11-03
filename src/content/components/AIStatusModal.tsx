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
      className="reflexa-error-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reflexa-ai-status-title"
    >
      <div className="reflexa-error-modal__backdrop" onClick={onClose} />
      <div
        ref={contentRef}
        className="reflexa-modal-animate"
        onKeyDown={handleKeyDown}
        style={{
          width: 'min(720px, 92vw)',
          maxHeight: 'min(84vh, 760px)',
          background: '#ffffff',
          color: '#0f172a',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          borderRadius: 24,
          boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <ModalHeader onClose={onClose} />

        <div style={{ padding: '16px 20px', overflow: 'auto' }}>
          <ExperimentalModeBanner
            isEnabled={settings?.experimentalMode ?? false}
          />

          <CapabilityGrid capabilities={capabilities} />

          <SetupGuideSection copiedKey={copiedKey} onCopyFlag={copyFlag} />
        </div>

        <div
          style={{
            padding: '12px 20px 16px 20px',
            display: 'flex',
            justifyContent: 'flex-end',
            borderTop: '1px solid rgba(15, 23, 42, 0.06)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="reflexa-btn reflexa-btn--primary"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
