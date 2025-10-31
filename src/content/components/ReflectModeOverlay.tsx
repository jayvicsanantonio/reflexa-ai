import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BreathingOrb } from './BreathingOrb';
import { LanguagePill } from './LanguagePill';
import { TranslateDropdown } from './TranslateDropdown';
import { StartReflectionButton } from './StartReflectionButton';
import { ProofreadDiffView } from './ProofreadDiffView';
import { VoiceToggleButton } from './VoiceToggleButton';
import { Notification } from './Notification';
import { MoreToolsMenu } from './MoreToolsMenu';
import type {
  Settings,
  SummaryFormat,
  LanguageDetection,
  TonePreset,
  ProofreadResult,
  VoiceInputMetadata,
} from '../../types';
import { trapFocus, announceToScreenReader } from '../../utils/accessibility';
import { useVoiceInput } from '../hooks/useVoiceInput';
import type { VoiceInputError } from '../hooks/useVoiceInput';
import { AudioManager } from '../../utils/audioManager';
import '../styles.css';

/**
 * Text segment with timestamp for chronological merging
 */
interface TextSegment {
  text: string;
  timestamp: number;
  type: 'typed' | 'transcribed';
}

interface ReflectModeOverlayProps {
  summary: string[];
  prompts: string[];
  onSave: (
    reflections: string[],
    voiceMetadata?: VoiceInputMetadata[],
    originalReflections?: (string | null)[]
  ) => void;
  onCancel: () => void;
  settings: Settings;
  onProofread?: (text: string, index: number) => Promise<ProofreadResult>;
  onFormatChange?: (format: SummaryFormat) => Promise<void>;
  currentFormat?: SummaryFormat;
  isLoadingSummary?: boolean;
  languageDetection?: LanguageDetection;
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
}

/**
 * Extended Navigator interface with User-Agent Client Hints API
 * This is an experimental feature not yet in standard TypeScript types
 */
interface NavigatorUAData {
  platform: string;
  brands: { brand: string; version: string }[];
  mobile: boolean;
}

interface ExtendedNavigator extends Navigator {
  userAgentData?: NavigatorUAData;
}

/**
 * Detect if the user is on macOS
 * Uses modern User-Agent Client Hints API with fallback
 */
const isMacOS = (): boolean => {
  const nav = navigator as ExtendedNavigator;

  // Modern approach using User-Agent Client Hints
  if (nav.userAgentData) {
    return nav.userAgentData.platform === 'macOS';
  }
  // Fallback for browsers that don't support User-Agent Client Hints
  return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
};

/**
 * Full-screen Reflect Mode overlay component
 * Provides a calming interface for viewing AI summaries and writing reflections
 * Includes breathing orb, summary display, reflection inputs, and action buttons
 */
