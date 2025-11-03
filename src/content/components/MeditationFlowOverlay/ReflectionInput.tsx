/**
 * Reflection Input Component (Step 2 & 3)
 * Displays reflection question and textarea input with voice support
 */

import React from 'react';
import { VoiceToggleButton } from '../VoiceToggleButton';
import { renderMarkdown } from '../../../utils/markdownRenderer';
import type { Settings, ProofreadResult } from '../../../types';
import type { useVoiceInput } from '../../hooks/useVoiceInput';

interface ReflectionInputProps {
  index: 0 | 1;
  prompt: string;
  answer: string;
  setAnswer: (value: string) => void;
  voiceInput: ReturnType<typeof useVoiceInput>;
  voiceInputState: {
    isRecording: boolean;
    interimText: string;
  };
  settings: Settings;
  rewritePreview: {
    index: number;
    original: string;
    rewritten: string;
  } | null;
  onDiscardRewrite: () => void;
  onAcceptRewrite: () => void;
  proofreadResult: {
    index: number;
    result: ProofreadResult;
  } | null;
  onDiscardProofread: () => void;
  onAcceptProofread: () => void;
  lastTextValueRef: React.MutableRefObject<string[]>;
  typingTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  onVoiceToggle: () => void;
}

export const ReflectionInput: React.FC<ReflectionInputProps> = ({
  index,
  prompt,
  answer,
  setAnswer,
  voiceInput,
  voiceInputState,
  settings,
  rewritePreview,
  onDiscardRewrite,
  onAcceptRewrite,
  proofreadResult,
  onDiscardProofread,
  onAcceptProofread,
  lastTextValueRef,
  typingTimerRef,
  onVoiceToggle,
}) => {
  const displayValue = voiceInputState.interimText
    ? answer
      ? `${answer} ${voiceInputState.interimText}`
      : voiceInputState.interimText
    : answer;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const lastValue = lastTextValueRef.current[index];

    // Detect typing and pause voice if recording
    if (
      newValue !== lastValue &&
      voiceInput.isRecording &&
      !voiceInput.isPaused
    ) {
      voiceInput.pauseRecording();

      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }

      typingTimerRef.current = setTimeout(() => {
        if (voiceInput.isRecording && voiceInput.isPaused) {
          voiceInput.resumeRecording();
        }
      }, 2000);
    }

    setAnswer(newValue);
    lastTextValueRef.current[index] = newValue;
  };

  return (
    <div className="animate-[meditateSlideUp_360ms_cubic-bezier(0.2,0.8,0.2,1)_both] motion-reduce:animate-[fadeIn_0.15s_ease-in-out]">
      <h2 style={{ fontSize: 22, margin: '0 0 8px', fontWeight: 800 }}>
        Reflect
      </h2>
      <p style={{ color: '#cbd5e1', marginTop: 0, marginBottom: 10 }}>
        {prompt}
      </p>
      <div className="mx-auto w-full max-w-[720px]">
        <textarea
          className={`box-border min-h-[220px] w-full rounded-xl border px-3 py-3 text-sm text-slate-50 transition-[background,border] duration-300 ${
            voiceInput.isRecording
              ? 'border-blue-500/40 bg-blue-500/10'
              : 'border-slate-200/25 bg-slate-950/35'
          }`}
          aria-label={`Reflection answer ${index + 1}`}
          autoComplete="off"
          data-form-type="other"
          data-lpignore="true"
          value={displayValue}
          onChange={handleChange}
          style={{
            width: '100%',
            minHeight: 220,
            background: voiceInput.isRecording
              ? 'rgba(59,130,246,0.1)'
              : 'rgba(2,6,23,0.35)',
            border: voiceInput.isRecording
              ? '1px solid rgba(59,130,246,0.4)'
              : '1px solid rgba(226,232,240,0.25)',
            borderRadius: 12,
            color: '#f8fafc',
            padding: 12,
            fontSize: 14,
            transition: 'background 0.3s ease, border 0.3s ease',
            boxSizing: 'border-box',
          }}
        />
        {voiceInput.isSupported && (
          <VoiceToggleButton
            isRecording={voiceInput.isRecording}
            onToggle={onVoiceToggle}
            disabled={false}
            language={voiceInput.effectiveLanguage}
            languageName={voiceInput.languageName}
            isLanguageFallback={voiceInput.isLanguageFallback}
            reduceMotion={settings.reduceMotion}
          />
        )}
      </div>

      {/* Rewrite Preview */}
      {rewritePreview?.index === index && (
        <div
          style={{
            marginTop: 16,
            padding: 14,
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: 12,
            maxWidth: 720,
            width: '100%',
            margin: '16px auto 0',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#60a5fa',
              marginBottom: 8,
            }}
          >
            Rewrite Preview
          </div>
          <div
            style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 12 }}
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(rewritePreview.rewritten),
            }}
          />
          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={onDiscardRewrite}
              style={{
                background: 'transparent',
                border: '1px solid rgba(226,232,240,0.25)',
                color: '#cbd5e1',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              × Discard
            </button>
            <button
              type="button"
              onClick={onAcceptRewrite}
              style={{
                background: 'rgba(34,197,94,0.15)',
                border: '1px solid rgba(34,197,94,0.4)',
                color: '#4ade80',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ✓ Accept
            </button>
          </div>
        </div>
      )}

      {/* Proofread Result */}
      {proofreadResult?.index === index && (
        <div
          style={{
            marginTop: 16,
            padding: 14,
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: 12,
            maxWidth: 720,
            width: '100%',
            margin: '16px auto 0',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#4ade80',
              marginBottom: 8,
            }}
          >
            Proofread Suggestions
          </div>
          <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 12 }}>
            {proofreadResult.result.correctedText}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={onDiscardProofread}
              style={{
                background: 'transparent',
                border: '1px solid rgba(226,232,240,0.25)',
                color: '#cbd5e1',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              × Discard
            </button>
            <button
              type="button"
              onClick={onAcceptProofread}
              style={{
                background: 'rgba(34,197,94,0.15)',
                border: '1px solid rgba(34,197,94,0.4)',
                color: '#4ade80',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ✓ Accept
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
