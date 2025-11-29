import React, { useEffect, useRef, useState, useCallback } from 'react';
import type {
  Settings,
  SummaryFormat,
  LanguageDetection,
  TonePreset,
  ProofreadResult,
  VoiceInputMetadata,
} from '../../../types';
import { trapFocus } from '../../../utils/accessibility';
import { devLog, devWarn, devError } from '../../../utils/logger';

import { Notification } from '../Notification';
import type { AIResponse } from '../../../types';
import { BreathingPhase } from './BreathingPhase';
import { SummaryPhase } from './SummaryPhase';
import { ReflectionInput } from './ReflectionInput';
import { ToolsSection } from './ToolsSection';
import {
  useWriterStreaming,
  useRewritePreview,
  useProofreadResult,
  useVoiceInputManager,
  useOverlayKeyboardShortcuts,
} from './hooks';
import '../../styles.css';

/**
 * Translation-related configuration
 */
export interface TranslationConfig {
  onTranslateToEnglish?: () => Promise<void>;
  onTranslate?: (targetLanguage: string) => Promise<void>;
  isTranslating?: boolean;
  languageDetection?: LanguageDetection;
  summaryLanguageDetection?: LanguageDetection;
}

/**
 * Audio/ambient-related configuration
 */
export interface AudioConfig {
  ambientMuted?: boolean;
  onToggleAmbient?: (mute: boolean) => void;
}

/**
 * Summary display configuration
 */
export interface SummaryConfig {
  summary: string[];
  summaryDisplay?: string[];
  currentFormat?: SummaryFormat;
  onFormatChange?: (format: SummaryFormat) => Promise<void>;
  isLoadingSummary?: boolean;
}

interface MeditationFlowOverlayProps {
  /** Summary configuration */
  summaryConfig: SummaryConfig;
  /** Reflection prompts */
  prompts: string[];
  /** Save handler */
  onSave: (
    reflections: string[],
    voiceMetadata?: VoiceInputMetadata[],
    originalReflections?: (string | null)[]
  ) => void;
  /** Cancel handler */
  onCancel: () => void;
  /** User settings */
  settings: Settings;
  /** Proofread handler */
  onProofread?: (text: string, index: number) => Promise<ProofreadResult>;
  /** Whether proofreader is available */
  proofreaderAvailable?: boolean;
  /** Translation configuration (optional) */
  translationConfig?: TranslationConfig;
  /** Audio configuration (optional) */
  audioConfig?: AudioConfig;
  /** Rewrite handler (experimental) */
  onRewrite?: (
    text: string,
    tone: TonePreset,
    index: number
  ) => Promise<{ original: string; rewritten: string }>;
  /** Rewriting state per input */
  isRewriting?: boolean[];
  /** Reduce motion preference */
  reduceMotion?: boolean;
  /** Toggle reduce motion handler */
  onToggleReduceMotion?: (enabled: boolean) => void;
}

