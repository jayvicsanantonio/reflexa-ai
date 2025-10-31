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
import { VoiceToggleButton } from './VoiceToggleButton';
import { Notification } from './Notification';
import { TonePresetChips } from './TonePresetChips';
import { useVoiceInput } from '../hooks/useVoiceInput';
import type { VoiceInputError } from '../hooks/useVoiceInput';
import { AudioManager } from '../../utils/audioManager';
import type { AIResponse } from '../../types';
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
  onTranslateToEnglish: _onTranslateToEnglish,
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
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState<number>(0);
  const [resumePromptOpen, setResumePromptOpen] = useState<boolean>(
    typeof initialStep === 'number' ||
      (Array.isArray(initialAnswers) &&
        Boolean(initialAnswers[0] || initialAnswers[1]))
      ? true
      : false
  );
  const [voiceInputStates, setVoiceInputStates] = useState<
    { isRecording: boolean; interimText: string }[]
  >([
    { isRecording: false, interimText: '' },
    { isRecording: false, interimText: '' },
  ]);
  const [voiceError, setVoiceError] = useState<VoiceInputError | null>(null);
  const [autoStopNotification, setAutoStopNotification] =
    useState<boolean>(false);
  const [isDraftGenerating, setIsDraftGenerating] = useState<boolean[]>([
    false,
    false,
  ]);
  const [selectedTone, setSelectedTone] = useState<TonePreset | undefined>(
    undefined
  );
  const [isRewriting, setIsRewriting] = useState<boolean[]>([false, false]);
  const [rewritePreview, setRewritePreview] = useState<{
    index: number;
    original: string;
    rewritten: string;
  } | null>(null);
  const [writerAvailable, setWriterAvailable] = useState<boolean>(false);
  const [rewriterAvailable, setRewriterAvailable] = useState<boolean>(false);
  const [showVoiceEnhancePrompt, setShowVoiceEnhancePrompt] = useState<{
    show: boolean;
    index: number;
  }>({ show: false, index: 0 });
  const [languageFallbackNotification, setLanguageFallbackNotification] =
    useState<{ show: boolean; languageName: string }>({
      show: false,
      languageName: '',
    });
  const audioManagerRef = useRef<AudioManager | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTextValueRef = useRef<string[]>(['', '']);

  // Meditative phrases that rotate during loading
  const meditativePhrases = [
    'Crafting your insights...',
    'Take a deep breath...',
    'Let your mind settle...',
    'Finding clarity in the moment...',
    'Gathering your thoughts...',
    'Embracing the present...',
    'Breathing in calm...',
    'Releasing tension...',
    'Centering your awareness...',
    'Cultivating stillness...',
    'Honoring this pause...',
    'Welcoming tranquility...',
    'Grounding in the now...',
    'Softening into ease...',
    'Discovering inner peace...',
    'Nurturing mindfulness...',
    'Flowing with patience...',
    'Resting in awareness...',
    'Opening to insight...',
    'Trusting the process...',
  ];

  // Voice input handlers for answer field 0
  const handleTranscript0 = useCallback(
    (text: string, isFinal: boolean) => {
      if (isFinal) {
        setAnswers((prev) => {
          const newAnswers = [...prev];
          const currentText = newAnswers[0] || '';
          newAnswers[0] = currentText
            ? `${currentText} ${text.trim()}`
            : text.trim();
          lastTextValueRef.current[0] = newAnswers[0];
          return newAnswers;
        });

        setVoiceInputStates((prev) => {
          const newStates = [...prev];
          newStates[0].interimText = '';
          return newStates;
        });

        // Show voice enhancement prompt if rewriter is available
        if (rewriterAvailable && text.trim().length > 30) {
          setTimeout(() => {
            setShowVoiceEnhancePrompt({ show: true, index: 0 });
          }, 1000);
        }
      } else {
        setVoiceInputStates((prev) => {
          const newStates = [...prev];
          newStates[0].interimText = text;
          return newStates;
        });
      }
    },
    [rewriterAvailable]
  );

  const handleVoiceError0 = useCallback((error: VoiceInputError) => {
    console.error('Voice input error (field 0):', error);
    setVoiceError(error);
  }, []);

  const handleAutoStop0 = useCallback(() => {
    console.log('Auto-stop triggered for field 0');
    setAutoStopNotification(true);

    if (settings.enableSound && audioManagerRef.current) {
      audioManagerRef.current.playVoiceStopCue().catch((err) => {
        console.error('Failed to play voice stop audio cue:', err);
      });
    }
  }, [settings.enableSound]);

  const voiceInput0 = useVoiceInput({
    language:
      settings.voiceLanguage ??
      settings.preferredTranslationLanguage ??
      navigator.language,
    onTranscript: handleTranscript0,
    onError: handleVoiceError0,
    onAutoStop: handleAutoStop0,
    autoStopDelay: settings.voiceAutoStopDelay ?? 3000,
  });

  // Voice input handlers for answer field 1
  const handleTranscript1 = useCallback(
    (text: string, isFinal: boolean) => {
      if (isFinal) {
        setAnswers((prev) => {
          const newAnswers = [...prev];
          const currentText = newAnswers[1] || '';
          newAnswers[1] = currentText
            ? `${currentText} ${text.trim()}`
            : text.trim();
          lastTextValueRef.current[1] = newAnswers[1];
          return newAnswers;
        });

        setVoiceInputStates((prev) => {
          const newStates = [...prev];
          newStates[1].interimText = '';
          return newStates;
        });

        // Show voice enhancement prompt if rewriter is available
        if (rewriterAvailable && text.trim().length > 30) {
          setTimeout(() => {
            setShowVoiceEnhancePrompt({ show: true, index: 1 });
          }, 1000);
        }
      } else {
        setVoiceInputStates((prev) => {
          const newStates = [...prev];
          newStates[1].interimText = text;
          return newStates;
        });
      }
    },
    [rewriterAvailable]
  );

  const handleVoiceError1 = useCallback((error: VoiceInputError) => {
    console.error('Voice input error (field 1):', error);
    setVoiceError(error);
  }, []);

  const handleAutoStop1 = useCallback(() => {
    console.log('Auto-stop triggered for field 1');
    setAutoStopNotification(true);

    if (settings.enableSound && audioManagerRef.current) {
      audioManagerRef.current.playVoiceStopCue().catch((err) => {
        console.error('Failed to play voice stop audio cue:', err);
      });
    }
  }, [settings.enableSound]);

  const voiceInput1 = useVoiceInput({
    language:
      settings.voiceLanguage ??
      settings.preferredTranslationLanguage ??
      navigator.language,
    onTranscript: handleTranscript1,
    onError: handleVoiceError1,
    onAutoStop: handleAutoStop1,
    autoStopDelay: settings.voiceAutoStopDelay ?? 3000,
  });

  // Update voice input recording states
  useEffect(() => {
    setVoiceInputStates((prev) => {
      const newStates = [...prev];
      newStates[0].isRecording = voiceInput0.isRecording;
      newStates[1].isRecording = voiceInput1.isRecording;
      return newStates;
    });
  }, [voiceInput0.isRecording, voiceInput1.isRecording]);

  // Show notification if language fallback is detected
  useEffect(() => {
    if (voiceInput0.isLanguageFallback || voiceInput1.isLanguageFallback) {
      const languageName = voiceInput0.isLanguageFallback
        ? voiceInput0.languageName
        : voiceInput1.languageName;
      setLanguageFallbackNotification({
        show: true,
        languageName,
      });
    }
  }, [
    voiceInput0.isLanguageFallback,
    voiceInput0.languageName,
    voiceInput1.isLanguageFallback,
    voiceInput1.languageName,
  ]);

  // Keyboard navigation (arrows, esc, enter)
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        // Don't advance from step 0 if still loading summary
        if (step === 0 && isLoadingSummary) return;
        setStep((s) => Math.min(3, s + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setStep((s) => Math.max(0, s - 1));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    },
    [onCancel, step, isLoadingSummary]
  );

  useEffect(() => {
    if (!contentRef.current) return;
    return trapFocus(contentRef.current, onCancel);
  }, [onCancel]);

  // Initialize audio manager
  useEffect(() => {
    audioManagerRef.current = new AudioManager(settings);
    audioManagerRef.current.loadAudioFiles();

    return () => {
      if (audioManagerRef.current) {
        audioManagerRef.current.cleanup();
      }
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, [settings]);

  // Check Writer and Rewriter API availability
  useEffect(() => {
    const checkAPIs = async () => {
      try {
        const writerResponse: AIResponse<boolean> =
          await chrome.runtime.sendMessage({
            type: 'checkAI',
            payload: { api: 'writer' },
          });
        setWriterAvailable(writerResponse.success && writerResponse.data);

        const rewriterResponse: AIResponse<boolean> =
          await chrome.runtime.sendMessage({
            type: 'checkAI',
            payload: { api: 'rewriter' },
          });
        setRewriterAvailable(rewriterResponse.success && rewriterResponse.data);
      } catch (error) {
        console.error('Error checking API availability:', error);
      }
    };

    void checkAPIs();
  }, []);

  // Generate draft using Writer API
  const handleGenerateDraft = useCallback(
    async (index: 0 | 1) => {
      if (!writerAvailable) return;

      setIsDraftGenerating((prev) => {
        const next = [...prev];
        next[index] = true;
        return next;
      });

      try {
        const prompt = prompts[index];
        const summaryContext = summary.join('\n');

        const response: AIResponse<string> = await chrome.runtime.sendMessage({
          type: 'write',
          payload: {
            prompt: `${prompt}\n\nContext: ${summaryContext}`,
            options: { tone: 'neutral', length: 'short' },
          },
        });

        if (response.success) {
          setAnswers((prev) => {
            const next = [...prev];
            next[index] = response.data;
            lastTextValueRef.current[index] = response.data;
            return next;
          });
        }
      } catch (error) {
        console.error('Error generating draft:', error);
      } finally {
        setIsDraftGenerating((prev) => {
          const next = [...prev];
          next[index] = false;
          return next;
        });
      }
    },
    [writerAvailable, prompts, summary]
  );

  // Rewrite with selected tone
  const handleToneSelect = useCallback(
    async (tone: TonePreset) => {
      if (!rewriterAvailable) return;

      const index = step === 2 ? 0 : 1;
      const text = answers[index];

      if (!text || text.trim().length === 0) return;

      setSelectedTone(tone);
      setIsRewriting((prev) => {
        const next = [...prev];
        next[index] = true;
        return next;
      });

      try {
        const response: AIResponse<{ original: string; rewritten: string }> =
          await chrome.runtime.sendMessage({
            type: 'rewrite',
            payload: {
              text,
              preset: tone,
              context: summary.join('\n'),
            },
          });

        if (response.success) {
          setRewritePreview({
            index,
            original: response.data.original,
            rewritten: response.data.rewritten,
          });
        }
      } catch (error) {
        console.error('Error rewriting:', error);
      } finally {
        setIsRewriting((prev) => {
          const next = [...prev];
          next[index] = false;
          return next;
        });
      }
    },
    [rewriterAvailable, step, answers, summary]
  );

  // Accept rewrite
  const handleAcceptRewrite = useCallback(() => {
    if (!rewritePreview) return;

    setAnswers((prev) => {
      const next = [...prev];
      next[rewritePreview.index] = rewritePreview.rewritten;
      lastTextValueRef.current[rewritePreview.index] = rewritePreview.rewritten;
      return next;
    });

    setRewritePreview(null);
    setSelectedTone(undefined);
  }, [rewritePreview]);

  // Discard rewrite
  const handleDiscardRewrite = useCallback(() => {
    setRewritePreview(null);
    setSelectedTone(undefined);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + G = Generate draft
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === 'g' &&
        (step === 2 || step === 3)
      ) {
        e.preventDefault();
        const index = step === 2 ? 0 : 1;
        if (!answers[index] && writerAvailable) {
          void handleGenerateDraft(index);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [step, answers, writerAvailable, handleGenerateDraft]);

  const next = () => {
    // Don't advance from step 0 if still loading summary
    if (step === 0 && isLoadingSummary) return;
    setStep((s) => Math.min(3, s + 1));
  };
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const save = () => {
    try {
      void chrome.storage.local.remove('reflexa_draft');
    } catch {
      // ignore
    }

    // Compute voice metadata for each answer
    const voiceMetadata: VoiceInputMetadata[] = answers.map((_, index) => {
      const voiceInput = index === 0 ? voiceInput0 : voiceInput1;
      const hasVoiceTranscription =
        voiceInputStates[index].isRecording ||
        (lastTextValueRef.current[index] !== '' &&
          voiceInput.hasPermission === true);

      if (!hasVoiceTranscription) {
        return {
          isVoiceTranscribed: false,
        };
      }

      const wordCount = (lastTextValueRef.current[index] || '')
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length;

      return {
        isVoiceTranscribed: true,
        transcriptionLanguage: voiceInput.effectiveLanguage,
        transcriptionTimestamp: Date.now(),
        wordCount,
      };
    });

    onSave(answers, voiceMetadata);
  };

  // Track previous loading state to detect when loading completes
  const prevLoadingRef = useRef<boolean | null>(null);

  // Auto-advance to summary screen once loading completes
  useEffect(() => {
    console.log('[MeditationFlow] Auto-advance check:', {
      step,
      isLoadingSummary,
      prevLoading: prevLoadingRef.current,
    });

    // Check if we transitioned from loading to not loading
    if (
      step === 0 &&
      prevLoadingRef.current === true &&
      isLoadingSummary === false
    ) {
      console.log(
        '[MeditationFlow] Loading complete, auto-advancing to summary'
      );
      setStep(1);
    }

    // Update the ref for next render
    prevLoadingRef.current = isLoadingSummary;
  }, [step, isLoadingSummary]);

  // Rotate meditative phrases every 4 seconds during loading
  useEffect(() => {
    if (step !== 0 || !isLoadingSummary) return;
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prev) => (prev + 1) % meditativePhrases.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [step, isLoadingSummary, meditativePhrases.length]);

  // Guided breath cues: 4s inhale → 4s exhale (continuous during loading, or twice when not loading)
  useEffect(() => {
    if (step !== 0 || settings?.reduceMotion) return;

    const phase = 4000; // 4s per inhale/exhale
    setBreathCue('inhale');

    if (isLoadingSummary) {
      // Continuous breathing cycle during loading
      const interval = setInterval(() => {
        setBreathCue((prev) => (prev === 'inhale' ? 'exhale' : 'inhale'));
      }, phase);
      return () => clearInterval(interval);
    } else {
      // Two cycles when not loading
      const t1 = window.setTimeout(() => setBreathCue('exhale'), phase); // 4-8s
      const t2 = window.setTimeout(() => setBreathCue('inhale'), phase * 2); // 8-12s
      const t3 = window.setTimeout(() => setBreathCue('exhale'), phase * 3); // 12-16s
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        window.clearTimeout(t3);
      };
    }
  }, [step, settings?.reduceMotion, isLoadingSummary]);

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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
              padding: '8px 14px',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            ··· More
          </button>
          <button
            type="button"
            onClick={next}
            disabled={step === 0 && isLoadingSummary}
            aria-label="Next"
            style={{
              background:
                step === 0 && isLoadingSummary
                  ? 'rgba(100, 116, 139, 0.5)'
                  : 'linear-gradient(135deg, #60a5fa, #3b82f6)',
              border: '1px solid rgba(226,232,240,0.25)',
              color:
                step === 0 && isLoadingSummary
                  ? 'rgba(226,232,240,0.5)'
                  : '#fff',
              borderRadius: 999,
              padding: '8px 14px',
              fontWeight: 700,
              cursor:
                step === 0 && isLoadingSummary ? 'not-allowed' : 'pointer',
              opacity: step === 0 && isLoadingSummary ? 0.6 : 1,
            }}
          >
            {step === 0 && isLoadingSummary ? 'Preparing...' : 'Next →'}
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
              <div style={{ marginBottom: 32 }}>
                <BreathingOrb
                  enabled={!settings?.reduceMotion}
                  duration={8}
                  iterations={isLoadingSummary ? Infinity : 2}
                  size={140}
                  mode="pulse"
                />
              </div>
              <h1
                style={{
                  fontSize: 28,
                  margin: 0,
                  fontWeight: 800,
                  transition: 'opacity 0.5s ease-in-out',
                }}
              >
                {isLoadingSummary
                  ? meditativePhrases[currentPhraseIndex]
                  : 'Find your breath'}
              </h1>
              {!isLoadingSummary && (
                <p
                  style={{
                    marginTop: 12,
                    color: '#cbd5e1',
                    fontSize: 16,
                  }}
                >
                  {breathCue === 'inhale' && 'Inhale…'}
                  {breathCue === 'exhale' && 'Exhale…'}
                </p>
              )}
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
              <div
                style={{
                  position: 'relative',
                  maxWidth: 720,
                  margin: '0 auto',
                }}
              >
                <textarea
                  aria-label="Reflection answer 1"
                  value={
                    voiceInputStates[0].interimText
                      ? answers[0]
                        ? `${answers[0]} ${voiceInputStates[0].interimText}`
                        : voiceInputStates[0].interimText
                      : answers[0]
                  }
                  onChange={(e) => {
                    const newValue = e.target.value;
                    const lastValue = lastTextValueRef.current[0];

                    // Detect typing and pause voice if recording
                    if (
                      newValue !== lastValue &&
                      voiceInput0.isRecording &&
                      !voiceInput0.isPaused
                    ) {
                      voiceInput0.pauseRecording();

                      if (typingTimerRef.current) {
                        clearTimeout(typingTimerRef.current);
                      }

                      typingTimerRef.current = setTimeout(() => {
                        if (voiceInput0.isRecording && voiceInput0.isPaused) {
                          voiceInput0.resumeRecording();
                        }
                      }, 2000);
                    }

                    setAnswers((prev) => [newValue, prev[1] ?? '']);
                    lastTextValueRef.current[0] = newValue;
                  }}
                  style={{
                    width: '100%',
                    minHeight: 120,
                    background: voiceInput0.isRecording
                      ? 'rgba(59,130,246,0.1)'
                      : 'rgba(2,6,23,0.35)',
                    border: voiceInput0.isRecording
                      ? '1px solid rgba(59,130,246,0.4)'
                      : '1px solid rgba(226,232,240,0.25)',
                    borderRadius: 12,
                    color: '#f8fafc',
                    padding: 12,
                    fontSize: 14,
                    transition: 'background 0.3s ease, border 0.3s ease',
                  }}
                />
                {voiceInput0.isSupported && (
                  <div style={{ position: 'absolute', top: 8, right: 8 }}>
                    <VoiceToggleButton
                      isRecording={voiceInput0.isRecording}
                      onToggle={async () => {
                        if (voiceInput0.isRecording) {
                          voiceInput0.stopRecording();
                          if (settings.enableSound && audioManagerRef.current) {
                            audioManagerRef.current
                              .playVoiceStopCue()
                              .catch((err) => {
                                console.error(
                                  'Failed to play voice stop audio cue:',
                                  err
                                );
                              });
                          }
                        } else {
                          await voiceInput0.startRecording();
                        }
                      }}
                      disabled={false}
                      language={voiceInput0.effectiveLanguage}
                      languageName={voiceInput0.languageName}
                      isLanguageFallback={voiceInput0.isLanguageFallback}
                      reduceMotion={settings.reduceMotion}
                    />
                  </div>
                )}
              </div>

              {/* Unified Toolbar */}
              {(writerAvailable || rewriterAvailable) && (
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  {writerAvailable && !answers[0] && (
                    <button
                      type="button"
                      onClick={() => handleGenerateDraft(0)}
                      disabled={isDraftGenerating[0]}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(96,165,250,0.3)',
                        color: '#60a5fa',
                        borderRadius: 8,
                        padding: '7px 12px',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: isDraftGenerating[0] ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        opacity: isDraftGenerating[0] ? 0.6 : 1,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      <span>
                        {isDraftGenerating[0] ? 'Generating...' : 'Generate'}
                      </span>
                    </button>
                  )}

                  {rewriterAvailable &&
                    answers[0] &&
                    answers[0].trim().length > 20 && (
                      <>
                        <div
                          style={{
                            width: 1,
                            height: 20,
                            background: 'rgba(226,232,240,0.15)',
                          }}
                        />
                        <TonePresetChips
                          selectedTone={selectedTone}
                          onToneSelect={handleToneSelect}
                          disabled={isRewriting[0]}
                          isLoading={isRewriting[0]}
                        />
                      </>
                    )}
                </div>
              )}

              {/* Rewrite Preview */}
              {rewritePreview?.index === 0 && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 14,
                    background: 'rgba(59,130,246,0.08)',
                    border: '1px solid rgba(59,130,246,0.25)',
                    borderRadius: 12,
                    maxWidth: 720,
                    margin: '16px auto 0',
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
                  >
                    {rewritePreview.rewritten}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={handleAcceptRewrite}
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
                    <button
                      type="button"
                      onClick={handleDiscardRewrite}
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
                  </div>
                </div>
              )}
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
              <div
                style={{
                  position: 'relative',
                  maxWidth: 720,
                  margin: '0 auto',
                }}
              >
                <textarea
                  aria-label="Reflection answer 2"
                  value={
                    voiceInputStates[1].interimText
                      ? answers[1]
                        ? `${answers[1]} ${voiceInputStates[1].interimText}`
                        : voiceInputStates[1].interimText
                      : answers[1]
                  }
                  onChange={(e) => {
                    const newValue = e.target.value;
                    const lastValue = lastTextValueRef.current[1];

                    // Detect typing and pause voice if recording
                    if (
                      newValue !== lastValue &&
                      voiceInput1.isRecording &&
                      !voiceInput1.isPaused
                    ) {
                      voiceInput1.pauseRecording();

                      if (typingTimerRef.current) {
                        clearTimeout(typingTimerRef.current);
                      }

                      typingTimerRef.current = setTimeout(() => {
                        if (voiceInput1.isRecording && voiceInput1.isPaused) {
                          voiceInput1.resumeRecording();
                        }
                      }, 2000);
                    }

                    setAnswers((prev) => [prev[0] ?? '', newValue]);
                    lastTextValueRef.current[1] = newValue;
                  }}
                  style={{
                    width: '100%',
                    minHeight: 120,
                    background: voiceInput1.isRecording
                      ? 'rgba(59,130,246,0.1)'
                      : 'rgba(2,6,23,0.35)',
                    border: voiceInput1.isRecording
                      ? '1px solid rgba(59,130,246,0.4)'
                      : '1px solid rgba(226,232,240,0.25)',
                    borderRadius: 12,
                    color: '#f8fafc',
                    padding: 12,
                    fontSize: 14,
                    transition: 'background 0.3s ease, border 0.3s ease',
                  }}
                />
                {voiceInput1.isSupported && (
                  <div style={{ position: 'absolute', top: 8, right: 8 }}>
                    <VoiceToggleButton
                      isRecording={voiceInput1.isRecording}
                      onToggle={async () => {
                        if (voiceInput1.isRecording) {
                          voiceInput1.stopRecording();
                          if (settings.enableSound && audioManagerRef.current) {
                            audioManagerRef.current
                              .playVoiceStopCue()
                              .catch((err) => {
                                console.error(
                                  'Failed to play voice stop audio cue:',
                                  err
                                );
                              });
                          }
                        } else {
                          await voiceInput1.startRecording();
                        }
                      }}
                      disabled={false}
                      language={voiceInput1.effectiveLanguage}
                      languageName={voiceInput1.languageName}
                      isLanguageFallback={voiceInput1.isLanguageFallback}
                      reduceMotion={settings.reduceMotion}
                    />
                  </div>
                )}
              </div>

              {/* Unified Toolbar */}
              {(writerAvailable || rewriterAvailable) && (
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  {writerAvailable && !answers[1] && (
                    <button
                      type="button"
                      onClick={() => handleGenerateDraft(1)}
                      disabled={isDraftGenerating[1]}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(96,165,250,0.3)',
                        color: '#60a5fa',
                        borderRadius: 8,
                        padding: '7px 12px',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: isDraftGenerating[1] ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        opacity: isDraftGenerating[1] ? 0.6 : 1,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      <span>
                        {isDraftGenerating[1] ? 'Generating...' : 'Generate'}
                      </span>
                    </button>
                  )}

                  {rewriterAvailable &&
                    answers[1] &&
                    answers[1].trim().length > 20 && (
                      <>
                        <div
                          style={{
                            width: 1,
                            height: 20,
                            background: 'rgba(226,232,240,0.15)',
                          }}
                        />
                        <TonePresetChips
                          selectedTone={selectedTone}
                          onToneSelect={handleToneSelect}
                          disabled={isRewriting[1]}
                          isLoading={isRewriting[1]}
                        />
                      </>
                    )}
                </div>
              )}

              {/* Rewrite Preview */}
              {rewritePreview?.index === 1 && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 14,
                    background: 'rgba(59,130,246,0.08)',
                    border: '1px solid rgba(59,130,246,0.25)',
                    borderRadius: 12,
                    maxWidth: 720,
                    margin: '16px auto 0',
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
                  >
                    {rewritePreview.rewritten}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={handleAcceptRewrite}
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
                    <button
                      type="button"
                      onClick={handleDiscardRewrite}
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
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {Nav}

        {/* More panel (bottom-right) */}
        {showMore && (
          <div
            style={{
              position: 'absolute',
              right: 24,
              bottom: 72,
              width: 340,
              background: 'rgba(2,8,23,0.8)',
              border: '1px solid rgba(226,232,240,0.18)',
              borderRadius: 12,
              boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
              color: '#e2e8f0',
              padding: 14,
              backdropFilter: 'blur(10px) saturate(110%)',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>
              Tools
            </div>

            {/* Summary format (only on Summary step) */}
            <div style={{ marginBottom: 12, opacity: step === 1 ? 1 : 0.7 }}>
              <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 6 }}>
                Summary format
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  disabled={!onFormatChange || step !== 1}
                  onClick={() => {
                    if (onFormatChange) void onFormatChange('bullets');
                  }}
                  style={{
                    background:
                      onFormatChange && currentFormat === 'bullets'
                        ? 'rgba(59,130,246,0.25)'
                        : 'transparent',
                    border: '1px solid rgba(226,232,240,0.25)',
                    color: '#e2e8f0',
                    borderRadius: 8,
                    padding: '6px 10px',
                    cursor:
                      onFormatChange && step === 1 ? 'pointer' : 'default',
                  }}
                >
                  Bullets
                </button>
                <button
                  type="button"
                  disabled={!onFormatChange || step !== 1}
                  onClick={() => {
                    if (onFormatChange) void onFormatChange('paragraph');
                  }}
                  style={{
                    background:
                      onFormatChange && currentFormat === 'paragraph'
                        ? 'rgba(59,130,246,0.25)'
                        : 'transparent',
                    border: '1px solid rgba(226,232,240,0.25)',
                    color: '#e2e8f0',
                    borderRadius: 8,
                    padding: '6px 10px',
                    cursor:
                      onFormatChange && step === 1 ? 'pointer' : 'default',
                  }}
                >
                  Paragraph
                </button>
                <button
                  type="button"
                  disabled={!onFormatChange || step !== 1}
                  onClick={() => {
                    if (onFormatChange) void onFormatChange('headline-bullets');
                  }}
                  style={{
                    background:
                      onFormatChange && currentFormat === 'headline-bullets'
                        ? 'rgba(59,130,246,0.25)'
                        : 'transparent',
                    border: '1px solid rgba(226,232,240,0.25)',
                    color: '#e2e8f0',
                    borderRadius: 8,
                    padding: '6px 10px',
                    cursor:
                      onFormatChange && step === 1 ? 'pointer' : 'default',
                  }}
                >
                  Headline + Bullets
                </button>
              </div>
            </div>

            {/* Ambient sound */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 6 }}>
                Ambient sound
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => {
                    const next = !isMuted;
                    setIsMuted(next);
                    onToggleAmbient?.(next);
                  }}
                  style={{
                    background: isMuted
                      ? 'transparent'
                      : 'rgba(59,130,246,0.25)',
                    border: '1px solid rgba(226,232,240,0.25)',
                    color: '#e2e8f0',
                    borderRadius: 8,
                    padding: '6px 10px',
                  }}
                >
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>
              </div>
            </div>

            {/* Translation */}
            <div style={{ marginBottom: 6 }}>
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
              </div>
            </div>

            {/* Proofread current answer */}
            {(step === 2 || step === 3) && (
              <div>
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

        {/* Voice Input Error Notification */}
        {voiceError && (
          <Notification
            title="Voice Input Error"
            message={voiceError.message}
            type="error"
            duration={5000}
            onClose={() => setVoiceError(null)}
          />
        )}

        {/* Auto-Stop Notification */}
        {autoStopNotification && (
          <Notification
            title="Voice Input Stopped"
            message="Recording stopped after silence detected"
            type="info"
            duration={3000}
            onClose={() => setAutoStopNotification(false)}
          />
        )}

        {/* Language Fallback Notification */}
        {languageFallbackNotification.show && (
          <Notification
            title="Language Not Supported"
            message={`The selected language is not supported. Using ${languageFallbackNotification.languageName} instead.`}
            type="warning"
            duration={5000}
            onClose={() =>
              setLanguageFallbackNotification({ show: false, languageName: '' })
            }
          />
        )}

        {/* Voice Enhancement Prompt */}
        {showVoiceEnhancePrompt.show && (
          <div
            style={{
              position: 'fixed',
              bottom: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(2,8,23,0.95)',
              border: '1px solid rgba(59,130,246,0.4)',
              borderRadius: 12,
              padding: '12px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(10px)',
              zIndex: 10001,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              maxWidth: 400,
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#60a5fa',
                  marginBottom: 4,
                }}
              >
                Enhance your reflection?
              </div>
              <div style={{ fontSize: 12, color: '#cbd5e1' }}>
                Make it clearer or adjust the tone
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => {
                  void handleToneSelect('concise');
                  setShowVoiceEnhancePrompt({ show: false, index: 0 });
                }}
                style={{
                  background: 'rgba(59,130,246,0.15)',
                  border: '1px solid rgba(59,130,246,0.4)',
                  color: '#60a5fa',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                ✂️ Concise
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleToneSelect('empathetic');
                  setShowVoiceEnhancePrompt({ show: false, index: 0 });
                }}
                style={{
                  background: 'rgba(59,130,246,0.15)',
                  border: '1px solid rgba(59,130,246,0.4)',
                  color: '#60a5fa',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                💙 Warmth
              </button>
              <button
                type="button"
                onClick={() =>
                  setShowVoiceEnhancePrompt({ show: false, index: 0 })
                }
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(226,232,240,0.25)',
                  color: '#94a3b8',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