export const ReflectModeOverlay: React.FC<ReflectModeOverlayProps> = ({
  summary,
  prompts,
  onSave,
  onCancel,
  settings,
  onProofread,
  onFormatChange,
  currentFormat = 'bullets',
  isLoadingSummary = false,
  languageDetection,
  onTranslateToEnglish,
  onTranslate,
  isTranslating = false,
  onRewrite,
  isRewriting = [false, false],
  proofreaderAvailable = false,
}) => {
  const [reflections, setReflections] = useState<string[]>(['', '']);
  const [originalReflections, setOriginalReflections] = useState<
    (string | null)[]
  >([null, null]);
  const [isProofreading, setIsProofreading] = useState<boolean[]>([
    false,
    false,
  ]);
  const [selectedTone, setSelectedTone] = useState<TonePreset | undefined>(
    undefined
  );
  const [rewritePreview, setRewritePreview] = useState<{
    index: number;
    original: string;
    rewritten: string;
  } | null>(null);
  const [proofreadResult, setProofreadResult] = useState<{
    index: number;
    result: ProofreadResult;
  } | null>(null);
  const [voiceInputStates, setVoiceInputStates] = useState<
    { isRecording: boolean; interimText: string }[]
  >([
    { isRecording: false, interimText: '' },
    { isRecording: false, interimText: '' },
  ]);
  const [voiceError, setVoiceError] = useState<VoiceInputError | null>(null);
  const [autoStopNotification, setAutoStopNotification] =
    useState<boolean>(false);
  const [languageFallbackNotification, setLanguageFallbackNotification] =
    useState<{ show: boolean; languageName: string }>({
      show: false,
      languageName: '',
    });
  const [currentScreen, setCurrentScreen] = useState<'summary' | 'reflection'>(
    'summary'
  );
  const [activeReflectionIndex, setActiveReflectionIndex] = useState<number>(0);
  const firstInputRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);

  // Track text segments with timestamps for chronological merging
  const textSegmentsRef = useRef<TextSegment[][]>([[], []]);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTextValueRef = useRef<string[]>(['', '']);

  // Merge text segments chronologically
  const mergeTextSegments = useCallback((segments: TextSegment[]): string => {
    if (segments.length === 0) return '';

    // Sort segments by timestamp
    const sortedSegments = [...segments].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    // Merge text with proper spacing
    return sortedSegments
      .map((segment) => segment.text.trim())
      .filter((text) => text.length > 0)
      .join(' ');
  }, []);

  // Voice input handlers for reflection field 0
  const handleTranscript0 = useCallback(
    (text: string, isFinal: boolean) => {
      if (isFinal) {
        // Add transcribed segment with timestamp
        const segment: TextSegment = {
          text: text.trim(),
          timestamp: Date.now(),
          type: 'transcribed',
        };
        textSegmentsRef.current[0].push(segment);

        // Merge all segments chronologically
        const mergedText = mergeTextSegments(textSegmentsRef.current[0]);

        setReflections((prev) => {
          const newReflections = [...prev];
          newReflections[0] = mergedText;
          lastTextValueRef.current[0] = mergedText;
          return newReflections;
        });

        // Clear interim text
        setVoiceInputStates((prev) => {
          const newStates = [...prev];
          newStates[0].interimText = '';
          return newStates;
        });
      } else {
        // Update interim text
        setVoiceInputStates((prev) => {
          const newStates = [...prev];
          newStates[0].interimText = text;
          return newStates;
        });
      }
    },
    [mergeTextSegments]
  );

  const handleVoiceError0 = useCallback((error: VoiceInputError) => {
    console.error('Voice input error (field 0):', error);
    setVoiceError(error);
  }, []);

  const handleTypingDetected0 = useCallback(() => {
    console.log('Typing detected in field 0, pausing transcription');
  }, []);

  const handleAutoStop0 = useCallback(() => {
    console.log('Auto-stop triggered for field 0');

    // Show notification
    setAutoStopNotification(true);

    // Play voice stop audio cue if sound is enabled
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
    onTypingDetected: handleTypingDetected0,
    onAutoStop: handleAutoStop0,
    autoStopDelay: settings.voiceAutoStopDelay ?? 3000,
  });

  // Voice input handlers for reflection field 1
  const handleTranscript1 = useCallback(
    (text: string, isFinal: boolean) => {
      if (isFinal) {
        // Add transcribed segment with timestamp
        const segment: TextSegment = {
          text: text.trim(),
          timestamp: Date.now(),
          type: 'transcribed',
        };
        textSegmentsRef.current[1].push(segment);

        // Merge all segments chronologically
        const mergedText = mergeTextSegments(textSegmentsRef.current[1]);

        setReflections((prev) => {
          const newReflections = [...prev];
          newReflections[1] = mergedText;
          lastTextValueRef.current[1] = mergedText;
          return newReflections;
        });

        // Clear interim text
        setVoiceInputStates((prev) => {
          const newStates = [...prev];
          newStates[1].interimText = '';
          return newStates;
        });
      } else {
        // Update interim text
        setVoiceInputStates((prev) => {
          const newStates = [...prev];
          newStates[1].interimText = text;
          return newStates;
        });
      }
    },
    [mergeTextSegments]
  );

  const handleVoiceError1 = useCallback((error: VoiceInputError) => {
    console.error('Voice input error (field 1):', error);
    setVoiceError(error);
  }, []);

  const handleTypingDetected1 = useCallback(() => {
    console.log('Typing detected in field 1, pausing transcription');
  }, []);

  const handleAutoStop1 = useCallback(() => {
    console.log('Auto-stop triggered for field 1');

    // Show notification
    setAutoStopNotification(true);

    // Play voice stop audio cue if sound is enabled
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
    onTypingDetected: handleTypingDetected1,
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

  // Initialize audio manager
  useEffect(() => {
    audioManagerRef.current = new AudioManager(settings);
    audioManagerRef.current.loadAudioFiles();

    return () => {
      if (audioManagerRef.current) {
        audioManagerRef.current.cleanup();
      }
    };
  }, [settings]);

  // Auto-focus first input on mount and announce to screen readers
  useEffect(() => {
    // Announce overlay opening (returns cleanup function)
    const cleanupAnnouncement = announceToScreenReader(
      'Reflect mode opened. Review the summary and answer reflection questions.',
      'assertive'
    );

    // Focus first input after a brief delay to ensure screen reader announcement
    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 100);

    return () => {
      clearTimeout(timer);
      cleanupAnnouncement();
    };
  }, []);

  // Disable page scroll while overlay is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'relative';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;

      // Clean up typing timer
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  const handleSave = useCallback(() => {
    // Compute voice metadata for each reflection
    const voiceMetadata: VoiceInputMetadata[] = textSegmentsRef.current.map(
      (segments, index) => {
        // Check if any segments are transcribed
        const hasVoiceTranscription = segments.some(
          (segment) => segment.type === 'transcribed'
        );

        if (!hasVoiceTranscription) {
          return {
            isVoiceTranscribed: false,
          };
        }

        // Get the language from the voice input hook
        const voiceInput = index === 0 ? voiceInput0 : voiceInput1;
        const transcribedSegments = segments.filter(
          (segment) => segment.type === 'transcribed'
        );
        const firstTranscriptionTimestamp =
          transcribedSegments.length > 0
            ? transcribedSegments[0].timestamp
            : undefined;

        // Count words in transcribed segments
        const transcribedText = transcribedSegments
          .map((s) => s.text)
          .join(' ');
        const wordCount = transcribedText
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0).length;

        return {
          isVoiceTranscribed: true,
          transcriptionLanguage: voiceInput.effectiveLanguage,
          transcriptionTimestamp: firstTranscriptionTimestamp,
          wordCount,
        };
      }
    );

    // Announce save (cleanup handled automatically after 1s)
    announceToScreenReader('Reflection saved successfully', 'assertive');
    onSave(reflections, voiceMetadata, originalReflections);
  }, [reflections, onSave, voiceInput0, voiceInput1, originalReflections]);

  // Keyboard shortcuts: Escape to cancel, Cmd/Ctrl+Enter to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, onCancel]);

  // Focus trap: Keep focus within the modal using utility
  useEffect(() => {
    if (!overlayRef.current) return;

    const cleanup = trapFocus(overlayRef.current, onCancel);
    return cleanup;
  }, [onCancel]);

  const handleReflectionChange = useCallback(
    (index: number, value: string) => {
      // Switch to reflection screen when user starts typing
      if (currentScreen === 'summary' && value.trim().length > 0) {
        setCurrentScreen('reflection');
      }

      // Track active reflection index
      setActiveReflectionIndex(index);

      const voiceInput = index === 0 ? voiceInput0 : voiceInput1;
      const lastValue = lastTextValueRef.current[index];

      // Detect if user is typing (value changed from last known value)
      const isTyping = value !== lastValue;

      if (isTyping && voiceInput.isRecording && !voiceInput.isPaused) {
        // User started typing during voice recording - pause transcription
        try {
          voiceInput.pauseRecording();
        } catch (err) {
          console.error('Failed to pause recording:', err);
        }

        // Clear any existing typing timer
        if (typingTimerRef.current) {
          clearTimeout(typingTimerRef.current);
          typingTimerRef.current = null;
        }

        // Set timer to resume transcription after 2 seconds of no typing
        typingTimerRef.current = setTimeout(() => {
          const currentVoiceInput = index === 0 ? voiceInput0 : voiceInput1;
          if (currentVoiceInput.isRecording && currentVoiceInput.isPaused) {
            try {
              currentVoiceInput.resumeRecording();
            } catch (err) {
              console.error('Failed to resume recording:', err);
            }
          }
        }, 2000);
      }

      // If user typed new content (not just from voice), add it as a typed segment
      if (isTyping && value.length > lastValue.length) {
        const newText = value.substring(lastValue.length).trim();
        if (newText.length > 0) {
          const segment: TextSegment = {
            text: newText,
            timestamp: Date.now(),
            type: 'typed',
          };
          textSegmentsRef.current[index].push(segment);
        }
      }

      // Update reflections and last value
      setReflections((prev) => {
        const newReflections = [...prev];
        newReflections[index] = value;
        return newReflections;
      });
      lastTextValueRef.current[index] = value;
    },
    [voiceInput0, voiceInput1, currentScreen]
  );

  const handleDraftGenerated = (draft: string) => {
    // Insert draft into first reflection input
    const newReflections = [...reflections];
    newReflections[0] = draft;
    setReflections(newReflections);

    // Announce to screen reader
    announceToScreenReader('Draft generated and inserted', 'polite');
  };

  const handleToneSelect = async (tone: TonePreset) => {
    // Find first non-empty reflection
    const index = reflections.findIndex((r) => r.trim() !== '');
    if (index === -1 || !onRewrite) return;

    setSelectedTone(tone);

    try {
      const result = await onRewrite(reflections[index], tone, index);
      setRewritePreview({
        index,
        original: result.original,
        rewritten: result.rewritten,
      });
    } catch (error) {
      console.error('Rewrite failed:', error);
      setSelectedTone(undefined);
    }
  };

  const handleAcceptRewrite = () => {
    if (!rewritePreview) return;

    const newReflections = [...reflections];
    newReflections[rewritePreview.index] = rewritePreview.rewritten;
    setReflections(newReflections);
    setRewritePreview(null);
    setSelectedTone(undefined);

    announceToScreenReader('Rewrite accepted', 'polite');
  };

  const handleDiscardRewrite = () => {
    setRewritePreview(null);
    setSelectedTone(undefined);

    announceToScreenReader('Rewrite discarded', 'polite');
  };

  const handleProofread = async (index: number) => {
    if (!onProofread || !reflections[index].trim()) return;

    setIsProofreading((prev) => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });

    try {
      const result = await onProofread(reflections[index], index);
      setProofreadResult({ index, result });
    } catch (error) {
      console.error('Proofread failed:', error);
    } finally {
      setIsProofreading((prev) => {
        const newState = [...prev];
        newState[index] = false;
        return newState;
      });
    }
  };

  const handleAcceptProofread = () => {
    if (!proofreadResult) return;

    // Store original version before applying proofread
    const newOriginalReflections = [...originalReflections];
    newOriginalReflections[proofreadResult.index] =
      reflections[proofreadResult.index];
    setOriginalReflections(newOriginalReflections);

    // Apply proofread version
    const newReflections = [...reflections];
    newReflections[proofreadResult.index] =
      proofreadResult.result.correctedText;
    setReflections(newReflections);
    setProofreadResult(null);

    announceToScreenReader('Corrections accepted', 'polite');
  };

  const handleDiscardProofread = () => {
    setProofreadResult(null);

    announceToScreenReader('Corrections discarded', 'polite');
  };

  const summaryLabels = ['Insight', 'Surprise', 'Apply'];

  return (
    <div
      ref={overlayRef}
      className="reflexa-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reflexa-overlay-title"
      data-testid="reflect-overlay"
    >
      <div className="reflexa-overlay__backdrop" />

      <div className="reflexa-overlay__content">
        {/* Breathing Orb */}
        <BreathingOrb
          enabled={!settings.reduceMotion}
          duration={7}
          size={120}
        />

        {/* Title */}
        <h1 id="reflexa-overlay-title" className="reflexa-overlay__title">
          Reflect & Absorb
        </h1>

        {/* Language Detection and Translation */}
        {languageDetection && (
          <div className="reflexa-overlay__language-section">
            <LanguagePill languageDetection={languageDetection} />
            {languageDetection.detectedLanguage !== 'en' &&
              onTranslateToEnglish && (
                <button
                  type="button"
                  className="reflexa-overlay__translate-button"
                  onClick={onTranslateToEnglish}
                  aria-label="Translate to English"
                  data-testid="translate-to-english-button"
                >
                  <span className="reflexa-overlay__translate-icon">🌐</span>
                  Translate to English
                </button>
              )}
          </div>
        )}

        {/* Three-Bullet Summary */}
        <section
          className="reflexa-overlay__summary"
          aria-label="Article Summary"
        >
          {/* Translation Dropdown */}
          {!isLoadingSummary &&
            settings.enableTranslation &&
            languageDetection &&
            onTranslate && (
              <div className="reflexa-overlay__translate-section">
                <TranslateDropdown
                  currentLanguage={languageDetection.detectedLanguage}
                  onTranslate={onTranslate}
                  loading={isTranslating}
                  disabled={isTranslating}
                />
              </div>
            )}

          {isLoadingSummary ? (
            <div className="reflexa-overlay__summary-loading">
              <div className="reflexa-overlay__summary-loading-orb">
                <BreathingOrb
                  enabled={!settings.reduceMotion}
                  duration={7}
                  mode="pulse"
                />
              </div>
              <h3 className="reflexa-overlay__summary-loading-title">
                Crafting your insights...
              </h3>
              <p className="reflexa-overlay__summary-loading-message">
                Take a moment to breathe. Let the rhythm of the orb guide you
                into a state of calm presence.
              </p>
              <p className="reflexa-overlay__summary-loading-submessage">
                Your personalized summary will appear shortly.
              </p>
            </div>
          ) : (
            summary.map((bullet, index) => (
              <div
                key={index}
                className="reflexa-overlay__summary-item"
                data-testid="summary-bullet"
              >
                <div className="reflexa-overlay__summary-label">
                  {summaryLabels[index]}
                </div>
                <p className="reflexa-overlay__summary-text">{bullet}</p>
              </div>
            ))
          )}
        </section>

        {/* Start Reflection Button */}
        {settings.experimentalMode && (
          <div className="reflexa-overlay__start-reflection">
            <StartReflectionButton
              summary={summary}
              onDraftGenerated={handleDraftGenerated}
              disabled={false}
            />
          </div>
        )}

        {/* Reflection Prompts */}
        <section
          className="reflexa-overlay__reflections"
          aria-label="Reflection Questions"
        >
          {/* Rewrite Preview */}
          {rewritePreview && (
            <div className="reflexa-overlay__rewrite-preview">
              <div className="reflexa-overlay__rewrite-preview-header">
                <span className="reflexa-overlay__rewrite-preview-label">
                  Rewrite Preview
                </span>
                <div className="reflexa-overlay__rewrite-preview-actions">
                  <button
                    type="button"
                    className="reflexa-overlay__rewrite-preview-button reflexa-overlay__rewrite-preview-button--accept"
                    onClick={handleAcceptRewrite}
                  >
                    ✓ Accept
                  </button>
                  <button
                    type="button"
                    className="reflexa-overlay__rewrite-preview-button reflexa-overlay__rewrite-preview-button--discard"
                    onClick={handleDiscardRewrite}
                  >
                    ✕ Discard
                  </button>
                </div>
              </div>
              <div className="reflexa-overlay__rewrite-preview-content">
                <div className="reflexa-overlay__rewrite-preview-text">
                  <strong>Original:</strong> {rewritePreview.original}
                </div>
                <div className="reflexa-overlay__rewrite-preview-text">
                  <strong>Rewritten:</strong> {rewritePreview.rewritten}
                </div>
              </div>
            </div>
          )}

          {prompts.map((prompt, index) => {
            const voiceInput = index === 0 ? voiceInput0 : voiceInput1;
            const handleVoiceToggle = async () => {
              if (voiceInput.isRecording) {
                // Stop recording
                voiceInput.stopRecording();

                // Play voice stop audio cue if sound is enabled
                if (settings.enableSound && audioManagerRef.current) {
                  audioManagerRef.current.playVoiceStopCue().catch((err) => {
                    console.error('Failed to play voice stop audio cue:', err);
                  });
                }
              } else {
                await voiceInput.startRecording();
              }
            };

            return (
              <div key={index} className="reflexa-overlay__reflection-item">
                <label
                  htmlFor={`reflexa-reflection-${index}`}
                  className="reflexa-overlay__reflection-label"
                >
                  {prompt}
                </label>
                <div className="reflexa-overlay__reflection-input-wrapper">
                  <textarea
                    id={`reflexa-reflection-${index}`}
                    ref={index === 0 ? firstInputRef : undefined}
                    className={`reflexa-overlay__reflection-input ${
                      voiceInput.isRecording
                        ? 'reflexa-overlay__reflection-input--recording'
                        : ''
                    }`}
                    value={
                      voiceInputStates[index].interimText
                        ? reflections[index]
                          ? `${reflections[index]} ${voiceInputStates[index].interimText}`
                          : voiceInputStates[index].interimText
                        : reflections[index]
                    }
                    onChange={(e) =>
                      handleReflectionChange(index, e.target.value)
                    }
                    placeholder="Share your thoughts..."
                    rows={3}
                    data-testid={`reflection-input-${index}`}
                  />
                  {voiceInputStates[index].interimText && (
                    <span
                      className="reflexa-overlay__interim-text"
                      aria-live="polite"
                      aria-label="Interim transcription"
                    >
                      {voiceInputStates[index].interimText}
                    </span>
                  )}
                  {voiceInput.isSupported && (
                    <VoiceToggleButton
                      isRecording={voiceInput.isRecording}
                      onToggle={handleVoiceToggle}
                      disabled={false}
                      language={voiceInput.effectiveLanguage}
                      languageName={voiceInput.languageName}
                      isLanguageFallback={voiceInput.isLanguageFallback}
                      reduceMotion={settings.reduceMotion}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {/* Proofread Diff View */}
          {proofreadResult && (
            <div className="reflexa-overlay__proofread-section">
              <ProofreadDiffView
                original={reflections[proofreadResult.index]}
                result={proofreadResult.result}
                onAccept={handleAcceptProofread}
                onDiscard={handleDiscardProofread}
              />
            </div>
          )}
        </section>

        {/* Action Buttons */}
        <div className="reflexa-overlay__actions">
          <div className="reflexa-overlay__actions-left">
            {/* More Tools Menu */}
            <MoreToolsMenu
              currentScreen={currentScreen}
              currentFormat={currentFormat}
              onFormatChange={onFormatChange}
              isLoadingSummary={isLoadingSummary}
              onGenerateDraft={
                settings.experimentalMode ? handleDraftGenerated : undefined
              }
              generateDraftDisabled={false}
              summary={summary}
              selectedTone={selectedTone}
              onToneSelect={
                settings.experimentalMode && onRewrite
                  ? handleToneSelect
                  : undefined
              }
              tonesDisabled={reflections.every((r) => r.trim() === '')}
              isRewriting={isRewriting.some((r) => r)}
              hasReflectionContent={reflections.some((r) => r.trim() !== '')}
              onProofread={
                (settings.enableProofreading || settings.proofreadEnabled) &&
                proofreaderAvailable
                  ? handleProofread
                  : undefined
              }
              proofreadDisabled={!reflections[activeReflectionIndex]?.trim()}
              isProofreading={isProofreading[activeReflectionIndex]}
              proofreaderAvailable={proofreaderAvailable}
              activeReflectionIndex={activeReflectionIndex}
            />

            <button
              type="button"
              className="reflexa-overlay__button reflexa-overlay__button--cancel"
              onClick={onCancel}
              data-testid="cancel-button"
            >
              Cancel
              <span className="reflexa-overlay__button-hint">Esc</span>
            </button>
          </div>

          <div className="reflexa-overlay__actions-right">
            <button
              type="button"
              className="reflexa-overlay__button reflexa-overlay__button--save"
              onClick={handleSave}
              disabled={isLoadingSummary}
              data-testid="save-button"
            >
              {isLoadingSummary ? 'Preparing...' : 'Save Reflection'}
              <span className="reflexa-overlay__button-hint">
                {isMacOS() ? '⌘' : 'Ctrl'}+Enter
              </span>
            </button>
          </div>
        </div>

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
      </div>
    </div>
  );
};
