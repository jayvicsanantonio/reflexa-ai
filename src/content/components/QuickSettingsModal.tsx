import React, { useEffect, useRef, useState } from 'react';
import { createKeyboardHandler, trapFocus } from '../../utils/accessibility';
import type { Settings, AICapabilities } from '../../types';
import {
  ModalHeader,
  ModalFooter,
  BehaviorSection,
  ExperienceSection,
  AIFeaturesSection,
  PrivacySection,
  VoiceSection,
} from './QuickSettingsModal/index';

interface QuickSettingsModalProps {
  onClose: () => void;
}

export const QuickSettingsModal: React.FC<QuickSettingsModalProps> = ({
  onClose,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [, setSavingKey] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<AICapabilities | null>(null);

  useEffect(() => {
    if (!contentRef.current) return;
    const cleanup = trapFocus(contentRef.current, onClose);
    return cleanup;
  }, [onClose]);

  const handleKeyDown = createKeyboardHandler(onClose);

  useEffect(() => {
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
    // Also load AI capabilities to inform disabled/hints for dependent features
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
  }, []);

  const updateSetting = async <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    if (!settings) return;
    // Preserve scroll position during update to avoid jumps
    const bodyEl = contentRef.current?.querySelector(
      '.reflexa-modal__body'
    ) as HTMLDivElement | null;
    const prevScroll = bodyEl?.scrollTop ?? 0;

    const next = { ...settings, [key]: value };
    setSettings(next);
    setSavingKey(String(key));
    try {
      await chrome.runtime.sendMessage({
        type: 'updateSettings',
        payload: next,
      });
    } finally {
      setSavingKey(null);
      // Restore scroll position on next frame
      requestAnimationFrame(() => {
        const currentBody = contentRef.current?.querySelector(
          '.reflexa-modal__body'
        ) as HTMLDivElement | null;
        if (currentBody && prevScroll >= 0) {
          currentBody.scrollTop = prevScroll;
        }
      });
    }
  };

  return (
    <div
      className="reflexa-error-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reflexa-quick-settings-title"
    >
      <div className="reflexa-error-modal__backdrop" onClick={onClose} />
      <div
        ref={contentRef}
        onKeyDown={handleKeyDown}
        className="reflexa-modal-animate"
        style={{
          width: 'min(640px, 92vw)',
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

        <div style={{ padding: '8px 20px', overflow: 'auto' }}>
          {!settings ? (
            <div style={{ color: 'var(--color-calm-200)', padding: '16px 0' }}>
              Loading…
            </div>
          ) : (
            <>
              <BehaviorSection
                settings={settings}
                updateSetting={updateSetting}
              />
              <ExperienceSection
                settings={settings}
                updateSetting={updateSetting}
              />
              <AIFeaturesSection
                settings={settings}
                capabilities={capabilities}
                updateSetting={updateSetting}
              />
              <PrivacySection
                settings={settings}
                updateSetting={updateSetting}
              />
              <VoiceSection settings={settings} updateSetting={updateSetting} />
            </>
          )}
        </div>

        <ModalFooter onClose={onClose} />
      </div>
    </div>
  );
};
