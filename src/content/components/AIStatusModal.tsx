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

  // legacy row component (no longer used)

  const StatusCardLite: React.FC<{ label: string; ok?: boolean }> = ({
    label,
    ok,
  }) => (
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
        </svg>
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
        <div style={{ color: '#3b82f6', fontSize: 13 }}>
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
              <div style={{ color: '#64748b', fontSize: 12 }}>
                Chrome Built-in AI APIs
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
                <div style={{ color: '#64748b', fontSize: 12 }}>
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
            <StatusCardLite label="Summarizer" ok={capabilities?.summarizer} />
            <StatusCardLite label="Writer" ok={capabilities?.writer} />
            <StatusCardLite label="Rewriter" ok={capabilities?.rewriter} />
            <StatusCardLite
              label="Proofreader"
              ok={capabilities?.proofreader}
            />
            <StatusCardLite
              label="Language Detector"
              ok={capabilities?.languageDetector}
            />
            <StatusCardLite label="Translator" ok={capabilities?.translator} />
            <StatusCardLite label="Prompt API" ok={capabilities?.prompt} />
          </div>

          <div
            style={{
              marginTop: 16,
              borderTop: '1px solid rgba(15,23,42,0.06)',
              paddingTop: 12,
            }}
          >
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
              Setup Chrome AI (If Needed)
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                color: '#64748b',
                fontSize: 13,
              }}
            >
              <li>
                <code>chrome://flags/#optimization-guide-on-device-model</code>{' '}
                → Enabled BypassPerfRequirement
              </li>
              <li>
                <code>chrome://flags/#prompt-api-for-gemini-nano</code> →
                Enabled
              </li>
              <li>
                <code>chrome://flags/#summarization-api-for-gemini-nano</code> →
                Enabled
              </li>
              <li>
                <code>chrome://flags/#writer-api</code> → Enabled
              </li>
              <li>
                <code>chrome://flags/#rewriter-api</code> → Enabled
              </li>
              <li>
                <code>chrome://flags/#proofreader-api</code> → Enabled
              </li>
              <li>
                <code>chrome://flags/#translator-api</code> → Enabled
              </li>
              <li>
                <code>chrome://flags/#language-detection-api</code> → Enabled
              </li>
            </ul>
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
