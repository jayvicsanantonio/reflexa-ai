import React, { useEffect, useRef, useState } from 'react';
import { createKeyboardHandler, trapFocus } from '../../utils/accessibility';
import type { Settings, AICapabilities } from '../../types';
import { TIMING, COMMON_LANGUAGES } from '../../constants';

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

  const Switch: React.FC<{
    checked: boolean;
    onChange: (val: boolean) => void;
    label: string;
    disabled?: boolean;
  }> = ({ checked, onChange, label, disabled = false }) => {
    const onKey = (e: React.KeyboardEvent) => {
      if (disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onChange(!checked);
      }
    };
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-disabled={disabled}
        onKeyDown={onKey}
        onClick={() => {
          if (disabled) return;
          onChange(!checked);
        }}
        className="reflexa-switch"
        style={{
          background: checked ? 'rgba(59,130,246,0.8)' : 'rgba(15,23,42,0.06)',
          border: '1px solid rgba(15,23,42,0.15)',
        }}
        tabIndex={disabled ? -1 : 0}
      >
        <span aria-hidden className="reflexa-switch__thumb" />
      </button>
    );
  };

  const Row: React.FC<{
    title: string;
    desc: React.ReactNode;
    icon: React.ReactNode;
    trailing?: React.ReactNode;
  }> = ({ title, desc, icon, trailing }) => (
    <div className="reflexa-settings-row">
      <div className="reflexa-settings-row__meta">
        <span
          className="reflexa-settings-row__icon"
          aria-hidden
          style={{
            background: 'rgba(59,130,246,0.12)',
            color: '#60a5fa',
            border: '1px solid rgba(30,64,175,0.18)',
          }}
        >
          {icon}
        </span>
        <span>
          <div
            className="reflexa-settings-row__title"
            style={{ color: '#0f172a', fontWeight: 700 }}
          >
            {title}
          </div>
          <div
            className="reflexa-settings-row__desc"
            style={{ color: '#334155', fontSize: 13 }}
          >
            {desc}
          </div>
        </span>
      </div>
      <div>{trailing}</div>
    </div>
  );

  const InfoHint: React.FC<{ message: string }> = ({ message }) => (
    <span className="reflexa-info">
      <span
        className="reflexa-info__icon"
        aria-label={message}
        tabIndex={0}
        role="img"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span className="reflexa-info__tooltip" role="tooltip">
          {message}
        </span>
      </span>
    </span>
  );

  const Select: React.FC<{
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (val: string) => void;
    disabled?: boolean;
  }> = ({ label, value, options, onChange, disabled = false }) => (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: '#f1f5f9',
          border: '1px solid rgba(15,23,42,0.15)',
          color: '#0f172a',
          padding: '8px 10px',
          borderRadius: 10,
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );

  const Range: React.FC<{
    label: string;
    min: number;
    max: number;
    step?: number;
    value: number;
    unit?: string;
    onChange: (val: number) => void;
    disabled?: boolean;
  }> = ({
    label,
    min,
    max,
    step = 1,
    value,
    unit = '',
    onChange,
    disabled = false,
  }) => (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <span className="sr-only">{label}</span>
      <input
        type="range"
        aria-label={label}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span style={{ color: '#64748b', fontSize: 12 }}>
        {value}
        {unit}
      </span>
    </label>
  );

  const IconSound = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M19 5a7 7 0 0 1 0 14"></path>
    </svg>
  );

  const IconMotion = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12h6"></path>
      <path d="M7 12a5 5 0 1 0 10 0 5 5 0 0 0-10 0Z"></path>
      <path d="M22 12h-6"></path>
    </svg>
  );

  const IconProofread = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 19.5V5a2 2 0 0 1 2-2h8l6 6v10.5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19.5Z"></path>
      <path d="M14 3v6h6"></path>
      <path d="M9 14l2 2 4-4"></path>
    </svg>
  );

  const IconTranslate = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 5h7"></path>
      <path d="M9 3v2c0 6 7 10 7 10"></path>
      <path d="M5 20l7-7"></path>
      <path d="M12 12c-1.5 2-4 5-7 8"></path>
      <path d="M16 17h6"></path>
      <path d="M19 14v6"></path>
    </svg>
  );

  const IconBeaker = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 2h12"></path>
      <path d="M14 2v6.343a4 4 0 0 0 .879 2.485l4.242 5.657A3 3 0 0 1 16.758 20H7.242a3 3 0 0 1-2.363-2.515l4.242-5.657A4 4 0 0 0 10 8.343V2"></path>
    </svg>
  );

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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 20px 8px 20px',
            borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              aria-hidden
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                background: 'rgba(59,130,246,0.12)',
                color: '#60a5fa',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.26 1.3.73 1.77.47.47 1.11.73 1.77.73h.09a2 2 0 1 1 0 4h-.09a2.49 2.49 0 0 1-1.77.5z"></path>
              </svg>
            </span>
            <div>
              <div
                id="reflexa-quick-settings-title"
                style={{ margin: 0, fontSize: 18, fontWeight: 800 }}
              >
                Settings
              </div>
              <div style={{ color: '#334155', fontSize: 12 }}>
                Preferences & Features
              </div>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="reflexa-modal__close"
            style={{ borderColor: 'rgba(15,23,42,0.15)', color: '#0f172a' }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '8px 20px', overflow: 'auto' }}>
          {!settings ? (
            <div style={{ color: 'var(--color-calm-200)', padding: '16px 0' }}>
              Loading…
            </div>
          ) : (
            <>
              <div className="reflexa-settings-section">
                <div className="reflexa-settings-section__title">Behavior</div>
                <Row
                  title="Dwell threshold"
                  desc="How long to read before seeing the nudge"
                  icon={
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  }
                  trailing={
                    <Range
                      label="Dwell threshold"
                      min={TIMING.DWELL_MIN}
                      max={TIMING.DWELL_MAX}
                      step={10}
                      value={settings.dwellThreshold}
                      unit="s"
                      onChange={(v) => void updateSetting('dwellThreshold', v)}
                    />
                  }
                />
              </div>
              <div className="reflexa-settings-section">
                <div className="reflexa-settings-section__title">
                  Experience
                </div>
                <Row
                  title="Enable sound"
                  desc="Play calming audio during reflection sessions"
                  icon={IconSound}
                  trailing={
                    <Switch
                      checked={settings.enableSound}
                      onChange={(v) => void updateSetting('enableSound', v)}
                      label="Enable sound"
                    />
                  }
                />
                <Row
                  title="Reduce motion"
                  desc="Disable animations like the breathing orb"
                  icon={IconMotion}
                  trailing={
                    <Switch
                      checked={settings.reduceMotion}
                      onChange={(v) => void updateSetting('reduceMotion', v)}
                      label="Reduce motion"
                    />
                  }
                />
              </div>
              <div className="reflexa-settings-section">
                <div className="reflexa-settings-section__title">
                  AI Features
                </div>
                <Row
                  title="Enable proofreading"
                  desc={
                    <>
                      Show an AI proofreading button in Reflect Mode
                      {capabilities && !capabilities.proofreader && (
                        <InfoHint message="Requires Proofreader API" />
                      )}
                    </>
                  }
                  icon={IconProofread}
                  trailing={
                    <Switch
                      checked={settings.enableProofreading}
                      onChange={(v) =>
                        void updateSetting('enableProofreading', v)
                      }
                      disabled={
                        capabilities ? !capabilities.proofreader : false
                      }
                      label="Enable proofreading"
                    />
                  }
                />
                <Row
                  title="Enable translation"
                  desc={
                    <>
                      Allow translating summaries and reflections
                      {capabilities && !capabilities.translator && (
                        <InfoHint message="Requires Translator API" />
                      )}
                    </>
                  }
                  icon={IconTranslate}
                  trailing={
                    <Switch
                      checked={settings.enableTranslation}
                      onChange={(v) =>
                        void updateSetting('enableTranslation', v)
                      }
                      disabled={capabilities ? !capabilities.translator : false}
                      label="Enable translation"
                    />
                  }
                />
                <Row
                  title="Preferred language"
                  desc={
                    <>
                      Default target for translations
                      {!settings.enableTranslation && (
                        <InfoHint message="Enable Translation to use" />
                      )}
                    </>
                  }
                  icon={IconTranslate}
                  trailing={
                    <Select
                      label="Preferred translation language"
                      value={settings.preferredTranslationLanguage}
                      onChange={(v) =>
                        void updateSetting('preferredTranslationLanguage', v)
                      }
                      disabled={!settings.enableTranslation}
                      options={COMMON_LANGUAGES.map((l) => ({
                        value: l.code,
                        label: l.name,
                      }))}
                    />
                  }
                />
                <Row
                  title="Auto-detect language"
                  desc={
                    <>
                      Detect web page language automatically
                      {!settings.enableTranslation && (
                        <InfoHint message="Enable Translation to use" />
                      )}
                    </>
                  }
                  icon={IconTranslate}
                  trailing={
                    <Switch
                      checked={settings.autoDetectLanguage}
                      onChange={(v) =>
                        void updateSetting('autoDetectLanguage', v)
                      }
                      disabled={!settings.enableTranslation}
                      label="Auto-detect language"
                    />
                  }
                />
                <Row
                  title="Summary format"
                  desc="Default style for summaries"
                  icon={
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M4 6h16M4 12h10M4 18h7" />
                    </svg>
                  }
                  trailing={
                    <Select
                      label="Default summary format"
                      value={settings.defaultSummaryFormat}
                      onChange={(v) =>
                        void updateSetting(
                          'defaultSummaryFormat',
                          v as Settings['defaultSummaryFormat']
                        )
                      }
                      options={[
                        { value: 'bullets', label: 'Bullets' },
                        { value: 'paragraph', label: 'Paragraph' },
                        {
                          value: 'headline-bullets',
                          label: 'Headline + Bullets',
                        },
                      ]}
                    />
                  }
                />
                <Row
                  title="Experimental mode"
                  desc="Try beta AI features when available"
                  icon={IconBeaker}
                  trailing={
                    <Switch
                      checked={settings.experimentalMode}
                      onChange={(v) =>
                        void updateSetting('experimentalMode', v)
                      }
                      label="Experimental mode"
                    />
                  }
                />
              </div>
              <div className="reflexa-settings-section">
                <div className="reflexa-settings-section__title">Privacy</div>
                <Row
                  title="Storage mode"
                  desc="Where reflections are stored"
                  icon={
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <rect x="3" y="4" width="18" height="14" rx="2" />
                      <line x1="8" y1="8" x2="16" y2="8" />
                    </svg>
                  }
                  trailing={
                    <div
                      role="group"
                      aria-label="Storage mode"
                      style={{ display: 'inline-flex', gap: 6 }}
                    >
                      <button
                        type="button"
                        aria-pressed={settings.privacyMode === 'local'}
                        onClick={() =>
                          void updateSetting('privacyMode', 'local')
                        }
                        className="reflexa-btn reflexa-btn--ghost"
                        style={{
                          border: '1px solid rgba(15,23,42,0.15)',
                          color: '#0f172a',
                          background:
                            settings.privacyMode === 'local'
                              ? '#e2e8f0'
                              : '#ffffff',
                        }}
                      >
                        Local
                      </button>
                      <button
                        type="button"
                        aria-pressed={settings.privacyMode === 'sync'}
                        onClick={() =>
                          void updateSetting('privacyMode', 'sync')
                        }
                        className="reflexa-btn reflexa-btn--ghost"
                        style={{
                          border: '1px solid rgba(15,23,42,0.15)',
                          color: '#0f172a',
                          background:
                            settings.privacyMode === 'sync'
                              ? '#e2e8f0'
                              : '#ffffff',
                        }}
                      >
                        Sync
                      </button>
                    </div>
                  }
                />
              </div>
              <div className="reflexa-settings-section">
                <div className="reflexa-settings-section__title">Voice</div>
                <Row
                  title="Enable voice input"
                  desc="Dictate reflections instead of typing"
                  icon={
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M12 1v11a3 3 0 0 1-6 0V8"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                  }
                  trailing={
                    <Switch
                      checked={Boolean(settings.voiceInputEnabled)}
                      onChange={(v) =>
                        void updateSetting('voiceInputEnabled', v)
                      }
                      label="Enable voice input"
                    />
                  }
                />
                <Row
                  title="Voice language"
                  desc={
                    <>
                      Language used for speech recognition
                      {!settings.voiceInputEnabled && (
                        <InfoHint message="Enable Voice input to use" />
                      )}
                    </>
                  }
                  icon={IconTranslate}
                  trailing={
                    <Select
                      label="Voice language"
                      value={settings.voiceLanguage ?? ''}
                      onChange={(v) =>
                        void updateSetting('voiceLanguage', v || undefined)
                      }
                      disabled={!settings.voiceInputEnabled}
                      options={[{ value: '', label: 'Auto' }].concat(
                        COMMON_LANGUAGES.map((l) => ({
                          value: l.code,
                          label: l.name,
                        }))
                      )}
                    />
                  }
                />
                <Row
                  title="Auto-stop delay"
                  desc={
                    <>
                      How long to wait after silence
                      {!settings.voiceInputEnabled && (
                        <InfoHint message="Enable Voice input to use" />
                      )}
                    </>
                  }
                  icon={IconSound}
                  trailing={
                    <Range
                      label="Voice auto-stop delay"
                      min={0}
                      max={60}
                      step={10}
                      value={Math.round(
                        (settings.voiceAutoStopDelay ?? 10000) / 1000
                      )}
                      unit="s"
                      disabled={!settings.voiceInputEnabled}
                      onChange={(v) =>
                        void updateSetting('voiceAutoStopDelay', v * 1000)
                      }
                    />
                  }
                />
              </div>
            </>
          )}
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