export const MeditationFlowOverlay: React.FC<MeditationFlowOverlayProps> = ({
  summaryConfig,
  prompts,
  onSave,
  onCancel,
  settings,
  onProofread,
  proofreaderAvailable = false,
  translationConfig,
  audioConfig,
  reduceMotion: _reduceMotion = false,
  onToggleReduceMotion: _onToggleReduceMotion,
}) => {
  // Destructure summary config
  const {
    summary,
    summaryDisplay,
    currentFormat = 'bullets',
    onFormatChange,
    isLoadingSummary = false,
  } = summaryConfig;

  // Destructure translation config with defaults
  const {
    onTranslateToEnglish: _onTranslateToEnglish,
    onTranslate: _onTranslate,
    isTranslating: _isTranslating = false,
    languageDetection,
    summaryLanguageDetection,
  } = translationConfig ?? {};

  // Destructure audio config with defaults
  const {
    ambientMuted: _ambientMuted = false,
    onToggleAmbient: _onToggleAmbient,
  } = audioConfig ?? {};
  const contentRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<string[]>(['', '']);

  const [breathCue, setBreathCue] = useState<'inhale' | 'hold' | 'exhale'>(
    'inhale'
  );
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState<number>(0);

  // Refs needed by hooks and handlers
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTextValueRef = useRef<string[]>(['', '']);

  // Writer streaming hook
  const {
    writerTargetTextRef,
    writerDisplayIndexRef,
    writerAnimationTimerRef,
    writerStreamCleanupRef,
    startWriterAnimation,
    setIsDraftGenerating,
  } = useWriterStreaming(setAnswers, lastTextValueRef);

  // Rewrite preview hook (replaces inline state)
  const {
    preview: rewritePreview,
    setPreview: setRewritePreview,
    acceptRewrite,
    discardRewrite,
  } = useRewritePreview();

  // Proofread result hook (replaces inline state)
  const {
    result: proofreadResult,
    setResult: setProofreadResult,
    acceptProofread,
    discardProofread,
  } = useProofreadResult();

  const [writerAvailable, setWriterAvailable] = useState<boolean>(false);
  const [rewriterAvailable, setRewriterAvailable] = useState<boolean>(false);
  const [showVoiceEnhancePrompt, setShowVoiceEnhancePrompt] = useState<{
    show: boolean;
    index: number;
  }>({ show: false, index: 0 });

  const [isProofreading, setIsProofreading] = useState<boolean[]>([
    false,
    false,
  ]);

  // Keep tone selection per reflection input (index 0 and 1)
  const [_selectedTones, setSelectedTones] = useState<
    (TonePreset | undefined)[]
  >([undefined, undefined]);

  const [_isRewriting, setIsRewriting] = useState<boolean[]>([false, false]);

  // Voice input transcript handlers
  const handleTranscript0 = useCallback((text: string, isFinal: boolean) => {
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
    }
  }, []);

  const handleTranscript1 = useCallback((text: string, isFinal: boolean) => {
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
    }
  }, []);

  // Voice input manager hook (replaces inline voice input management)
  const {
    voiceInputs,
    voiceInputStates,
    voiceError,
    clearVoiceError,
    handleVoiceToggle,
    autoStopNotification,
    clearAutoStopNotification,
    languageFallbackNotification,
    clearLanguageFallbackNotification,
  } = useVoiceInputManager(
    {
      language:
        settings.voiceLanguage ??
        settings.preferredTranslationLanguage ??
        navigator.language,
      autoStopDelay: settings.voiceAutoStopDelay ?? 3000,
      enableSound: settings.enableSound,
      settings,
    },
    handleTranscript0,
    handleTranscript1
  );

  const [voiceInput0, voiceInput1] = voiceInputs;

  // Writer stream cleanup effect
  // NECESSARY: Cleanup effect to clear writer stream connections and animation timers on unmount
  // This prevents memory leaks and ensures streams are properly disconnected
  useEffect(() => {
    const cleanupRef = [...writerStreamCleanupRef.current];
    const timersSnapshot = [...writerAnimationTimerRef.current];
    return () => {
      cleanupRef.forEach((cleanup) => {
        cleanup?.();
      });
      timersSnapshot.forEach((timer, index) => {
        if (timer) {
          window.clearTimeout(timer);
          timersSnapshot[index] = 0;
        }
      });
      writerAnimationTimerRef.current = timersSnapshot;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // NECESSARY: Focus trap for accessibility - keeps keyboard focus within modal
  useEffect(() => {
    if (!contentRef.current) return;
    return trapFocus(contentRef.current, onCancel);
  }, [onCancel]);

  // NECESSARY: Async initialization to check AI API availability on mount
  // Cannot be replaced with useMemo as it requires async chrome.runtime.sendMessage
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
        devError('Error checking API availability:', error);
      }
    };

    void checkAPIs();
  }, []);

  // Generate draft using Writer API
  const handleGenerateDraft = useCallback(
    async (index: 0 | 1) => {
      if (!writerAvailable) return;

      const existingCleanup = writerStreamCleanupRef.current[index];
      if (existingCleanup) {
        existingCleanup();
        writerStreamCleanupRef.current[index] = undefined;
      }

      setIsDraftGenerating((prev) => {
        const next = [...prev];
        next[index] = true;
        return next;
      });

      setAnswers((prev) => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      lastTextValueRef.current[index] = '';
      writerTargetTextRef.current[index] = '';
      writerDisplayIndexRef.current[index] = 0;
      if (writerAnimationTimerRef.current[index]) {
        window.clearTimeout(writerAnimationTimerRef.current[index]);
        writerAnimationTimerRef.current[index] = 0;
      }

      const prompt = prompts[index];
      const summaryContext = summary.join('\n');
      const writerPrompt = `${prompt}\n\nContext: ${summaryContext}`;

      const attemptStreaming = () =>
        new Promise<string>((resolve, reject) => {
          let aggregated = '';
          const port = chrome.runtime.connect({ name: 'ai-stream' });
          const requestId = `writer-stream-${Date.now()}-${Math.random().toString(16).slice(2)}`;
          let closed = false;

          const cleanup = () => {
            if (closed) return;
            closed = true;
            try {
              port.disconnect();
            } catch (disconnectError) {
              devWarn('Writer stream disconnect warning:', disconnectError);
            }
          };

          writerStreamCleanupRef.current[index] = () => {
            cleanup();
            writerStreamCleanupRef.current[index] = undefined;
          };

          port.onDisconnect.addListener(() => {
            if (closed) return;
            closed = true;
            writerStreamCleanupRef.current[index] = undefined;
            reject(new Error('Writer stream disconnected'));
          });

          port.onMessage.addListener((rawMessage) => {
            if (!rawMessage || typeof rawMessage !== 'object') return;

            const message = rawMessage as {
              requestId?: string;
              event?: string;
              data?: unknown;
              error?: unknown;
            };

            if (message.requestId !== requestId) return;

            switch (message.event) {
              case 'chunk': {
                const chunk =
                  typeof message.data === 'string' ? message.data : '';
                if (!chunk) return;
                aggregated += chunk;
                writerTargetTextRef.current[index] = aggregated;
                if (!writerAnimationTimerRef.current[index]) {
                  writerDisplayIndexRef.current[index] = (
                    lastTextValueRef.current[index] ?? ''
                  ).length;
                  startWriterAnimation(index);
                }
                break;
              }
              case 'complete': {
                const finalData =
                  typeof message.data === 'string' && message.data.length > 0
                    ? message.data
                    : aggregated;
                aggregated = finalData;
                writerTargetTextRef.current[index] = aggregated;
                startWriterAnimation(index);
                cleanup();
                writerStreamCleanupRef.current[index] = undefined;
                resolve(aggregated);
                break;
              }
              case 'error': {
                const errorMessage =
                  typeof message.error === 'string'
                    ? message.error
                    : 'Writer stream error';
                cleanup();
                writerStreamCleanupRef.current[index] = undefined;
                reject(new Error(errorMessage));
                break;
              }
              default:
                break;
            }
          });

          try {
            port.postMessage({
              type: 'writer-stream',
              requestId,
              payload: {
                prompt: writerPrompt,
                options: { tone: 'neutral', length: 'short' },
              },
            });
          } catch (error) {
            cleanup();
            writerStreamCleanupRef.current[index] = undefined;
            reject(
              new Error(
                error instanceof Error
                  ? error.message
                  : 'Failed to start writer stream'
              )
            );
          }
        });

      try {
        await attemptStreaming();
      } catch (streamError) {
        devWarn(
          'Writer streaming failed, falling back to batch mode:',
          streamError
        );
        const cleanupAfterStream = writerStreamCleanupRef.current[index];
        if (cleanupAfterStream) {
          cleanupAfterStream();
          writerStreamCleanupRef.current[index] = undefined;
        }

        try {
          const response: AIResponse<string> = await chrome.runtime.sendMessage(
            {
              type: 'write',
              payload: {
                prompt: writerPrompt,
                options: { tone: 'neutral', length: 'short' },
              },
            }
          );

          if (response.success) {
            writerTargetTextRef.current[index] = response.data;
            writerDisplayIndexRef.current[index] = 0;
            startWriterAnimation(index, true);
          }
        } catch (error) {
          devError('Error generating draft:', error);
        }
      } finally {
        const finalCleanup = writerStreamCleanupRef.current[index];
        if (finalCleanup) {
          finalCleanup();
          writerStreamCleanupRef.current[index] = undefined;
        }
        setIsDraftGenerating((prev) => {
          const next = [...prev];
          next[index] = false;
          return next;
        });
      }
    },
    [
      writerAvailable,
      prompts,
      summary,
      startWriterAnimation,
      setIsDraftGenerating,
      writerTargetTextRef,
      writerDisplayIndexRef,
      writerAnimationTimerRef,
      writerStreamCleanupRef,
    ]
  );

  // Rewrite with selected tone
  const handleToneSelect = useCallback(
    async (tone: TonePreset) => {
      if (!rewriterAvailable) return;

      const index = step === 2 ? 0 : 1;
      const text = answers[index];

      if (!text || text.trim().length === 0) return;

      setSelectedTones((prev) => {
        const next = [...prev];
        next[index] = tone;
        return next;
      });
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
        devError('Error rewriting:', error);
      } finally {
        setIsRewriting((prev) => {
          const next = [...prev];
          next[index] = false;
          return next;
        });
      }
    },
    [rewriterAvailable, step, answers, summary, setRewritePreview]
  );

  // Accept rewrite using hook
  const handleAcceptRewrite = useCallback(() => {
    const rewrittenText = acceptRewrite();
    if (rewrittenText && rewritePreview) {
      setAnswers((prev) => {
        const next = [...prev];
        next[rewritePreview.index] = rewrittenText;
        lastTextValueRef.current[rewritePreview.index] = rewrittenText;
        return next;
      });
      setSelectedTones((prev) => {
        const next = [...prev];
        next[rewritePreview.index] = undefined;
        return next;
      });
    }
  }, [acceptRewrite, rewritePreview]);

  // Discard rewrite using hook
  const handleDiscardRewrite = useCallback(
    (index: 0 | 1) => {
      discardRewrite();
      setSelectedTones((prev) => {
        const next = [...prev];
        next[index] = undefined;
        return next;
      });
    },
    [discardRewrite]
  );

  // Accept proofread using hook
  const handleAcceptProofread = useCallback(
    (index: 0 | 1) => {
      const correctedText = acceptProofread(index);
      if (correctedText) {
        setAnswers((prev) => {
          const next = [...prev];
          next[index] = correctedText;
          lastTextValueRef.current[index] = correctedText;
          return next;
        });
      }
    },
    [acceptProofread]
  );

  // Discard proofread using hook
  const handleDiscardProofread = useCallback(() => {
    discardProofread();
  }, [discardProofread]);

  // Navigation functions
  const next = useCallback(() => {
    if (step === 0 && isLoadingSummary) return;
    setStep((s) => Math.min(3, s + 1));
  }, [step, isLoadingSummary]);

  const prev = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  // Keyboard shortcuts hook (replaces inline keyboard handling)
  const isProcessing =
    _isRewriting.some((v) => v) || isProofreading.some((v) => v);
  useOverlayKeyboardShortcuts({
    step,
    isLoadingSummary,
    isProcessing,
    writerAvailable,
    answers,
    onNext: next,
    onPrev: prev,
    onCancel,
    onGenerateDraft: handleGenerateDraft,
  });

  const save = useCallback(() => {
    const voiceMetadata: VoiceInputMetadata[] = answers.map((_, index) => {
      const voiceInput = index === 0 ? voiceInput0 : voiceInput1;
      const hasVoiceTranscription =
        voiceInputStates[index].isRecording ||
        (lastTextValueRef.current[index] !== '' &&
          voiceInput.hasPermission === true);

      if (!hasVoiceTranscription) {
        return { isVoiceTranscribed: false };
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
  }, [answers, voiceInput0, voiceInput1, voiceInputStates, onSave]);

  // Track previous loading state to detect when loading completes
  const prevLoadingRef = useRef<boolean | null>(null);

  // NECESSARY: Auto-advance effect that detects loading state transitions
  // Uses ref to track previous state - cannot be replaced with useMemo as it needs
  // to detect the transition from loading=true to loading=false
  useEffect(() => {
    devLog('[MeditationFlow] Auto-advance check:', {
      step,
      isLoadingSummary,
      prevLoading: prevLoadingRef.current,
    });

    if (
      step === 0 &&
      prevLoadingRef.current === true &&
      isLoadingSummary === false
    ) {
      devLog('[MeditationFlow] Loading complete, auto-advancing to summary');
      setStep(1);
    }

    prevLoadingRef.current = isLoadingSummary;
  }, [step, isLoadingSummary]);

  // NECESSARY: Timer-based breathing animation - manages intervals/timeouts for breath cues
  // Cannot be replaced with useMemo as it manages side effects (timers) and state updates
  useEffect(() => {
    if (step !== 0 || settings?.reduceMotion) return;

    const phase = 4000;
    setBreathCue('inhale');

    if (isLoadingSummary) {
      const interval = setInterval(() => {
        setBreathCue((prev) => (prev === 'inhale' ? 'exhale' : 'inhale'));
      }, phase);
      return () => clearInterval(interval);
    } else {
      const t1 = window.setTimeout(() => setBreathCue('exhale'), phase);
      const t2 = window.setTimeout(() => setBreathCue('inhale'), phase * 2);
      const t3 = window.setTimeout(() => setBreathCue('exhale'), phase * 3);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        window.clearTimeout(t3);
      };
    }
  }, [step, settings?.reduceMotion, isLoadingSummary]);

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

  const disableSave =
    _isRewriting.some((v) => v) || isProofreading.some((v) => v);
  const disableNext = (step === 0 && isLoadingSummary) || disableSave;

  const busyHint = 'Action unavailable while AI is working';
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
        disabled={step === 0 || disableSave}
        aria-disabled={step === 0 || disableSave}
        title={step === 0 || disableSave ? busyHint : 'Back'}
        aria-label="Previous"
        style={{
          background: 'transparent',
          border: '1px solid rgba(226,232,240,0.25)',
          color:
            step === 0 || disableSave ? 'rgba(226,232,240,0.35)' : '#e2e8f0',
          borderRadius: 999,
          padding: '8px 12px',
          cursor: step === 0 || disableSave ? 'not-allowed' : 'pointer',
          opacity: step === 0 || disableSave ? 0.6 : 1,
        }}
      >
        ← Back
      </button>
      {step < 3 ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ToolsSection
            step={step}
            currentScreen={step === 1 ? 'summary' : 'reflection'}
            currentFormat={currentFormat}
            onFormatChange={step === 1 ? onFormatChange : undefined}
            isLoadingSummary={isLoadingSummary}
            summary={summary}
            settings={settings}
            answers={answers}
            selectedTones={_selectedTones}
            onToneSelect={
              settings.experimentalMode && (step === 2 || step === 3)
                ? handleToneSelect
                : undefined
            }
            isRewriting={_isRewriting}
            onProofread={
              step === 2 || step === 3
                ? async (_index) => {
                    if (!onProofread) return;
                    const idx = step === 2 ? 0 : 1;
                    setIsProofreading((prev) => {
                      const next = [...prev];
                      next[idx] = true;
                      return next;
                    });
                    try {
                      const result = await onProofread(answers[idx] ?? '', idx);
                      setProofreadResult({ index: idx, result });
                    } catch {
                      // silent
                    } finally {
                      setIsProofreading((prev) => {
                        const next = [...prev];
                        next[idx] = false;
                        return next;
                      });
                    }
                  }
                : undefined
            }
            isProofreading={isProofreading}
            proofreaderAvailable={proofreaderAvailable}
            ambientMuted={_ambientMuted}
            onToggleAmbient={_onToggleAmbient}
            reduceMotion={_reduceMotion}
            onToggleReduceMotion={_onToggleReduceMotion}
            onTranslateSummary={
              settings.enableTranslation ? _onTranslate : undefined
            }
            isTranslating={
              settings.enableTranslation ? (_isTranslating ?? false) : false
            }
            summaryLanguageDetection={summaryLanguageDetection}
            defaultTargetLanguage={settings.preferredTranslationLanguage}
            onGenerateDraft={
              settings.experimentalMode &&
              (step === 2 || step === 3) &&
              !answers[step - 2]?.trim()
                ? (draft) => {
                    const idx = step - 2;
                    setAnswers((prev) => {
                      const next = [...prev];
                      next[idx] = draft;
                      return next;
                    });
                  }
                : undefined
            }
          />
          <button
            type="button"
            onClick={next}
            disabled={disableNext}
            aria-disabled={disableNext}
            title={disableNext ? busyHint : 'Next'}
            aria-label="Next"
            style={{
              background: disableNext
                ? 'rgba(100, 116, 139, 0.5)'
                : 'linear-gradient(135deg, #60a5fa, #3b82f6)',
              border: '1px solid rgba(226,232,240,0.25)',
              color: disableNext ? 'rgba(226,232,240,0.5)' : '#fff',
              borderRadius: 999,
              padding: '8px 14px',
              minWidth: 110,
              textAlign: 'center',
              fontWeight: 700,
              cursor: disableNext ? 'not-allowed' : 'pointer',
              opacity: disableNext ? 0.6 : 1,
            }}
          >
            {disableNext && step === 0 && isLoadingSummary
              ? 'Preparing...'
              : 'Next →'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ToolsSection
            step={3}
            currentScreen="reflection"
            currentFormat={currentFormat}
            onFormatChange={undefined}
            isLoadingSummary={isLoadingSummary}
            summary={summary}
            settings={settings}
            answers={answers}
            selectedTones={_selectedTones}
            onToneSelect={
              settings.experimentalMode ? handleToneSelect : undefined
            }
            isRewriting={_isRewriting}
            onProofread={async (_index) => {
              if (!onProofread) return;
              try {
                setIsProofreading((prev) => {
                  const next = [...prev];
                  next[1] = true;
                  return next;
                });
                const result = await onProofread(answers[1] ?? '', 1);
                setProofreadResult({ index: 1, result });
              } catch {
                // silent
              } finally {
                setIsProofreading((prev) => {
                  const next = [...prev];
                  next[1] = false;
                  return next;
                });
              }
            }}
            isProofreading={isProofreading}
            proofreaderAvailable={proofreaderAvailable}
            ambientMuted={_ambientMuted}
            onToggleAmbient={_onToggleAmbient}
            reduceMotion={_reduceMotion}
            onToggleReduceMotion={_onToggleReduceMotion}
            onTranslateSummary={
              settings.enableTranslation ? _onTranslate : undefined
            }
            isTranslating={
              settings.enableTranslation ? (_isTranslating ?? false) : false
            }
            summaryLanguageDetection={summaryLanguageDetection}
            defaultTargetLanguage={settings.preferredTranslationLanguage}
            onGenerateDraft={
              settings.experimentalMode && !answers[1]?.trim()
                ? (draft) => {
                    setAnswers((prev) => {
                      const next = [...prev];
                      next[1] = draft;
                      return next;
                    });
                  }
                : undefined
            }
          />
          <button
            type="button"
            onClick={save}
            aria-label="Save reflection"
            style={{
              background: disableSave
                ? 'rgba(34,197,94,0.4)'
                : 'linear-gradient(135deg, #22c55e, #16a34a)',
              border: '1px solid rgba(226,232,240,0.25)',
              color: disableSave ? 'rgba(255,255,255,0.7)' : '#fff',
              borderRadius: 999,
              padding: '8px 14px',
              minWidth: 110,
              textAlign: 'center',
              fontWeight: 800,
              cursor: disableSave ? 'not-allowed' : 'pointer',
            }}
            disabled={disableSave}
            aria-disabled={disableSave}
            title={disableSave ? busyHint : 'Save reflection'}
          >
            Save
          </button>
        </div>
      )}
    </div>
  );

  // Keyboard navigation for React events (arrows, esc, enter)
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
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
            <BreathingPhase
              isLoadingSummary={isLoadingSummary}
              settings={settings}
              breathCue={breathCue}
              setBreathCue={setBreathCue}
              currentPhraseIndex={currentPhraseIndex}
              setCurrentPhraseIndex={setCurrentPhraseIndex}
            />
          )}

          {step === 1 && (
            <SummaryPhase
              summary={summary}
              summaryDisplay={summaryDisplay}
              currentFormat={currentFormat}
              isLoadingSummary={isLoadingSummary}
              languageDetection={languageDetection}
            />
          )}

          {step === 2 && (
            <ReflectionInput
              index={0}
              prompt={prompts[0] ?? 'What did you find most interesting?'}
              answer={answers[0] ?? ''}
              setAnswer={(value) => {
                setAnswers((prev) => [value, prev[1] ?? '']);
              }}
              voiceInput={voiceInput0}
              voiceInputState={voiceInputStates[0]}
              settings={settings}
              rewritePreview={rewritePreview}
              onDiscardRewrite={() => handleDiscardRewrite(0)}
              onAcceptRewrite={handleAcceptRewrite}
              proofreadResult={proofreadResult}
              onDiscardProofread={handleDiscardProofread}
              onAcceptProofread={() => handleAcceptProofread(0)}
              lastTextValueRef={lastTextValueRef}
              typingTimerRef={typingTimerRef}
              onVoiceToggle={() => handleVoiceToggle(0)}
            />
          )}

          {step === 3 && (
            <ReflectionInput
              index={1}
              prompt={prompts[1] ?? 'How might you apply this?'}
              answer={answers[1] ?? ''}
              setAnswer={(value) => {
                setAnswers((prev) => [prev[0] ?? '', value]);
              }}
              voiceInput={voiceInput1}
              voiceInputState={voiceInputStates[1]}
              settings={settings}
              rewritePreview={rewritePreview}
              onDiscardRewrite={() => handleDiscardRewrite(1)}
              onAcceptRewrite={handleAcceptRewrite}
              proofreadResult={proofreadResult}
              onDiscardProofread={handleDiscardProofread}
              onAcceptProofread={() => handleAcceptProofread(1)}
              lastTextValueRef={lastTextValueRef}
              typingTimerRef={typingTimerRef}
              onVoiceToggle={() => handleVoiceToggle(1)}
            />
          )}
        </div>

        {Nav}

        {/* Voice Input Error Notification */}
        {voiceError && (
          <Notification
            title="Voice Input Error"
            message={voiceError.message}
            type="error"
            duration={5000}
            onClose={clearVoiceError}
          />
        )}

        {/* Auto-Stop Notification */}
        {autoStopNotification && (
          <Notification
            title="Voice Input Stopped"
            message="Recording stopped after silence detected"
            type="info"
            duration={3000}
            onClose={clearAutoStopNotification}
          />
        )}

        {/* Language Fallback Notification */}
        {languageFallbackNotification.show && (
          <Notification
            title="Language Not Supported"
            message={`The selected language is not supported. Using ${languageFallbackNotification.languageName} instead.`}
            type="warning"
            duration={5000}
            onClose={clearLanguageFallbackNotification}
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
