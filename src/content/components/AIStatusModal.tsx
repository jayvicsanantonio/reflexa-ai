import React, { useEffect, useRef, useState } from 'react';
import { createKeyboardHandler, trapFocus } from '../../utils/accessibility';
import type { AICapabilities, Settings } from '../../types';

interface AIStatusModalProps {
  onClose: () => void;
}

export const AIStatusModal: React.FC<AIStatusModalProps> = ({ onClose }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [capabilities, setCapabilities] = useState<AICapabilities | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const refreshStatus = async () => {
    setRefreshing(true);
    try {
      const resp: unknown = await chrome.runtime.sendMessage({
        type: 'getCapabilities',
        payload: {
          refresh: true,
          experimentalMode: settings?.experimentalMode,
        },
      });
      const r = resp as { success?: boolean; data?: unknown } | undefined;
      if (r?.success && r.data) {
        setCapabilities(r.data as AICapabilities);
      }
    } catch {
      // no-op
    } finally {
      setRefreshing(false);
    }
  };

  const copyFlagsList = async () => {
    const flags = [
      'chrome://flags/#optimization-guide-on-device-model (Enable + BypassPerfRequirement)',
      'chrome://flags/#prompt-api-for-gemini-nano (Enable)',
      'chrome://flags/#summarization-api-for-gemini-nano (Enable)',
      'chrome://flags/#writer-api (Enable)',
      'chrome://flags/#rewriter-api (Enable)',
      'chrome://flags/#proofreader-api (Enable)',
      'chrome://flags/#translator-api (Enable)',
      'chrome://flags/#language-detection-api (Enable)',
    ].join('\n');
    try {
      await navigator.clipboard.writeText(flags);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  // Icons
  const IconList = (
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
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </svg>
  );

  const IconPen = (
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );

  const IconRepeat = (
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
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );

  const IconBookCheck = (
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
      <path d="M4 19.5V5a2 2 0 0 1 2-2h8l6 6v10.5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19.5Z" />
      <path d="M14 3v6h6" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );

  const IconGlobe = (
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
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
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
      <path d="M4 5h7" />
      <path d="M9 3v2c0 6 7 10 7 10" />
      <path d="M5 20l7-7" />
      <path d="M12 12c-1.5 2-4 5-7 8" />
      <path d="M16 17h6" />
      <path d="M19 14v6" />
    </svg>
  );

  const IconSpark = (
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
      <path d="M5 3l4 8-4 8 7-5 7 5-4-8 4-8-7 5-7-5z" />
    </svg>
  );

  const StatusCard: React.FC<{
    label: string;
    ok?: boolean;
    icon: React.ReactNode;
  }> = ({ label, ok, icon }) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 16,
        border: '1px solid rgba(30, 64, 175, 0.18)',
        background: 'rgba(59, 130, 246, 0.06)',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 32,
          height: 32,
          borderRadius: 999,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(59, 130, 246, 0.12)',
          color: '#60a5fa',
        }}
      >
        {icon}
      </span>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div
          style={{
            color: '#0f172a',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 180,
          }}
          title={label}
        >
          {label}
        </div>
        <div style={{ color: '#1f2937', fontSize: 13 }}>
          {ok ? '✓ Available' : '• Unavailable'}
        </div>
      </div>
    </div>
  );

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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 20px 8px 20px',
            borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
            gap: 12,
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
              {/* lightning icon */}
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>AI Status</div>
              <div style={{ color: '#334155', fontSize: 12 }}>
                Chrome Built-in AI APIs
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={refreshStatus}
              disabled={refreshing}
              aria-label="Refresh AI status"
              className="reflexa-btn reflexa-btn--ghost"
              style={{
                padding: '8px 10px',
                border: '1px solid rgba(15,23,42,0.15)',
                color: '#0f172a',
                background: '#ffffff',
              }}
            >
              {refreshing ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
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
                    style={{ animation: 'spin 1s linear infinite' }}
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Checking…
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
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
                    <path d="M3 12a9 9 0 1 0 9-9" />
                    <polyline points="3 3 3 9 9 9" />
                  </svg>
                  Refresh status
                </span>
              )}
            </button>
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
        </div>

        <div style={{ padding: '16px 20px', overflow: 'auto' }}>
          {settings?.experimentalMode && (
            <div
              style={{
                borderRadius: 16,
                padding: 14,
                background: 'rgba(59,130,246,0.08)',
                border: '1px solid rgba(30, 64, 175, 0.18)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 12,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: 'rgba(59,130,246,0.12)',
                  color: '#60a5fa',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
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
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>
                  Experimental Mode Active
                </div>
                <div style={{ color: '#334155', fontSize: 12 }}>
                  Using beta AI features and capabilities
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            <StatusCard
              label="Summarizer"
              ok={capabilities?.summarizer}
              icon={IconList}
            />
            <StatusCard
              label="Writer"
              ok={capabilities?.writer}
              icon={IconPen}
            />
            <StatusCard
              label="Rewriter"
              ok={capabilities?.rewriter}
              icon={IconRepeat}
            />
            <StatusCard
              label="Proofreader"
              ok={capabilities?.proofreader}
              icon={IconBookCheck}
            />
            <StatusCard
              label="Language Detector"
              ok={capabilities?.languageDetector}
              icon={IconGlobe}
            />
            <StatusCard
              label="Translator"
              ok={capabilities?.translator}
              icon={IconTranslate}
            />
            <StatusCard
              label="Prompt API"
              ok={capabilities?.prompt}
              icon={IconSpark}
            />
          </div>

          <div
            style={{
              marginTop: 16,
              borderTop: '1px solid rgba(15,23,42,0.06)',
              paddingTop: 12,
            }}
          >
            <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
              Set Up Chrome AI (Friendly Guide)
            </div>
            <ol
              style={{
                margin: 0,
                paddingLeft: 18,
                color: '#475569',
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              <li>
                In Chrome’s address bar, type <code>chrome://flags</code> and
                press Enter.
              </li>
              <li>
                Use the search field to find each of the items below and set
                them to <strong>Enabled</strong>:
                <ul style={{ marginTop: 8, marginBottom: 8 }}>
                  <li>
                    <code>#optimization-guide-on-device-model</code> — Enable +
                    BypassPerfRequirement
                  </li>
                  <li>
                    <code>#prompt-api-for-gemini-nano</code>
                  </li>
                  <li>
                    <code>#summarization-api-for-gemini-nano</code>
                  </li>
                  <li>
                    <code>#writer-api</code>
                  </li>
                  <li>
                    <code>#rewriter-api</code>
                  </li>
                  <li>
                    <code>#proofreader-api</code>
                  </li>
                  <li>
                    <code>#translator-api</code>
                  </li>
                  <li>
                    <code>#language-detection-api</code>
                  </li>
                </ul>
              </li>
              <li>Click the Relaunch button to restart Chrome.</li>
              <li>
                Return here and click <em>Refresh status</em> to verify
                everything is available.
              </li>
            </ol>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                type="button"
                onClick={copyFlagsList}
                className="reflexa-btn reflexa-btn--ghost"
                aria-label="Copy flags list"
              >
                {copied ? 'Copied ✓' : 'Copy flags list'}
              </button>
            </div>
            <div style={{ color: '#334155', fontSize: 12, marginTop: 8 }}>
              Tip: If some flags don’t appear, make sure Chrome is up to date.
            </div>
          </div>
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
