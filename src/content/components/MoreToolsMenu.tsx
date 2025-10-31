import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { SummaryFormat, TonePreset } from '../../types';
import '../styles.css';

interface MoreToolsMenuProps {
  // Context
  currentScreen: 'summary' | 'reflection';

  // Summary format (only shown in summary screen)
  currentFormat?: SummaryFormat;
  onFormatChange?: (format: SummaryFormat) => Promise<void>;
  isLoadingSummary?: boolean;

  // Generate Draft (only shown in reflection screen when no content)
  onGenerateDraft?: (draft: string) => void;
  generateDraftDisabled?: boolean;
  summary?: string[];

  // Tone presets (only shown in reflection screen when there's content)
  selectedTone?: TonePreset;
  onToneSelect?: (tone: TonePreset) => void;
  tonesDisabled?: boolean;
  isRewriting?: boolean;
  hasReflectionContent?: boolean;

  // Proofread (only shown in reflection screen when there's content)
  onProofread?: (index: number) => void;
  proofreadDisabled?: boolean;
  isProofreading?: boolean;
  proofreaderAvailable?: boolean;
  activeReflectionIndex?: number;

  // Ambient Sound (available in all screens)
  ambientMuted?: boolean;
  onToggleAmbient?: (mute: boolean) => void;

  // Translate Summary (available in all screens)
  onTranslateSummary?: () => void;
  isTranslating?: boolean;
}

interface FormatOption {
  value: SummaryFormat;
  label: string;
  description: string;
}

interface ToneOption {
  value: TonePreset;
  label: string;
  icon: string;
  description: string;
}

const formatOptions: FormatOption[] = [
  {
    value: 'bullets',
    label: 'Bullets',
    description: '3 concise bullet points',
  },
  {
    value: 'paragraph',
    label: 'Paragraph',
    description: 'Single flowing paragraph',
  },
  {
    value: 'headline-bullets',
    label: 'Headline + Bullets',
    description: 'Headline with bullet points',
  },
];

const toneOptions: ToneOption[] = [
  {
    value: 'calm',
    label: 'Calm',
    icon: '😌',
    description: 'Peaceful and centered',
  },
  {
    value: 'concise',
    label: 'Concise',
    icon: '→',
    description: 'Brief and to the point',
  },
  {
    value: 'empathetic',
    label: 'Empathetic',
    icon: '💙',
    description: 'Warm and understanding',
  },
  {
    value: 'academic',
    label: 'Academic',
    icon: '🎓',
    description: 'Formal and scholarly',
  },
];

/**
 * More Tools Menu Component
 * Context-aware dropdown menu that shows different tools based on current screen
 */
