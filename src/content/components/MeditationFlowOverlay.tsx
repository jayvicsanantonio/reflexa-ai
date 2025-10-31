import React, { useEffect, useRef, useState, useCallback } from 'react';
import type {
  Settings,
  SummaryFormat,
  LanguageDetection,
  TonePreset,
  ProofreadResult,
  VoiceInputMetadata,
} from '../../types';
import { trapFocus } from '../../utils/accessibility';
import { COMMON_LANGUAGES } from '../../constants';
import { BreathingOrb } from './BreathingOrb';
import '../styles.css';

interface MeditationFlowOverlayProps {
  summary: string[];
  prompts: string[];
  onSave: (
    reflections: string[],
    voiceMetadata?: VoiceInputMetadata[],
    originalReflections?: (string | null)[]
  ) => void;
  onCancel: () => void;
  settings: Settings;
  onFormatChange?: (format: SummaryFormat) => Promise<void>;
  currentFormat?: SummaryFormat;
  isLoadingSummary?: boolean;
  languageDetection?: LanguageDetection;
  onProofread?: (text: string, index: number) => Promise<ProofreadResult>;
  onTranslateToEnglish?: () => Promise<void>;
  onTranslate?: (targetLanguage: string) => Promise<void>;
  isTranslating?: boolean;
  onRewrite?: (
    text: string,
    tone: TonePreset,
    index: number
  ) => Promise<{ original: string; rewritten: string }>;
  isRewriting?: boolean[];
  proofreaderAvailable?: boolean;
  ambientMuted?: boolean;
  onToggleAmbient?: (mute: boolean) => void;
  initialStep?: number;
  initialAnswers?: string[];
}

