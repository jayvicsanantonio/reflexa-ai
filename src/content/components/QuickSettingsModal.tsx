import React, { useEffect, useRef, useState } from 'react';
import { createKeyboardHandler, trapFocus } from '../../utils/accessibility';
import type { Settings } from '../../types';
import { TIMING, COMMON_LANGUAGES } from '../../constants';

interface QuickSettingsModalProps {
  onClose: () => void;
}

export const QuickSettingsModal: React.FC<QuickSettingsModalProps> = ({
  onClose,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

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
  }, []);

  const updateSetting = async <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    if (!settings) return;
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
    }
  };

  const Switch: React.FC<{
    checked: boolean;
    onChange: (val: boolean) => void;
    label: string;
  }> = ({ checked, onChange, label }) => {
    const onKey = (e: React.KeyboardEvent) => {
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
        onKeyDown={onKey}
        onClick={() => onChange(!checked)}
        className="reflexa-switch"
      >
        <span aria-hidden className="reflexa-switch__thumb" />
      </button>
    );
  };

  const Row: React.FC<{
    title: string;
    desc: string;
    icon: React.ReactNode;
    trailing?: React.ReactNode;
  }> = ({ title, desc, icon, trailing }) => (
    <div className="reflexa-settings-row">
      <div className="reflexa-settings-row__meta">
        <span className="reflexa-settings-row__icon" aria-hidden>
          {icon}
        </span>
        <span>
          <div className="reflexa-settings-row__title">{title}</div>
          <div className="reflexa-settings-row__desc">{desc}</div>
        </span>
      </div>
      <div>{trailing}</div>
    </div>
  );

  const Select: React.FC<{
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (val: string) => void;
  }> = ({ label, value, options, onChange }) => (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: '#fff',
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
  }> = ({ label, min, max, step = 1, value, unit = '', onChange }) => (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <span className="sr-only">{label}</span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span style={{ color: 'var(--color-calm-200)', fontSize: 12 }}>
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
        className="reflexa-modal reflexa-modal--md reflexa-modal-animate"
      >
        <div className="reflexa-modal__header">
          <h2
            id="reflexa-quick-settings-title"
            className="reflexa-modal__title"
          >
            Settings
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="reflexa-modal__close"
          >
            ×
          </button>
        </div>

        <div className="reflexa-modal__accent" />

        <div className="reflexa-modal__body" style={{ paddingTop: 8 }}>
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
                  desc="Show an AI proofreading button in Reflect Mode"
                  icon={IconProofread}
                  trailing={
                    <Switch
                      checked={settings.enableProofreading}
                      onChange={(v) =>
                        void updateSetting('enableProofreading', v)
                      }
                      label="Enable proofreading"
                    />
                  }
                />
                <Row
                  title="Enable translation"
                  desc="Allow translating summaries and reflections"
                  icon={IconTranslate}
                  trailing={
                    <Switch
                      checked={settings.enableTranslation}
                      onChange={(v) =>
                        void updateSetting('enableTranslation', v)
                      }
                      label="Enable translation"
                    />
                  }
                />
                {settings.enableTranslation && (
                  <>
                    <Row
                      title="Preferred language"
                      desc="Default target for translations"
                      icon={IconTranslate}
                      trailing={
                        <Select
                          label="Preferred translation language"
                          value={settings.preferredTranslationLanguage}
                          onChange={(v) =>
                            void updateSetting(
                              'preferredTranslationLanguage',
                              v
                            )
                          }
                          options={COMMON_LANGUAGES.map((l) => ({
                            value: l.code,
                            label: l.name,
                          }))}
                        />
                      }
                    />
                    <Row
                      title="Auto-detect language"
                      desc="Detect web page language automatically"
                      icon={IconTranslate}
                      trailing={
                        <Switch
                          checked={settings.autoDetectLanguage}
                          onChange={(v) =>
                            void updateSetting('autoDetectLanguage', v)
                          }
                          label="Auto-detect language"
                        />
                      }
                    />
                  </>
                )}
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
                  desc="Language used for speech recognition"
                  icon={IconTranslate}
                  trailing={
                    <Select
                      label="Voice language"
                      value={settings.voiceLanguage ?? ''}
                      onChange={(v) =>
                        void updateSetting('voiceLanguage', v || undefined)
                      }
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
                  desc="How long to wait after silence"
                  icon={IconSound}
                  trailing={
                    <Range
                      label="Voice auto-stop delay"
                      min={1000}
                      max={10000}
                      step={250}
                      value={settings.voiceAutoStopDelay ?? 3000}
                      unit="ms"
                      onChange={(v) =>
                        void updateSetting('voiceAutoStopDelay', v)
                      }
                    />
                  }
                />
              </div>
            </>
          )}
        </div>

        <div
          className="reflexa-modal__footer"
          style={{ justifyContent: 'flex-end' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="reflexa-btn reflexa-btn--primary"
            style={{ opacity: savingKey ? 0.8 : 1 }}
          >
            {savingKey ? 'Saving…' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
