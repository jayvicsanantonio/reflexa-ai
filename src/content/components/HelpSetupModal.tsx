import React, { useEffect, useRef } from 'react';
import { createKeyboardHandler, trapFocus } from '../../utils/accessibility';

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
        <div className="reflexa-modal__header">
          <h2 id="reflexa-help-title" className="reflexa-modal__title">
            Setup Chrome AI
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

        {/* Accent bar */}
        <div className="reflexa-modal__accent" />

        <div className="reflexa-modal__body">
          <p style={{ color: 'var(--color-calm-200)', margin: '0 0 12px 0' }}>
            Reflexa uses Chrome's on-device AI (Gemini Nano). Enable the flags
            below, then restart Chrome.
          </p>

          <section
            style={{
              padding: '12px 0',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <h3
              style={{
                color: 'var(--color-zen-100)',
                fontWeight: 600,
                margin: '0 0 6px 0',
                fontSize: 14,
              }}
            >
              1. Base AI Model (Required)
            </h3>
            <p
              style={{
                color: 'var(--color-calm-200)',
                fontSize: 14,
                margin: '0 0 6px 0',
              }}
            >
              Open this flag and set to{' '}
              <strong>Enabled BypassPerfRequirement</strong>
            </p>
            <code
              style={{
                display: 'block',
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--color-zen-100)',
                borderRadius: 10,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
              }}
            >
              chrome://flags/#optimization-guide-on-device-model
            </code>
          </section>

          <section
            style={{
              padding: '12px 0',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <h3
              style={{
                color: 'var(--color-zen-100)',
                fontWeight: 600,
                margin: '0 0 6px 0',
                fontSize: 14,
              }}
            >
              2. Core APIs
            </h3>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                color: 'var(--color-calm-200)',
                fontSize: 14,
              }}
            >
              <li>
                <code>chrome://flags/#prompt-api-for-gemini-nano</code>{' '}
                <span>(Enabled)</span>
              </li>
              <li>
                <code>chrome://flags/#summarization-api-for-gemini-nano</code>{' '}
                <span>(Enabled)</span>
              </li>
            </ul>
          </section>

          <section
            style={{
              padding: '12px 0',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <h3
              style={{
                color: 'var(--color-zen-100)',
                fontWeight: 600,
                margin: '0 0 6px 0',
                fontSize: 14,
              }}
            >
              3. Writing Assistance APIs
            </h3>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                color: 'var(--color-calm-200)',
                fontSize: 14,
              }}
            >
              <li>
                <code>chrome://flags/#writer-api</code> → Enabled
              </li>
              <li>
                <code>chrome://flags/#rewriter-api</code> → Enabled
              </li>
              <li>
                <code>chrome://flags/#proofreader-api</code> → Enabled
              </li>
            </ul>
          </section>

          <section style={{ padding: '12px 0' }}>
            <h3
              style={{
                color: 'var(--color-zen-100)',
                fontWeight: 600,
                margin: '0 0 6px 0',
                fontSize: 14,
              }}
            >
              4. Translation & Language
            </h3>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                color: 'var(--color-calm-200)',
                fontSize: 14,
              }}
            >
              <li>
                <code>chrome://flags/#translator-api</code> → Enabled
              </li>
              <li>
                <code>chrome://flags/#language-detection-api</code> → Enabled
              </li>
            </ul>
          </section>

          <div
            style={{
              marginTop: 12,
              borderRadius: 12,
              padding: 12,
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.35)',
              color: 'var(--color-calm-200)',
              fontSize: 14,
            }}
          >
            <strong>Important: </strong>Close all Chrome windows and{' '}
            <strong>restart</strong> Chrome after enabling the flags.
          </div>
        </div>

        <div
          className="reflexa-modal__footer"
          style={{ justifyContent: 'flex-end' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="reflexa-btn reflexa-btn--primary"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
