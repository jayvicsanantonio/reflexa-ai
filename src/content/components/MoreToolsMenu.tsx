import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { SummaryFormat, TonePreset } from '../../types';
import '../styles.css';

// Language options for translation
interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

const languageOptions: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
];

// Minimalist SVG Icons
const VolumeIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

const VolumeMuteIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

// TranslateIcon removed from UI redesign

const BulletIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <circle cx="4" cy="6" r="1" fill="currentColor" />
    <circle cx="4" cy="12" r="1" fill="currentColor" />
    <circle cx="4" cy="18" r="1" fill="currentColor" />
  </svg>
);

const ParagraphIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="15" y2="18" />
  </svg>
);

const HeadlineIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 4v6a6 6 0 0 0 12 0V4" />
    <line x1="4" y1="20" x2="20" y2="20" />
  </svg>
);

const CalmIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 15s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

const ConciseIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const EmpatheticIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const AcademicIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const SparklesIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

const EditIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const LoadingIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="reflexa-more-tools__spinner"
  >
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
  </svg>
);

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
  onTranslateSummary?: (targetLanguage: string) => void;
  isTranslating?: boolean;
  currentLanguage?: string;
  unsupportedLanguages?: string[];
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
  currentLanguage,
  unsupportedLanguages = [],
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    currentLanguage ?? 'en'
  );

  // Keep local selection in sync with the detected/current language
  useEffect(() => {
    setSelectedLanguage(currentLanguage ?? 'en');
  }, [currentLanguage]);
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
  // Note: When rendered inside a Shadow DOM, document-level listeners can
  // misidentify clicks inside the menu as outside due to event retargeting.
  // Use the component's root node and composedPath() for reliable detection.
  useEffect(() => {
    if (!isOpen) return;

    const root = (menuRef.current?.getRootNode?.() ?? document) as
      | Document
      | ShadowRoot;

    const handleClickOutside = (event: Event) => {
      const e = event as Event & { composedPath?: () => EventTarget[] };
      const targetPath = e.composedPath ? e.composedPath() : undefined;

      // If composedPath is available, prefer it for Shadow DOM correctness
      if (targetPath && menuRef.current) {
        if (!targetPath.includes(menuRef.current)) {
          handleClose();
        }
        return;
      }

      // Fallback: standard contains check
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    const handleClickOutsideListener: EventListener =
      handleClickOutside as EventListener;
    root.addEventListener('mousedown', handleClickOutsideListener);
    return () => {
      root.removeEventListener('mousedown', handleClickOutsideListener);
    };
  }, [isOpen, handleClose]);

  // Close menu on Escape key
  // Bind to ShadowRoot when available so the listener works reliably inside shadow DOM
  useEffect(() => {
    const root = (menuRef.current?.getRootNode?.() ?? document) as
      | Document
      | ShadowRoot;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    root.addEventListener('keydown', handleEscape as EventListener);
    return () =>
      root.removeEventListener('keydown', handleEscape as EventListener);
  }, [isOpen, handleClose]);

  const handleFormatSelect = async (format: SummaryFormat) => {
    console.log(
      '[MoreToolsMenu] Format selected:',
      format,
      'Current:',
      currentFormat
    );
    console.log('[MoreToolsMenu] onFormatChange exists:', !!onFormatChange);
    if (format !== currentFormat && onFormatChange) {
      console.log('[MoreToolsMenu] Calling onFormatChange...');
      await onFormatChange(format);
      console.log('[MoreToolsMenu] onFormatChange completed');
    } else {
      console.log('[MoreToolsMenu] Skipping - same format or no handler');
    }
  };

  const handleToneSelect = (tone: TonePreset) => {
    console.log('[MoreToolsMenu] Tone selected:', tone);
    console.log('[MoreToolsMenu] onToneSelect exists:', !!onToneSelect);
    if (onToneSelect && !tonesDisabled && !isRewriting) {
      console.log('[MoreToolsMenu] Calling onToneSelect...');
      onToneSelect(tone);
    } else {
      console.log('[MoreToolsMenu] Skipping - disabled or no handler');
    }
  };

  const handleProofreadClick = () => {
    if (onProofread && !proofreadDisabled && !isProofreading) {
      onProofread(activeReflectionIndex);
    }
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
        onClick={(e) => {
          console.log('[MoreToolsMenu] Trigger clicked, isOpen:', isOpen);
          e.stopPropagation();
          handleToggle();
        }}
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
                    console.log(
                      '[MoreToolsMenu] Ambient toggle clicked, current muted:',
                      ambientMuted
                    );
                    onToggleAmbient(!ambientMuted);
                    console.log('[MoreToolsMenu] Ambient toggle called');
                  }}
                  role="menuitem"
                  data-testid="ambient-sound-toggle"
                >
                  <span className="reflexa-more-tools__tile-icon">
                    {ambientMuted ? <VolumeMuteIcon /> : <VolumeIcon />}
                  </span>
                  <span className="reflexa-more-tools__tile-label">
                    {ambientMuted ? 'Unmute' : 'Mute'}
                  </span>
                </button>
              )}
            </div>

            {/* Translate Summary - redesigned: language dropdown + Translate button (below mute) */}
            {onTranslateSummary && (
              <div
                className="reflexa-more-tools__inline-row"
                role="group"
                aria-label="Select language"
              >
                <select
                  className="reflexa-more-tools__language-select"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  disabled={isTranslating}
                  data-testid="language-select"
                >
                  {languageOptions.map((lang) => {
                    const isUnsupported = unsupportedLanguages.includes(
                      lang.code
                    );
                    return (
                      <option
                        key={lang.code}
                        value={lang.code}
                        disabled={isUnsupported}
                      >
                        {`${lang.name}${
                          lang.nativeName && lang.nativeName !== lang.name
                            ? ` (${lang.nativeName})`
                            : ''
                        }`}
                      </option>
                    );
                  })}
                </select>
                <button
                  type="button"
                  className="reflexa-more-tools__inline-button"
                  onClick={() => {
                    console.log(
                      '[MoreToolsMenu] Translate apply clicked:',
                      selectedLanguage
                    );
                    onTranslateSummary(selectedLanguage);
                    handleClose();
                  }}
                  disabled={isTranslating}
                  data-testid="translate-apply-button"
                >
                  {isTranslating ? 'Translating…' : 'Translate'}
                </button>
              </div>
            )}
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
                    onClick={async (e) => {
                      e.stopPropagation();
                      console.log(
                        '[MoreToolsMenu] Format tile clicked:',
                        option.value
                      );
                      await handleFormatSelect(option.value);
                      handleClose();
                    }}
                    disabled={isLoadingSummary}
                    role="menuitem"
                    data-testid={`format-option-${option.value}`}
                  >
                    <span className="reflexa-more-tools__tile-icon">
                      {option.value === 'bullets' ? (
                        <BulletIcon />
                      ) : option.value === 'paragraph' ? (
                        <ParagraphIcon />
                      ) : (
                        <HeadlineIcon />
                      )}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('[MoreToolsMenu] Generate draft clicked');
                    handleGenerateDraft();
                    handleClose();
                  }}
                  disabled={generateDraftDisabled || isGenerating}
                  role="menuitem"
                  data-testid="generate-draft-option"
                >
                  <div className="reflexa-more-tools__option-content">
                    <span className="reflexa-more-tools__option-icon">
                      <SparklesIcon />
                    </span>
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
                      <LoadingIcon />
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
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(
                          '[MoreToolsMenu] Tone tile clicked:',
                          option.value
                        );
                        handleToneSelect(option.value);
                        handleClose();
                      }}
                      disabled={tonesDisabled || isRewriting}
                      role="menuitem"
                      data-testid={`tone-option-${option.value}`}
                    >
                      <span className="reflexa-more-tools__tile-icon">
                        {option.value === 'calm' ? (
                          <CalmIcon />
                        ) : option.value === 'concise' ? (
                          <ConciseIcon />
                        ) : option.value === 'empathetic' ? (
                          <EmpatheticIcon />
                        ) : (
                          <AcademicIcon />
                        )}
                      </span>
                      <span className="reflexa-more-tools__tile-label">
                        {option.label}
                      </span>
                      {selectedTone === option.value && isRewriting && (
                        <span className="reflexa-more-tools__tile-spinner">
                          <LoadingIcon />
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
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('[MoreToolsMenu] Proofread clicked');
                    handleProofreadClick();
                    handleClose();
                  }}
                  disabled={proofreadDisabled || isProofreading}
                  role="menuitem"
                  data-testid="proofread-option"
                >
                  <div className="reflexa-more-tools__option-content">
                    <span className="reflexa-more-tools__option-icon">
                      <EditIcon />
                    </span>
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
