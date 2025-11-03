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
      '[style*="overflow"]'
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
          '[style*="overflow"]'
        ) as HTMLDivElement | null;
        if (currentBody && prevScroll >= 0) {
          currentBody.scrollTop = prevScroll;
        }
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[2147483646] flex animate-[fadeIn_0.3s_ease-in-out] items-center justify-center font-sans motion-reduce:animate-[fadeIn_0.15s_ease-in-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reflexa-quick-settings-title"
    >
      <div
        className="-webkit-backdrop-blur-[6px] absolute inset-0 bg-black/50 backdrop-blur-[6px]"
        onClick={onClose}
      />
      <div
        ref={contentRef}
        onKeyDown={handleKeyDown}
        className="relative z-[1] flex max-h-[84vh] min-h-0 w-[92vw] animate-[reflexaPopIn_220ms_cubic-bezier(0.2,0.8,0.2,1)] flex-col overflow-hidden rounded-3xl border border-slate-900/8 bg-white text-slate-900 shadow-[0_30px_80px_rgba(0,0,0,0.25)] min-[640px]:w-[640px] min-[840px]:max-h-[760px]"
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
