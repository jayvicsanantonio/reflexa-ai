import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BreathingOrb } from './BreathingOrb';
import { SummaryFormatDropdown } from './SummaryFormatDropdown';
import { LanguagePill } from './LanguagePill';
import { TranslateDropdown } from './TranslateDropdown';
import { StartReflectionButton } from './StartReflectionButton';
import { TonePresetChips } from './TonePresetChips';
import { ProofreadDiffView } from './ProofreadDiffView';
import type {
  Settings,
  SummaryFormat,
  LanguageDetection,
  TonePreset,
  ProofreadResult,
} from '../../types';
import { trapFocus, announceToScreenReader } from '../../utils/accessibility';
import '../styles.css';

interface ReflectModeOverlayProps {
  summary: string[];
  prompts: string[];
  onSave: (reflections: string[]) => void;
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
  const firstInputRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleFormatChange = async (format: SummaryFormat) => {
    if (onFormatChange) {
      await onFormatChange(format);
    }
  };

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
    };
  }, []);

  const handleSave = useCallback(() => {
    // Announce save (cleanup handled automatically after 1s)
    announceToScreenReader('Reflection saved successfully', 'assertive');
    onSave(reflections);
  }, [reflections, onSave]);

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

  const handleReflectionChange = (index: number, value: string) => {
    const newReflections = [...reflections];
    newReflections[index] = value;
    setReflections(newReflections);
  };

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

        {/* Summary Format Dropdown */}
        {onFormatChange && (
          <div className="reflexa-overlay__format-selector">
            <SummaryFormatDropdown
              selectedFormat={currentFormat}
              onFormatChange={handleFormatChange}
              disabled={isLoadingSummary}
            />
          </div>
        )}

        {/* Three-Bullet Summary */}
        <section
          className="reflexa-overlay__summary"
          aria-label="Article Summary"
        >
          {/* Translation Dropdown */}
          {settings.enableTranslation && languageDetection && onTranslate && (
            <div className="reflexa-overlay__translate-section">
              <TranslateDropdown
                currentLanguage={languageDetection.detectedLanguage}
                onTranslate={onTranslate}
                loading={isTranslating}
                disabled={isTranslating}
              />
            </div>
          )}

          {summary.map((bullet, index) => (
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
          ))}
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
          {/* Tone Preset Chips */}
          {settings.experimentalMode && onRewrite && (
            <div className="reflexa-overlay__tone-section">
              <TonePresetChips
                selectedTone={selectedTone}
                onToneSelect={handleToneSelect}
                disabled={reflections.every((r) => r.trim() === '')}
                isLoading={isRewriting.some((r) => r)}
              />
            </div>
          )}

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
                    Accept
                  </button>
                  <button
                    type="button"
                    className="reflexa-overlay__rewrite-preview-button reflexa-overlay__rewrite-preview-button--discard"
                    onClick={handleDiscardRewrite}
                  >
                    Discard
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

          {prompts.map((prompt, index) => (
            <div key={index} className="reflexa-overlay__reflection-item">
              <label
                htmlFor={`reflexa-reflection-${index}`}
                className="reflexa-overlay__reflection-label"
              >
                {prompt}
              </label>
              <textarea
                id={`reflexa-reflection-${index}`}
                ref={index === 0 ? firstInputRef : undefined}
                className="reflexa-overlay__reflection-input"
                value={reflections[index]}
                onChange={(e) => handleReflectionChange(index, e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                data-testid={`reflection-input-${index}`}
              />
              {(settings.enableProofreading || settings.proofreadEnabled) &&
                proofreaderAvailable &&
                reflections[index].trim() && (
                  <button
                    type="button"
                    className="reflexa-overlay__proofread-button"
                    onClick={() => handleProofread(index)}
                    disabled={isProofreading[index]}
                    aria-label={`Proofread reflection ${index + 1}`}
                    data-testid={`proofread-button-${index}`}
                  >
                    {isProofreading[index] ? 'Proofreading...' : 'Proofread'}
                  </button>
                )}
            </div>
          ))}

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
          <button
            type="button"
            className="reflexa-overlay__button reflexa-overlay__button--cancel"
            onClick={onCancel}
            data-testid="cancel-button"
          >
            Cancel
            <span className="reflexa-overlay__button-hint">Esc</span>
          </button>
          <button
            type="button"
            className="reflexa-overlay__button reflexa-overlay__button--save"
            onClick={handleSave}
            data-testid="save-button"
          >
            Save Reflection
            <span className="reflexa-overlay__button-hint">
              {isMacOS() ? '⌘' : 'Ctrl'}+Enter
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
