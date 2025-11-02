/**
 * Tools Section Component
 * Wrapper for MoreToolsMenu with step-specific configuration
 */

import React from 'react';
import { MoreToolsMenu } from '../MoreToolsMenu';
import type {
  Settings,
  SummaryFormat,
  TonePreset,
  LanguageDetection,
} from '../../../types';

interface ToolsSectionProps {
  step: number;
  currentScreen: 'summary' | 'reflection';
  currentFormat: SummaryFormat;
  onFormatChange?: (format: SummaryFormat) => Promise<void>;
  isLoadingSummary: boolean;
  summary: string[];
  settings: Settings;
  answers: string[];
  selectedTones: (TonePreset | undefined)[];
  onToneSelect?: (tone: TonePreset) => void;
  isRewriting: boolean[];
  onProofread?: (_index: number) => Promise<void>;
  isProofreading: boolean[];
  proofreaderAvailable: boolean;
  ambientMuted?: boolean;
  onToggleAmbient?: (mute: boolean) => void;
  reduceMotion?: boolean;
  onToggleReduceMotion?: (enabled: boolean) => void;
  onTranslateSummary?: (targetLanguage: string) => Promise<void>;
  isTranslating: boolean;
  summaryLanguageDetection?: LanguageDetection;
  defaultTargetLanguage?: string;
  onGenerateDraft?: (draft: string) => void;
}

export const ToolsSection: React.FC<ToolsSectionProps> = ({
  step,
  currentScreen,
  currentFormat,
  onFormatChange,
  isLoadingSummary,
  summary,
  settings,
  answers,
  selectedTones,
  onToneSelect,
  isRewriting,
  onProofread,
  isProofreading,
  proofreaderAvailable,
  ambientMuted,
  onToggleAmbient,
  reduceMotion,
  onToggleReduceMotion,
  onTranslateSummary,
  isTranslating,
  summaryLanguageDetection,
  defaultTargetLanguage,
  onGenerateDraft,
}) => {
  const reflectionIndex = step === 2 ? 0 : step === 3 ? 1 : undefined;

  return (
    <MoreToolsMenu
      currentScreen={currentScreen}
      currentFormat={currentFormat}
      onFormatChange={onFormatChange}
      isLoadingSummary={isLoadingSummary}
      onGenerateDraft={onGenerateDraft}
      generateDraftDisabled={false}
      summary={summary}
      selectedTone={
        reflectionIndex !== undefined
          ? selectedTones[reflectionIndex]
          : undefined
      }
      onToneSelect={onToneSelect}
      tonesDisabled={
        reflectionIndex !== undefined ? !answers[reflectionIndex]?.trim() : true
      }
      isRewriting={
        reflectionIndex !== undefined ? isRewriting[reflectionIndex] : false
      }
      hasReflectionContent={
        reflectionIndex !== undefined
          ? !!answers[reflectionIndex]?.trim()
          : false
      }
      onProofread={onProofread}
      proofreadDisabled={
        reflectionIndex !== undefined ? !answers[reflectionIndex]?.trim() : true
      }
      isProofreading={
        reflectionIndex !== undefined ? isProofreading[reflectionIndex] : false
      }
      proofreaderAvailable={proofreaderAvailable}
      activeReflectionIndex={reflectionIndex}
      ambientMuted={settings.enableSound ? ambientMuted : undefined}
      onToggleAmbient={settings.enableSound ? onToggleAmbient : undefined}
      reduceMotion={reduceMotion}
      onToggleReduceMotion={onToggleReduceMotion}
      onTranslateSummary={
        settings.enableTranslation ? onTranslateSummary : undefined
      }
      isTranslating={settings.enableTranslation ? isTranslating : false}
      currentLanguage={summaryLanguageDetection?.detectedLanguage}
      unsupportedLanguages={[]}
      defaultTargetLanguage={defaultTargetLanguage}
    />
  );
};
