/**
 * Overlay Rendering Workflow
 * Handles rendering the reflection overlay with current state
 */

import { MeditationFlowOverlay } from '../components/MeditationFlowOverlay';
import { contentState } from '../state';
import { instanceManager } from '../core';
import { uiManager } from '../ui';
import type { Settings, SummaryFormat } from '../../types';
import {
  handleProofread,
  handleTranslate,
  handleTranslateToEnglish,
} from './aiOperations';
import {
  handleSaveReflection,
  handleCancelReflection,
} from './reflectionActions';

/**
 * Get default settings as fallback
 * @returns Default Settings object
 */
export function getDefaultSettings(): Settings {
  return {
    dwellThreshold: 10,
    enableSound: true,
    reduceMotion: false,
    proofreadEnabled: true,
    privacyMode: 'local',
    useNativeSummarizer: false,
    useNativeProofreader: false,
    translationEnabled: false,
    targetLanguage: 'en',
    defaultSummaryFormat: 'bullets',
    enableProofreading: true,
    enableTranslation: true,
    preferredTranslationLanguage: 'en',
    experimentalMode: false,
    autoDetectLanguage: true,
    voiceAutoStopDelay: 10000,
  };
}

/**
 * Create renderOverlay function with dependency injection
 * The returned function can be used to render the overlay with current state
 * @param formatChangeHandler - Handler for format changes (wrapped version from index.tsx)
 * @returns renderOverlay function
 */
export function createRenderOverlay(
  formatChangeHandler: (format: SummaryFormat) => Promise<void>
): () => void {
  return function renderOverlay(): void {
    const overlayInfo = uiManager.getOverlayRoot();
    if (!overlayInfo) return;

    const handleToggleAmbient = async (mute: boolean) => {
      const audioManagerForToggle = instanceManager.getAudioManager();
      if (!audioManagerForToggle) return;
      if (mute) {
        await audioManagerForToggle.stopAmbientLoopGracefully(400);
        contentState.setIsAmbientMuted(true);
      } else {
        await audioManagerForToggle.playAmbientLoopGracefully(400);
        contentState.setIsAmbientMuted(false);
      }
      // Re-render overlay to update mute button state
      renderOverlay();
    };

    const settingsForRender = instanceManager.getSettings();
    const audioManagerForRender = instanceManager.getAudioManager();
    const soundEnabled = Boolean(
      settingsForRender?.enableSound && audioManagerForRender
    );
    const translationEnabled = Boolean(settingsForRender?.enableTranslation);

    overlayInfo.root.render(
      <MeditationFlowOverlay
        summary={contentState.getSummary()}
        summaryDisplay={
          contentState.getSummaryDisplay().length
            ? contentState.getSummaryDisplay()
            : undefined
        }
        prompts={contentState.getPrompts()}
        onSave={handleSaveReflection}
        onCancel={handleCancelReflection}
        settings={instanceManager.getSettings() ?? getDefaultSettings()}
        onFormatChange={formatChangeHandler}
        currentFormat={contentState.getSummaryFormat()}
        isLoadingSummary={contentState.getIsLoadingSummary()}
        languageDetection={
          contentState.getOriginalContentLanguage() ?? undefined
        }
        summaryLanguageDetection={
          contentState.getLanguageDetection() ??
          contentState.getOriginalContentLanguage() ??
          undefined
        }
        onTranslateToEnglish={
          translationEnabled ? handleTranslateToEnglish : undefined
        }
        onTranslate={translationEnabled ? handleTranslate : undefined}
        isTranslating={
          translationEnabled ? contentState.getIsTranslating() : false
        }
        onProofread={handleProofread}
        ambientMuted={
          soundEnabled ? contentState.getIsAmbientMuted() : undefined
        }
        onToggleAmbient={soundEnabled ? handleToggleAmbient : undefined}
      />
    );
  };
}
