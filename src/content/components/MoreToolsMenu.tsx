import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { SummaryFormat, TonePreset } from '../../types';
import { devLog } from '../../utils/logger';
import '../styles.css';
import {
  FormatSection,
  GenerateDraftSection,
  TonePresetSection,
  ProofreadSection,
  ToolsSection,
  MenuTrigger,
} from './MoreToolsMenu/index';

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

  // Reduce Motion (available in all screens)
  reduceMotion?: boolean;
  onToggleReduceMotion?: (enabled: boolean) => void;

  // Translate Summary (available in all screens)
  onTranslateSummary?: (targetLanguage: string) => void;
  isTranslating?: boolean;
  currentLanguage?: string;
  unsupportedLanguages?: string[];
  // Preferred target language for translation selector default
  defaultTargetLanguage?: string;
}

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
  reduceMotion = false,
  onToggleReduceMotion,
  onTranslateSummary,
  isTranslating = false,
  currentLanguage: _currentLanguage,
  unsupportedLanguages = [],
  defaultTargetLanguage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Debug: Log proofreader availability
  useEffect(() => {
    devLog('[MoreToolsMenu] Proofreader debug:', {
      currentScreen,
      proofreaderAvailable,
      onProofread: !!onProofread,
      hasReflectionContent,
      shouldShow:
        currentScreen === 'reflection' && proofreaderAvailable && !!onProofread,
    });
  }, [currentScreen, proofreaderAvailable, onProofread, hasReflectionContent]);

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

  return (
    <div
      className="reflexa-more-tools"
      ref={menuRef}
      data-testid="more-tools-menu"
    >
      <MenuTrigger onClick={handleToggle} isOpen={isOpen} />

      {isOpen && (
        <div
          className="reflexa-more-tools__menu"
          role="menu"
          aria-label="More tools menu"
          data-testid="more-tools-dropdown"
        >
          {/* Summary Format Options (only in summary screen) */}
          {currentScreen === 'summary' && onFormatChange && (
            <FormatSection
              currentFormat={currentFormat}
              onFormatChange={onFormatChange}
              isLoadingSummary={isLoadingSummary}
              onClose={handleClose}
            />
          )}

          {/* Generate Draft (only in reflection screen when no content) */}
          {currentScreen === 'reflection' &&
            onGenerateDraft &&
            !hasReflectionContent && (
              <GenerateDraftSection
                onGenerateDraft={onGenerateDraft}
                generateDraftDisabled={generateDraftDisabled}
                summary={summary}
                onClose={handleClose}
              />
            )}

          {/* Tone Presets (only in reflection screen when there's content) */}
          {currentScreen === 'reflection' &&
            onToneSelect &&
            hasReflectionContent && (
              <TonePresetSection
                selectedTone={selectedTone}
                onToneSelect={onToneSelect}
                tonesDisabled={tonesDisabled}
                isRewriting={isRewriting}
                onClose={handleClose}
              />
            )}

          {/* Proofread (shown in reflection screen when proofreading is enabled) */}
          {currentScreen === 'reflection' && onProofread && (
            <ProofreadSection
              onProofread={onProofread}
              proofreadDisabled={proofreadDisabled}
              isProofreading={isProofreading}
              hasReflectionContent={hasReflectionContent}
              activeReflectionIndex={activeReflectionIndex}
              onClose={handleClose}
            />
          )}

          {/* Divider above Tools */}
          <div className="reflexa-more-tools__divider" />

          {/* Tools at bottom: Mute + Language + Translate */}
          <ToolsSection
            ambientMuted={ambientMuted}
            onToggleAmbient={onToggleAmbient}
            reduceMotion={reduceMotion}
            onToggleReduceMotion={onToggleReduceMotion}
            onTranslateSummary={onTranslateSummary}
            isTranslating={isTranslating}
            unsupportedLanguages={unsupportedLanguages}
            defaultTargetLanguage={defaultTargetLanguage}
            onClose={handleClose}
          />
        </div>
      )}
    </div>
  );
};