export const MeditationFlowOverlay: React.FC<MeditationFlowOverlayProps> = ({
  summary,
  prompts,
  onSave,
  onCancel,
  settings,
  onFormatChange,
  currentFormat = 'bullets',
  isLoadingSummary = false,
  onProofread,
  onTranslateToEnglish,
  onTranslate,
  isTranslating,
  ambientMuted = false,
  onToggleAmbient,
  initialStep,
  initialAnswers,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<number>(
    typeof initialStep === 'number' ? Math.min(Math.max(initialStep, 0), 3) : 0
  ); // 0: settle, 1: summary, 2: q1, 3: q2
  const [answers, setAnswers] = useState<string[]>(
    Array.isArray(initialAnswers) && initialAnswers.length === 2
      ? [initialAnswers[0] ?? '', initialAnswers[1] ?? '']
      : ['', '']
  );
  const [showMore, setShowMore] = useState<boolean>(false);
  const [targetLang, setTargetLang] = useState<string>('en');
  const [isMuted, setIsMuted] = useState<boolean>(ambientMuted);
  const [breathCue, setBreathCue] = useState<'inhale' | 'hold' | 'exhale'>(
    'inhale'
  );
  const [resumePromptOpen, setResumePromptOpen] = useState<boolean>(
    typeof initialStep === 'number' ||
      (Array.isArray(initialAnswers) &&
        Boolean(initialAnswers[0] || initialAnswers[1]))
      ? true
      : false
  );

  // Keyboard navigation (arrows, esc, enter)
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        setStep((s) => Math.min(3, s + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setStep((s) => Math.max(0, s - 1));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    },
    [onCancel]
  );

  useEffect(() => {
    if (!contentRef.current) return;
    return trapFocus(contentRef.current, onCancel);
  }, [onCancel]);

  const next = () => setStep((s) => Math.min(3, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const save = () => {
    try {
      void chrome.storage.local.remove('reflexa_draft');
    } catch {
      // ignore
    }
    onSave(answers);
  };

  // Auto-advance from settle step after a calm breathing cycle (respect reduced motion)
  useEffect(() => {
    if (step !== 0) return;
    if (settings?.reduceMotion) return; // don't auto-advance when reduced motion
    const durationMs = 16000; // box breathing cycle: 16s (4-4-4-4)
    const id = window.setTimeout(() => setStep(1), Math.min(16000, durationMs));
    return () => window.clearTimeout(id);
  }, [step, settings?.reduceMotion]);

  // Guided breath cues synced to box breathing (4 inhale, 4 hold, 4 exhale, 4 hold)
  useEffect(() => {
    if (step !== 0 || settings?.reduceMotion) return;
    const phase = 4000; // ms per segment
    setBreathCue('inhale');
    const t1 = window.setTimeout(() => setBreathCue('hold'), phase);
    const t2 = window.setTimeout(() => setBreathCue('exhale'), phase * 2);
    const t3 = window.setTimeout(() => setBreathCue('hold'), phase * 3);
    const cycle = window.setInterval(() => {
      setBreathCue('inhale');
      window.setTimeout(() => setBreathCue('hold'), phase);
      window.setTimeout(() => setBreathCue('exhale'), phase * 2);
      window.setTimeout(() => setBreathCue('hold'), phase * 3);
    }, phase * 4);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearInterval(cycle);
    };
  }, [step, settings?.reduceMotion]);

  // Auto-save answers draft on step/answers change
  useEffect(() => {
    try {
      void chrome.storage.local.set({
        reflexa_draft: {
          url: window.location.href,
          step,
          answers,
          ts: Date.now(),
        },
      });
    } catch {
      // ignore
    }
  }, [step, answers]);

  const Header = (
    <div
      style={{
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#e2e8f0',
        fontSize: 12,
      }}
    >
      <span>Reflexa • Reflect Mode</span>
      <button
        type="button"
        onClick={onCancel}
        aria-label="Close"
        style={{
          background: 'transparent',
          border: '1px solid rgba(226,232,240,0.25)',
          color: '#e2e8f0',
          borderRadius: 999,
          width: 32,
          height: 32,
          cursor: 'pointer',
        }}
      >
        ×
      </button>
    </div>
  );

  const Nav = (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: 24,
        right: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <button
        type="button"
        onClick={prev}
        disabled={step === 0}
        aria-label="Previous"
        style={{
          background: 'transparent',
          border: '1px solid rgba(226,232,240,0.25)',
          color: step === 0 ? 'rgba(226,232,240,0.35)' : '#e2e8f0',
          borderRadius: 999,
          padding: '8px 12px',
          cursor: step === 0 ? 'default' : 'pointer',
        }}
      >
        ← Back
      </button>
      {step < 3 ? (
        <div style={{ display: 'flex', gap: 8 }}>
          {onFormatChange && step === 1 && (
            <button
              type="button"
              onClick={() =>
                void onFormatChange(
                  currentFormat === 'bullets' ? 'paragraph' : 'bullets'
                )
              }
              aria-label="Toggle summary format"
              style={{
                background: 'transparent',
                border: '1px solid rgba(226,232,240,0.25)',
                color: '#e2e8f0',
                borderRadius: 999,
                padding: '8px 12px',
                cursor: 'pointer',
              }}
            >
              {currentFormat === 'bullets' ? 'Paragraph' : 'Bullets'}
            </button>
          )}
          <button
            type="button"
            onClick={next}
            aria-label="Next"
            style={{
              background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
              border: '1px solid rgba(226,232,240,0.25)',
              color: '#fff',
              borderRadius: 999,
              padding: '8px 14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Next →
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={save}
          aria-label="Save reflection"
          style={{
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            border: '1px solid rgba(226,232,240,0.25)',
            color: '#fff',
            borderRadius: 999,
            padding: '8px 14px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Save
        </button>
      )}
    </div>
  );

  return (
    <div
      className="reflexa-overlay reflexa-overlay--meditation"
      onKeyDown={onKeyDown}
    >
      <div className="reflexa-overlay__backdrop reflexa-overlay__backdrop--meditation" />
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-label="Meditation Reflect"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {Header}

        {resumePromptOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Resume draft"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
            }}
          >
            <div
              style={{
                background: 'rgba(2,8,23,0.85)',
                border: '1px solid rgba(226,232,240,0.18)',
                borderRadius: 16,
                boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
                color: '#e2e8f0',
                padding: 16,
                width: 360,
                textAlign: 'center',
                backdropFilter: 'blur(10px) saturate(110%)',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>
                Resume draft?
              </div>
              <div style={{ color: '#cbd5e1', fontSize: 13, marginBottom: 12 }}>
                A saved reflection exists for this page.
              </div>
              <div
                style={{ display: 'flex', gap: 8, justifyContent: 'center' }}
              >
                <button
                  type="button"
                  onClick={() => setResumePromptOpen(false)}
                  style={{
                    background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
                    border: '1px solid rgba(226,232,240,0.25)',
                    color: '#fff',
                    borderRadius: 999,
                    padding: '8px 14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Resume
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAnswers(['', '']);
                    setStep(0);
                    try {
                      void chrome.storage.local.remove('reflexa_draft');
                    } catch {
                      // ignore
                    }
                    setResumePromptOpen(false);
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(226,232,240,0.25)',
                    color: '#e2e8f0',
                    borderRadius: 999,
                    padding: '8px 14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Start fresh
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Center content per step */}
        <div
          style={{
            maxWidth: 800,
            width: '88%',
            textAlign: 'center',
            color: '#e2e8f0',
          }}
        >
          {step === 0 && (
            <div className="reflexa-meditation-fade">
              <div style={{ marginBottom: 8 }}>
                <BreathingOrb
                  enabled={!settings?.reduceMotion}
                  duration={16}
                  size={140}
                  mode="box"
                />
              </div>
              <h1 style={{ fontSize: 28, margin: 0, fontWeight: 800 }}>
                Find your breath
              </h1>
              <p
                style={{
                  marginTop: 8,
                  color: '#cbd5e1',
                  fontSize: 14,
                }}
              >
                {breathCue === 'inhale' && 'Inhale…'}
                {breathCue === 'hold' && 'Hold…'}
                {breathCue === 'exhale' && 'Exhale…'}
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="reflexa-meditation-slide">
              <h2 style={{ fontSize: 22, margin: '0 0 12px', fontWeight: 800 }}>
                Summary
              </h2>
              {isLoadingSummary ? (
                <div style={{ color: '#cbd5e1' }}>Generating…</div>
              ) : (
                <div
                  style={{
                    color: '#f1f5f9',
                    fontSize: 16,
                    lineHeight: 1.8,
                    textAlign: 'left',
                    margin: '0 auto',
                    maxWidth: 720,
                  }}
                >
                  {currentFormat === 'bullets' ? (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {summary.map((s, i) => (
                        <li key={i} style={{ marginBottom: 8 }}>
                          {s}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ margin: 0 }}>{summary.join(' ')}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="reflexa-meditation-slide">
              <h2 style={{ fontSize: 22, margin: '0 0 8px', fontWeight: 800 }}>
                Reflect
              </h2>
              <p style={{ color: '#cbd5e1', marginTop: 0, marginBottom: 10 }}>
                {prompts[0] ?? 'What did you find most interesting?'}
              </p>
              <textarea
                aria-label="Reflection answer 1"
                value={answers[0]}
                onChange={(e) =>
                  setAnswers((prev) => [e.target.value, prev[1] ?? ''])
                }
                style={{
                  width: '100%',
                  maxWidth: 720,
                  minHeight: 120,
                  background: 'rgba(2,6,23,0.35)',
                  border: '1px solid rgba(226,232,240,0.25)',
                  borderRadius: 12,
                  color: '#f8fafc',
                  padding: 12,
                  fontSize: 14,
                }}
              />
            </div>
          )}

          {step === 3 && (
            <div className="reflexa-meditation-slide">
              <h2 style={{ fontSize: 22, margin: '0 0 8px', fontWeight: 800 }}>
                Reflect
              </h2>
              <p style={{ color: '#cbd5e1', marginTop: 0, marginBottom: 10 }}>
                {prompts[1] ?? 'How might you apply this?'}
              </p>
              <textarea
                aria-label="Reflection answer 2"
                value={answers[1]}
                onChange={(e) =>
                  setAnswers((prev) => [prev[0] ?? '', e.target.value])
                }
                style={{
                  width: '100%',
                  maxWidth: 720,
                  minHeight: 120,
                  background: 'rgba(2,6,23,0.35)',
                  border: '1px solid rgba(226,232,240,0.25)',
                  borderRadius: 12,
                  color: '#f8fafc',
                  padding: 12,
                  fontSize: 14,
                }}
              />
            </div>
          )}
        </div>

        {Nav}

        {/* Tucked More panel */}
        <div
          style={{
            position: 'absolute',
            right: 24,
            top: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={() => setShowMore((s) => !s)}
            aria-expanded={showMore}
            aria-label="More options"
            style={{
              background: 'rgba(2,6,23,0.4)',
              border: '1px solid rgba(226,232,240,0.25)',
              color: '#e2e8f0',
              borderRadius: 999,
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            ··· More
          </button>
          <button
            type="button"
            onClick={() => {
              const next = !isMuted;
              setIsMuted(next);
              onToggleAmbient?.(next);
            }}
            aria-label={isMuted ? 'Unmute ambient' : 'Mute ambient'}
            style={{
              background: 'rgba(2,6,23,0.4)',
              border: '1px solid rgba(226,232,240,0.25)',
              color: '#e2e8f0',
              borderRadius: 999,
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
        </div>

        {showMore && (
          <div
            style={{
              position: 'absolute',
              right: 24,
              top: 56,
              width: 300,
              background: 'rgba(2,8,23,0.75)',
              border: '1px solid rgba(226,232,240,0.18)',
              borderRadius: 12,
              boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
              color: '#e2e8f0',
              padding: 12,
              backdropFilter: 'blur(10px) saturate(110%)',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>
              Tools
            </div>

            {/* Translation */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 6 }}>
                Translate summary
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <select
                  aria-label="Target language"
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(2,6,23,0.35)',
                    border: '1px solid rgba(226,232,240,0.25)',
                    color: '#f8fafc',
                    borderRadius: 8,
                    padding: '6px 8px',
                  }}
                >
                  {COMMON_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!onTranslate || isTranslating}
                  onClick={() => onTranslate && void onTranslate(targetLang)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(226,232,240,0.25)',
                    color: '#e2e8f0',
                    borderRadius: 8,
                    padding: '6px 10px',
                    cursor: onTranslate ? 'pointer' : 'default',
                  }}
                >
                  {isTranslating ? '…' : 'Translate'}
                </button>
                <button
                  type="button"
                  disabled={!onTranslateToEnglish || isTranslating}
                  onClick={() =>
                    onTranslateToEnglish && void onTranslateToEnglish()
                  }
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(226,232,240,0.25)',
                    color: '#e2e8f0',
                    borderRadius: 8,
                    padding: '6px 10px',
                    cursor: onTranslateToEnglish ? 'pointer' : 'default',
                  }}
                >
                  English
                </button>
              </div>
            </div>

            {/* Proofread current answer */}
            {(step === 2 || step === 3) && (
              <div style={{ marginBottom: 4 }}>
                <div
                  style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 6 }}
                >
                  Proofread
                </div>
                <button
                  type="button"
                  disabled={!onProofread}
                  onClick={async () => {
                    if (!onProofread) return;
                    const idx = step === 2 ? 0 : 1;
                    try {
                      const result = await onProofread(answers[idx] ?? '', idx);
                      setAnswers((prev) => {
                        const next = [...prev];
                        next[idx] = result.correctedText ?? prev[idx];
                        return next;
                      });
                    } catch {
                      // silent
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(226,232,240,0.25)',
                    color: '#e2e8f0',
                    borderRadius: 8,
                    padding: '6px 10px',
                    cursor: onProofread ? 'pointer' : 'default',
                  }}
                >
                  Proofread current answer
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