export const MoreToolsMenu: React.FC<MoreToolsMenuProps> = ({
  currentScreen,
  currentFormat = 'bullets',
  onFormatChange,
  isLoadingSummary = false,
  onGenerateDraft,
  generateDraftDisabled = false,
  summary = [],
  selectedTone,
  onToneSelect,
  tonesDisabled = false,
  isRewriting = false,
  hasReflectionContent = false,
  onProofread,
  proofreadDisabled = false,
  isProofreading = false,
  proofreaderAvailable = false,
  activeReflectionIndex = 0,
  ambientMuted = false,
  onToggleAmbient,
  onTranslateSummary,
  isTranslating = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClose]);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  const handleFormatSelect = async (format: SummaryFormat) => {
    if (format !== currentFormat && onFormatChange) {
      await onFormatChange(format);
    }
    handleClose();
  };

  const handleToneSelect = (tone: TonePreset) => {
    if (onToneSelect && !tonesDisabled && !isRewriting) {
      onToneSelect(tone);
    }
    handleClose();
  };

  const handleProofreadClick = () => {
    if (onProofread && !proofreadDisabled && !isProofreading) {
      onProofread(activeReflectionIndex);
    }
    handleClose();
  };

  const handleGenerateDraft = () => {
    if (onGenerateDraft && !generateDraftDisabled && !isGenerating) {
      setIsGenerating(true);
      try {
        // Use the Chrome AI Writer API to generate a draft
        const summaryText = summary.join(' ');
        const prompt = `Based on this summary: "${summaryText}", write a brief reflection about what you found most interesting.`;

        // Call the generate draft handler
        // The actual API call will be handled by the parent component
        onGenerateDraft(prompt);
      } catch (error) {
        console.error('Failed to generate draft:', error);
      } finally {
        setIsGenerating(false);
      }
    }
    handleClose();
  };

  return (
    <div
      className="reflexa-more-tools"
      ref={menuRef}
      data-testid="more-tools-menu"
    >
      <button
        type="button"
        className="reflexa-more-tools__trigger"
        onClick={handleToggle}
        aria-label="More tools"
        aria-expanded={isOpen}
        aria-haspopup="true"
        data-testid="more-tools-trigger"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
        <span>More</span>
      </button>

      {isOpen && (
        <div
          className="reflexa-more-tools__menu"
          role="menu"
          aria-label="More tools menu"
          data-testid="more-tools-dropdown"
        >
          {/* Universal Tools - Available in all screens */}
          <div className="reflexa-more-tools__section">
            <div className="reflexa-more-tools__section-title">Tools</div>
            <div className="reflexa-more-tools__grid">
              {/* Ambient Sound Toggle */}
              {onToggleAmbient && (
                <button
                  type="button"
                  className="reflexa-more-tools__tile"
                  onClick={() => {
                    onToggleAmbient(!ambientMuted);
                    handleClose();
                  }}
                  role="menuitem"
                  data-testid="ambient-sound-toggle"
                >
                  <span className="reflexa-more-tools__tile-icon">
                    {ambientMuted ? '🔇' : '🎵'}
                  </span>
                  <span className="reflexa-more-tools__tile-label">
                    {ambientMuted ? 'Unmute' : 'Mute'}
                  </span>
                </button>
              )}

              {/* Translate Summary */}
              {onTranslateSummary && (
                <button
                  type="button"
                  className="reflexa-more-tools__tile"
                  onClick={() => {
                    onTranslateSummary();
                    handleClose();
                  }}
                  disabled={isTranslating}
                  role="menuitem"
                  data-testid="translate-summary-option"
                >
                  <span className="reflexa-more-tools__tile-icon">
                    {isTranslating ? '⏳' : '🌐'}
                  </span>
                  <span className="reflexa-more-tools__tile-label">
                    {isTranslating ? 'Translating...' : 'Translate'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Summary Format Options (only in summary screen) */}
          {currentScreen === 'summary' && onFormatChange && (
            <div className="reflexa-more-tools__section">
              <div className="reflexa-more-tools__section-title">Format</div>
              <div className="reflexa-more-tools__grid">
                {formatOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`reflexa-more-tools__tile ${
                      currentFormat === option.value
                        ? 'reflexa-more-tools__tile--selected'
                        : ''
                    }`}
                    onClick={() => handleFormatSelect(option.value)}
                    disabled={isLoadingSummary}
                    role="menuitem"
                    data-testid={`format-option-${option.value}`}
                  >
                    <span className="reflexa-more-tools__tile-icon">
                      {option.value === 'bullets'
                        ? '•'
                        : option.value === 'paragraph'
                          ? '¶'
                          : '⚡'}
                    </span>
                    <span className="reflexa-more-tools__tile-label">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Generate Draft (only in reflection screen when no content) */}
          {currentScreen === 'reflection' &&
            onGenerateDraft &&
            !hasReflectionContent && (
              <div className="reflexa-more-tools__section">
                <div className="reflexa-more-tools__section-title">
                  Get Started
                </div>
                <button
                  type="button"
                  className="reflexa-more-tools__option"
                  onClick={handleGenerateDraft}
                  disabled={generateDraftDisabled || isGenerating}
                  role="menuitem"
                  data-testid="generate-draft-option"
                >
                  <div className="reflexa-more-tools__option-content">
                    <span className="reflexa-more-tools__option-icon">✨</span>
                    <div>
                      <span className="reflexa-more-tools__option-label">
                        {isGenerating ? 'Generating...' : 'Generate Draft'}
                      </span>
                      <span className="reflexa-more-tools__option-description">
                        AI-powered starting point
                      </span>
                    </div>
                  </div>
                  {isGenerating && (
                    <span className="reflexa-more-tools__option-spinner">
                      ⏳
                    </span>
                  )}
                </button>
              </div>
            )}

          {/* Tone Presets (only in reflection screen when there's content) */}
          {currentScreen === 'reflection' &&
            onToneSelect &&
            hasReflectionContent && (
              <div className="reflexa-more-tools__section">
                <div className="reflexa-more-tools__section-title">
                  Rewrite Tone
                </div>
                <div className="reflexa-more-tools__grid">
                  {toneOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`reflexa-more-tools__tile ${
                        selectedTone === option.value
                          ? 'reflexa-more-tools__tile--selected'
                          : ''
                      }`}
                      onClick={() => handleToneSelect(option.value)}
                      disabled={tonesDisabled || isRewriting}
                      role="menuitem"
                      data-testid={`tone-option-${option.value}`}
                    >
                      <span className="reflexa-more-tools__tile-icon">
                        {option.icon}
                      </span>
                      <span className="reflexa-more-tools__tile-label">
                        {option.label}
                      </span>
                      {selectedTone === option.value && isRewriting && (
                        <span className="reflexa-more-tools__tile-spinner">
                          ⏳
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* Proofread (only in reflection screen when there's content) */}
          {currentScreen === 'reflection' &&
            proofreaderAvailable &&
            onProofread &&
            hasReflectionContent && (
              <div className="reflexa-more-tools__section">
                <div className="reflexa-more-tools__section-title">Polish</div>
                <button
                  type="button"
                  className="reflexa-more-tools__option"
                  onClick={handleProofreadClick}
                  disabled={proofreadDisabled || isProofreading}
                  role="menuitem"
                  data-testid="proofread-option"
                >
                  <div className="reflexa-more-tools__option-content">
                    <span className="reflexa-more-tools__option-icon">✏️</span>
                    <div>
                      <span className="reflexa-more-tools__option-label">
                        {isProofreading ? 'Proofreading...' : 'Proofread'}
                      </span>
                      <span className="reflexa-more-tools__option-description">
                        Check grammar and spelling
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            )}
        </div>
      )}
    </div>
  );
};
