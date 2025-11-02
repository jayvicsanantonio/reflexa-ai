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

import { Notification } from './Notification';
import { useVoiceInput } from '../hooks/useVoiceInput';
import type { VoiceInputError } from '../hooks/useVoiceInput';
import { AudioManager } from '../../utils/audioManager';
import type { AIResponse } from '../../types';
import {
  BreathingPhase,
  SummaryPhase,
  ReflectionInput,
  ToolsSection,
  useWriterStreaming,
} from './MeditationFlowOverlay/index';
import '../styles.css';

interface MeditationFlowOverlayProps {
  summary: string[];
  summaryDisplay?: string[];
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
  summaryLanguageDetection?: LanguageDetection;
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
  reduceMotion?: boolean;
  onToggleReduceMotion?: (enabled: boolean) => void;
  // removed translated target pill per request
}

export const MeditationFlowOverlay: React.FC<MeditationFlowOverlayProps> = ({
  summary,
  summaryDisplay,
  prompts,
  onSave,
  onCancel,
  settings,
  onFormatChange,
  currentFormat = 'bullets',
  isLoadingSummary = false,
  languageDetection,
  summaryLanguageDetection,
  onProofread,
  onTranslateToEnglish: _onTranslateToEnglish,
  onTranslate: _onTranslate,
  isTranslating: _isTranslating,
  proofreaderAvailable = false,
  ambientMuted: _ambientMuted = false,
  onToggleAmbient: _onToggleAmbient,
  reduceMotion: _reduceMotion = false,
  onToggleReduceMotion: _onToggleReduceMotion,
}) => {
  // Summary display is handled by SummaryPhase component
  const contentRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<number>(0); // 0: settle, 1: summary, 2: q1, 3: q2
  const [answers, setAnswers] = useState<string[]>(['', '']);

  const [breathCue, setBreathCue] = useState<'inhale' | 'hold' | 'exhale'>(
    'inhale'
  );
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState<number>(0);

  // Refs needed by hooks and handlers
  const audioManagerRef = useRef<AudioManager | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
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
  // Resume silently if initial step/answers exist (popup removed)
  const [voiceInputStates, setVoiceInputStates] = useState<
    { isRecording: boolean; interimText: string }[]
  >([
    { isRecording: false, interimText: '' },
    { isRecording: false, interimText: '' },
  ]);
  const [voiceError, setVoiceError] = useState<VoiceInputError | null>(null);
  const [autoStopNotification, setAutoStopNotification] =
    useState<boolean>(false);

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

  const [proofreadResult, setProofreadResult] = useState<{
    index: number;
    result: ProofreadResult;
  } | null>(null);
  const [isProofreading, setIsProofreading] = useState<boolean[]>([
    false,
    false,
  ]);
  const [languageFallbackNotification, setLanguageFallbackNotification] =
    useState<{ show: boolean; languageName: string }>({
      show: false,
      languageName: '',
    });

  // Writer/Rewriter state (used in handlers, not directly in JSX)
  // Managed by useWriterStreaming hook

  // Keep tone selection per reflection input (index 0 and 1)
  const [_selectedTones, setSelectedTones] = useState<
    (TonePreset | undefined)[]
  >([undefined, undefined]);

  const [_isRewriting, setIsRewriting] = useState<boolean[]>([false, false]);

  // Meditative phrases are now managed by BreathingPhase component

  // Voice input handlers for answer field 0
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

      setVoiceInputStates((prev) => {
        const newStates = [...prev];
        newStates[0].interimText = '';
        return newStates;
      });

      // Voice enhancement prompt disabled
      // if (rewriterAvailable && text.trim().length > 30) {
      //   setTimeout(() => {
      //     setShowVoiceEnhancePrompt({ show: true, index: 0 });
      //   }, 1000);
      // }
    } else {
      setVoiceInputStates((prev) => {
        const newStates = [...prev];
        newStates[0].interimText = text;
        return newStates;
      });
    }
  }, []);

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

      setVoiceInputStates((prev) => {
        const newStates = [...prev];
        newStates[1].interimText = '';
        return newStates;
      });

      // Voice enhancement prompt disabled
      // if (rewriterAvailable && text.trim().length > 30) {
      //   setTimeout(() => {
      //     setShowVoiceEnhancePrompt({ show: true, index: 1 });
      //   }, 1000);
      // }
    } else {
      setVoiceInputStates((prev) => {
        const newStates = [...prev];
        newStates[1].interimText = text;
        return newStates;
      });
    }
  }, []);

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
  }, []); // writerAnimationTimerRef and writerStreamCleanupRef are stable refs from hook

  // Writer animation is now managed by useWriterStreaming hook

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
      // Capture current timer value for cleanup
      const timer = typingTimerRef.current;
      if (timer) {
        clearTimeout(timer);
      }
    };
    // typingTimerRef is stable ref, but included for linter completeness
  }, [settings, typingTimerRef]);

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
          const requestId = `writer-stream-${Date.now()}-${Math.random()
            .toString(16)
            .slice(2)}`;
          let closed = false;

          const cleanup = () => {
            if (closed) return;
            closed = true;
            try {
              port.disconnect();
            } catch (disconnectError) {
              console.warn(
                'Writer stream disconnect warning:',
                disconnectError
              );
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
        console.warn(
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
          console.error('Error generating draft:', error);
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
      // Refs are stable from hook, but included for completeness
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
    setSelectedTones((prev) => {
      const next = [...prev];
      next[rewritePreview.index] = undefined;
      return next;
    });
  }, [rewritePreview]);

  // Discard rewrite
  const handleDiscardRewrite = useCallback((index: 0 | 1) => {
    setRewritePreview(null);
    setSelectedTones((prev) => {
      const next = [...prev];
      next[index] = undefined;
      return next;
    });
  }, []);

  // Accept proofread
  const handleAcceptProofread = useCallback(
    (index: 0 | 1) => {
      if (proofreadResult?.index === index) {
        setAnswers((prev) => {
          const next = [...prev];
          next[index] = proofreadResult.result.correctedText;
          lastTextValueRef.current[index] =
            proofreadResult.result.correctedText;
          return next;
        });
        setProofreadResult(null);
      }
    },
    [proofreadResult]
  );

  // Discard proofread
  const handleDiscardProofread = useCallback(() => {
    setProofreadResult(null);
  }, []);

  // Voice toggle handlers
  const handleVoiceToggle0 = useCallback(() => {
    console.log(
      '[MeditationFlowOverlay] Voice toggle clicked, isRecording:',
      voiceInput0.isRecording
    );
    if (voiceInput0.isRecording) {
      console.log('[MeditationFlowOverlay] Stopping recording for input 0');
      voiceInput0.stopRecording();

      // Play voice stop audio cue if sound is enabled
      if (settings.enableSound && audioManagerRef.current) {
        audioManagerRef.current.playVoiceStopCue().catch((err) => {
          console.error('Failed to play voice stop audio cue:', err);
        });
      }
    } else {
      console.log('[MeditationFlowOverlay] Starting recording for input 0');
      void voiceInput0.startRecording().catch((err) => {
        setVoiceError({
          code: 'network',
          message: err instanceof Error ? err.message : 'Voice input failed',
        });
      });
    }
  }, [voiceInput0, settings.enableSound]);

  const handleVoiceToggle1 = useCallback(() => {
    console.log(
      '[MeditationFlowOverlay] Voice toggle clicked, isRecording:',
      voiceInput1.isRecording
    );
    if (voiceInput1.isRecording) {
      console.log('[MeditationFlowOverlay] Stopping recording for input 1');
      voiceInput1.stopRecording();

      // Play voice stop audio cue if sound is enabled
      if (settings.enableSound && audioManagerRef.current) {
        audioManagerRef.current.playVoiceStopCue().catch((err) => {
          console.error('Failed to play voice stop audio cue:', err);
        });
      }
    } else {
      console.log('[MeditationFlowOverlay] Starting recording for input 1');
      void voiceInput1.startRecording().catch((err) => {
        setVoiceError({
          code: 'network',
          message: err instanceof Error ? err.message : 'Voice input failed',
        });
      });
    }
  }, [voiceInput1, settings.enableSound]);

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

  // Meditative phrase rotation is now handled by BreathingPhase component

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

  // Draft auto-save removed per request

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
                      // Only show preview, don't auto-apply
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
                // Only show preview, don't auto-apply
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

        {/* Resume draft popup removed per request */}

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
              onVoiceToggle={handleVoiceToggle0}
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
              onVoiceToggle={handleVoiceToggle1}
            />
          )}
        </div>

        {Nav}

        {/* Tools panel removed - now using MoreToolsMenu in navigation */}

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
