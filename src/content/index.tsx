import './styles.css';
import { LotusNudge } from './components';
import { MeditationFlowOverlay } from './components/MeditationFlowOverlay';
import { performanceMonitor } from '../utils/performanceMonitor';
import { getLanguageName } from '../utils/translationHelpers';
import type {
  Message,
  Settings,
  AIResponse,
  Reflection,
  SummaryFormat,
  LanguageDetection,
  AICapabilities,
  TonePreset,
  ProofreadResult,
  VoiceInputMetadata,
} from '../types';
import { generateUUID } from '../utils';
import { ERROR_MESSAGES } from '../constants';
import { sendMessageToBackground, startAIStream } from './runtime/messageBus';
import { contentState } from './state';
import { instanceManager } from './core';
import {
  uiManager,
  setNudgeLoadingState,
  createShowErrorModal,
  createShowNotification,
} from './ui';

console.log('Reflexa AI content script initialized');

// Language names map removed (no longer shown in UI)

// Lotus nudge styles constant for better maintainability
const LOTUS_NUDGE_STYLES = `
  /* Keyframe animations */
  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes pulseGentle {
    0%,
    100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.9;
    }
  }

  /* Base component styles */
  .reflexa-nudge-wrapper {
    position: fixed;
    z-index: 999999;
  }

  .reflexa-nudge-wrapper--bottom-right { bottom: 32px; right: 32px; }
  .reflexa-nudge-wrapper--bottom-left { bottom: 32px; left: 32px; }
  .reflexa-nudge-wrapper--top-right { top: 32px; right: 32px; }
  .reflexa-nudge-wrapper--top-left { top: 32px; left: 32px; }

  /* Expand wrapper hit area to include the vertical quick-actions column */
  .reflexa-nudge-wrapper--bottom-left,
  .reflexa-nudge-wrapper--bottom-right {
    padding-top: 160px; /* height to cover 3 x 44px + gaps */
  }
  .reflexa-nudge-wrapper--top-left,
  .reflexa-nudge-wrapper--top-right {
    padding-bottom: 160px;
  }

  .reflexa-lotus-nudge {
    position: relative; /* positioned by wrapper */
    width: 64px;
    height: 64px;
    background: linear-gradient(
      135deg,
      var(--color-zen-500, #0ea5e9) 0%,
      var(--color-zen-600, #0284c7) 100%
    );
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    z-index: 999999;
    transition: transform 0.2s ease, box-shadow 0.2s ease, width 0.2s ease, border-radius 0.2s ease;
    padding: 0 16px;
    /* Apply animations */
    animation:
      fadeIn 0.1s ease-in-out,
      pulseGentle 2s ease-in-out infinite;
  }

  /* Quick circular actions (hidden by default) */
  .reflexa-nudge-quick {
    position: absolute;
    display: flex;
    flex-direction: column;
    gap: 12px;
    opacity: 0;
    transform: translateY(8px) scale(0.98);
    pointer-events: none;
    transition: opacity .18s ease, transform .18s ease;
  }

  .reflexa-nudge-wrapper--bottom-left .reflexa-nudge-quick { left: 0; bottom: 80px; }
  .reflexa-nudge-wrapper--bottom-right .reflexa-nudge-quick { right: 0; bottom: 80px; }
  .reflexa-nudge-wrapper--top-left .reflexa-nudge-quick { left: 0; top: 80px; }
  .reflexa-nudge-wrapper--top-right .reflexa-nudge-quick { right: 0; top: 80px; }

  .reflexa-nudge-wrapper[data-open="true"] .reflexa-nudge-quick,
  .reflexa-nudge-wrapper:hover .reflexa-nudge-quick,
  .reflexa-nudge-wrapper:focus-within .reflexa-nudge-quick {
    opacity: 1;
    transform: none;
    pointer-events: auto;
  }

  .reflexa-nudge-quick__btn {
    width: 44px;
    height: 44px;
    border-radius: 999px;
    border: none;
    background: var(--color-lotus-100, #eef2ff);
    color: var(--color-lotus-600, #4f46e5);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 20px rgba(79, 70, 229, 0.18);
    cursor: pointer;
    transition: transform .12s ease, box-shadow .12s ease;
  }
  .reflexa-nudge-quick__btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(79,70,229,.24); }
  .reflexa-nudge-quick__btn:active { transform: none; }
  .reflexa-nudge-quick__btn:focus-visible { outline: 3px solid rgba(79,70,229,.55); outline-offset: 3px; }

  /* Tooltips for quick actions */
  .reflexa-nudge-quick__btn {
    position: relative;
  }
  .reflexa-nudge-quick__tooltip {
    position: absolute;
    left: 52px;
    top: 50%;
    transform: translateY(-50%);
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--color-calm-900, #0f172a);
    color: #fff;
    font-size: 12px;
    line-height: 1;
    white-space: nowrap;
    box-shadow: 0 8px 20px rgba(0,0,0,.25);
    opacity: 0;
    pointer-events: none;
    transition: opacity .15s ease;
  }
  .reflexa-nudge-quick__btn:hover .reflexa-nudge-quick__tooltip,
  .reflexa-nudge-quick__btn:focus .reflexa-nudge-quick__tooltip { opacity: 1; }

  /* Position variants */
  .reflexa-lotus-nudge--bottom-right {}
  .reflexa-lotus-nudge--bottom-left {}
  .reflexa-lotus-nudge--top-right {}
  .reflexa-lotus-nudge--top-left {}

  /* Hover state */
  .reflexa-lotus-nudge:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(14, 165, 233, 0.4);
  }

  /* Expand into pill when open (hover/focus) */
  .reflexa-nudge-wrapper[data-open="true"] .reflexa-lotus-nudge,
  .reflexa-nudge-wrapper:hover .reflexa-lotus-nudge,
  .reflexa-nudge-wrapper:focus-within .reflexa-lotus-nudge {
    width: 220px;
    border-radius: 999px;
    justify-content: flex-start;
    gap: 10px;
  }

  .reflexa-lotus-nudge__label {
    color: #fff;
    font-weight: 700;
    font-size: 14px;
    letter-spacing: .02em;
    opacity: 0;
    width: 0;
    margin-left: 0;
    overflow: hidden;
    white-space: nowrap;
    transition: opacity .18s ease, width .18s ease, margin-left .18s ease;
  }
  .reflexa-nudge-wrapper[data-open="true"] .reflexa-lotus-nudge__label,
  .reflexa-nudge-wrapper:hover .reflexa-lotus-nudge__label,
  .reflexa-nudge-wrapper:focus-within .reflexa-lotus-nudge__label {
    opacity: 1;
    width: auto;
    margin-left: 8px;
  }

  /* Active state */
  .reflexa-lotus-nudge:active {
    transform: scale(0.95);
  }

  /* Focus state */
  .reflexa-lotus-nudge:focus-visible {
    outline: 3px solid #0ea5e9;
    outline-offset: 4px;
  }

  /* Loading state */
  .reflexa-lotus-nudge--loading {
    cursor: wait;
    pointer-events: none;
    opacity: 0.7;
  }

  .reflexa-lotus-nudge--loading::after {
    content: '';
    position: absolute;
    width: 24px;
    height: 24px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Respect reduced motion preferences */
  @media (prefers-reduced-motion: reduce) {
    .reflexa-lotus-nudge {
      animation: fadeIn 0.3s ease-in-out;
    }
    .reflexa-nudge-quick { transition: none; }
  }
`;

/**
 * Update the session target language based on current settings.
 * Defaults to the preferred translation language when translation
 * features are enabled. Clears the override when translation is off.
 */
const applyTranslationPreference = (settings: Settings | null | undefined) => {
  const translationActive = Boolean(
    settings?.enableTranslation ?? settings?.translationEnabled
  );

  if (!translationActive) {
    contentState.setSelectedTargetLanguage(null);
    contentState.setPreferredLanguageBaseline(null);
    contentState.setIsTargetLanguageOverridden(false);
    return;
  }

  let derived = settings?.preferredTranslationLanguage?.trim();

  if (!derived) {
    const targetCandidate = settings?.targetLanguage?.trim();
    if (targetCandidate && targetCandidate.length > 0) {
      derived = targetCandidate;
    }
  }

  if (!derived) {
    const browserLanguage = navigator.language?.split('-')[0];
    if (browserLanguage && browserLanguage.length > 0) {
      derived = browserLanguage;
    } else {
      derived = 'en';
    }
  }

  if (!derived) {
    derived = 'en';
  }

  contentState.setPreferredLanguageBaseline(derived);

  if (
    !contentState.getIsTargetLanguageOverridden() ||
    !contentState.getSelectedTargetLanguage()
  ) {
    contentState.setSelectedTargetLanguage(derived);
    contentState.setIsTargetLanguageOverridden(false);
  }

  if (!translationActive) {
    // Even when translation toggles are off, keep baseline so AI defaults to the preferred language.
    return;
  }
};

/**
 * Initiate the complete reflection flow
 * Extracts content, requests AI processing, and shows overlay
 */
const initiateReflectionFlow = async () => {
  try {
    console.log('Starting reflection flow...');

    const settingsForReflection = instanceManager.getSettings();
    applyTranslationPreference(settingsForReflection);

    // Show loading state
    setNudgeLoadingState(true);

    // Check AI availability first if not already checked
    if (contentState.getAIAvailable() === null) {
      const aiCheckResponse = await sendMessageToBackground<boolean>({
        type: 'checkAI',
      });

      if (aiCheckResponse.success) {
        contentState.setAIAvailable(aiCheckResponse.data);
        console.log('AI availability:', contentState.getAIAvailable());
        if (!contentState.getAIAvailable()) {
          console.log(
            '💡 To enable AI: Check background service worker logs for instructions'
          );
        }
      } else {
        contentState.setAIAvailable(false);
        console.error('AI check failed:', aiCheckResponse.error);
      }
    }

    // Get AI capabilities
    if (contentState.getAICapabilities() === null) {
      const capabilitiesResponse =
        await sendMessageToBackground<AICapabilities>({
          type: 'getCapabilities',
        });

      if (capabilitiesResponse.success) {
        contentState.setAICapabilities(capabilitiesResponse.data);
        console.log('AI capabilities:', contentState.getAICapabilities());
      } else {
        console.error(
          'Failed to get capabilities:',
          capabilitiesResponse.error
        );
      }
    }

    // Extract content from the page
    const contentExtractor = instanceManager.getContentExtractor();

    contentState.setExtractedContent(contentExtractor.extractMainContent());
    const extractedContentInitial = contentState.getExtractedContent();
    if (extractedContentInitial) {
      console.log(
        `Extracted ${extractedContentInitial.wordCount} words from page`
      );

      // Check if content exceeds token limit
      const { exceeds, tokens } = contentExtractor.checkTokenLimit(
        extractedContentInitial
      );
      if (exceeds) {
        console.warn(
          `Content exceeds token limit (${tokens} tokens), will be truncated`
        );
        contentState.setExtractedContent(
          contentExtractor.getTruncatedContent(extractedContentInitial)
        );
      }
    } else {
      console.error('Failed to extract content');
      return;
    }

    // Show notification about truncation if needed
    // (notification was shown above if truncation occurred)

    // If AI is unavailable, show modal and proceed with manual mode
    if (!contentState.getAIAvailable()) {
      console.warn('AI unavailable, showing manual mode modal');
      showErrorModal(
        'AI Unavailable',
        ERROR_MESSAGES.AI_UNAVAILABLE,
        'ai-unavailable',
        () => {
          hideErrorModal();
          // Proceed with manual mode
          contentState.setSummary(['', '', '']);
          contentState.setSummaryDisplay(contentState.getSummary());
          contentState.setPrompts([
            'What did you find most interesting?',
            'How might you apply this?',
          ]);
          void showReflectModeOverlay();
        },
        'Continue with Manual Mode'
      );
      return;
    }

    // Show the Reflect Mode overlay immediately with loading state
    contentState.setIsLoadingSummary(true);
    contentState.setSummary([]);
    contentState.setSummaryDisplay([]);
    contentState.setPrompts([
      'What did you find most interesting?',
      'How might you apply this?',
    ]);
    void showReflectModeOverlay();

    // Request language detection first, then use it for summarization
    // This happens during the breathing phase (Step 0)
    console.log('Requesting language detection...');

    // Detect language first
    const extractedContentForLang = contentState.getExtractedContent();
    if (!extractedContentForLang) {
      console.error('No extracted content available for language detection');
      return;
    }

    const languageResponse = await sendMessageToBackground<LanguageDetection>({
      type: 'detectLanguage',
      payload: {
        text: extractedContentForLang.text.substring(0, 500),
        pageUrl: extractedContentForLang.url,
      },
    });

    // Handle language detection
    let detectedLanguageCode: string | undefined;
    if (languageResponse.success) {
      contentState.setLanguageDetection(languageResponse.data);
      if (!contentState.getOriginalContentLanguage()) {
        contentState.setOriginalContentLanguage(languageResponse.data);
      }
      detectedLanguageCode = languageResponse.data.detectedLanguage;
      const detection = contentState.getLanguageDetection();
      // Capture original language once per session
      if (detection) {
        console.log(
          `Language detected: ${detection.languageName} (${detection.detectedLanguage})`
        );
      }
    } else {
      console.warn('Language detection failed:', languageResponse.error);
    }

    // Now request AI summarization with detected language
    console.log('Requesting AI summarization...');

    // Use default format from settings or fallback to bullets
    const settingsForFormat = instanceManager.getSettings();
    const defaultFormat = settingsForFormat?.defaultSummaryFormat ?? 'bullets';
    contentState.setSummaryFormat(defaultFormat);

    const extractedContentForSummary = contentState.getExtractedContent();
    if (!extractedContentForSummary) {
      console.error('No extracted content for summarization');
      return;
    }

    let summaryStreamed = false;
    const settingsForNative = instanceManager.getSettings();
    if (settingsForNative?.useNativeSummarizer) {
      try {
        summaryStreamed = await summarizeWithStreaming(
          extractedContentForSummary.text,
          defaultFormat,
          detectedLanguageCode
        );
      } catch (streamError) {
        console.warn('Streaming summarization unavailable:', streamError);
        contentState.setSummaryBuffer('');
        contentState.setSummary([]);
        contentState.setSummaryDisplay([]);
        contentState.setIsLoadingSummary(true);
      }
    }

    let summaryResponse: AIResponse<string[]> | null = null;

    if (!summaryStreamed) {
      summaryResponse = await sendMessageToBackground<string[]>({
        type: 'summarize',
        payload: {
          content: extractedContentForSummary.text,
          format: defaultFormat,
          detectedLanguage: detectedLanguageCode,
        },
      });

      if (!summaryResponse.success) {
        console.error('Summarization failed:', summaryResponse.error);
        contentState.setIsLoadingSummary(false);

        if (summaryResponse.error.includes('timeout')) {
          contentState.setSummary(['', '', '']);
          contentState.setSummaryDisplay(contentState.getSummary());
          void showReflectModeOverlay();
          return;
        }

        contentState.setSummary(['', '', '']);
        contentState.setSummaryDisplay(contentState.getSummary());
        void showReflectModeOverlay();
        return;
      }

      contentState.setSummary(summaryResponse.data);
      contentState.setSummaryDisplay(summaryResponse.data);
      contentState.setSummaryStreamComplete(true);
      stopSummaryAnimation();
      console.log('Summary received:', contentState.getSummary());
      contentState.setIsLoadingSummary(false);
    } else {
      console.log('Summary received (streaming):', contentState.getSummary());
    }

    const detectionBeforeSummary = contentState.getLanguageDetection();

    if (detectionBeforeSummary) {
      if (!contentState.getOriginalDetectedLanguage()) {
        contentState.setOriginalDetectedLanguage(
          detectionBeforeSummary.detectedLanguage
        );
      }
      if (!contentState.getOriginalContentLanguage()) {
        contentState.setOriginalContentLanguage(detectionBeforeSummary);
      }
      console.log('Language detected:', detectionBeforeSummary);

      // Auto-translate if needed (during breathing phase)
      const settingsForAutoTranslate = instanceManager.getSettings();
      if (
        shouldAutoTranslate(detectionBeforeSummary, settingsForAutoTranslate)
      ) {
        console.log('Auto-translating during breathing phase...');
        await handleAutoTranslate(detectionBeforeSummary);
      }
    }

    const summaryLanguageCode =
      contentState.getSelectedTargetLanguage() ??
      contentState.getPreferredLanguageBaseline() ??
      instanceManager.getSettings()?.preferredTranslationLanguage ??
      instanceManager.getSettings()?.targetLanguage ??
      detectionBeforeSummary?.detectedLanguage;

    if (summaryLanguageCode) {
      contentState.setLanguageDetection({
        detectedLanguage: summaryLanguageCode,
        confidence:
          summaryLanguageCode === detectionBeforeSummary?.detectedLanguage
            ? (detectionBeforeSummary?.confidence ?? 1)
            : 1,
        languageName: getLanguageName(summaryLanguageCode),
      });
    } else {
      contentState.setLanguageDetection(detectionBeforeSummary);
    }

    const badgeLanguageDetection =
      contentState.getOriginalContentLanguage() ?? undefined;
    const summaryLanguageDetection =
      contentState.getLanguageDetection() ??
      contentState.getOriginalContentLanguage() ??
      undefined;

    // Re-render overlay with summary loaded
    const overlayInfo = uiManager.getOverlayRoot();
    if (overlayInfo) {
      const settingsForOverlay = instanceManager.getSettings();
      const audioManagerForOverlay = instanceManager.getAudioManager();
      const soundEnabled = Boolean(
        settingsForOverlay?.enableSound && audioManagerForOverlay
      );
      const translationEnabled = Boolean(settingsForOverlay?.enableTranslation);
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
          onFormatChange={handleFormatChange}
          currentFormat={contentState.getSummaryFormat()}
          isLoadingSummary={false}
          languageDetection={badgeLanguageDetection}
          summaryLanguageDetection={summaryLanguageDetection}
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
          onToggleAmbient={
            soundEnabled
              ? async (mute) => {
                  const audioManagerForAmbient =
                    instanceManager.getAudioManager();
                  if (!audioManagerForAmbient) return;
                  if (mute) {
                    await audioManagerForAmbient.stopAmbientLoopGracefully(400);
                    contentState.setIsAmbientMuted(true);
                  } else {
                    await audioManagerForAmbient.playAmbientLoopGracefully(400);
                    contentState.setIsAmbientMuted(false);
                  }
                  renderOverlay();
                }
              : undefined
          }
        />
      );
    }

    // Request AI reflection prompts
    console.log('Requesting reflection prompts...');
    const promptsResponse = await sendMessageToBackground<string[]>({
      type: 'reflect',
      payload: contentState.getSummary(),
    });

    if (!promptsResponse.success) {
      console.error('Reflection prompts failed:', promptsResponse.error);
      // Use default prompts
      contentState.setPrompts([
        'What did you find most interesting?',
        'How might you apply this?',
      ]);
    } else {
      contentState.setPrompts(promptsResponse.data);
      console.log('Prompts received:', contentState.getPrompts());
    }

    // Update the overlay with prompts
    void showReflectModeOverlay();
  } catch (error) {
    console.error('Error in reflection flow:', error);
    // Show overlay with manual mode
    contentState.setSummary(['', '', '']);
    contentState.setPrompts([
      'What did you find most interesting?',
      'How might you apply this?',
    ]);
    void showReflectModeOverlay();
  } finally {
    // Hide loading state
    setNudgeLoadingState(false);
  }
};

/**
 * Determine if content should be auto-translated
 */
const shouldAutoTranslate = (
  detection: LanguageDetection,
  settings: Settings | null
): boolean => {
  if (!settings?.enableTranslation) return false;
  if (!detection) return false;

  const userLang = navigator.language.split('-')[0];

  // Don't translate if already in user's language
  if (detection.detectedLanguage === userLang) return false;

  // Don't translate if already in preferred language
  if (detection.detectedLanguage === settings.preferredTranslationLanguage) {
    return false;
  }

  // Only auto-translate if confidence is very high (90%+)
  const threshold = 0.9;
  if (detection.confidence < threshold) return false;

  return true;
};

/**
 * Auto-translate content during breathing phase
 */
const handleAutoTranslate = async (detection: LanguageDetection) => {
  try {
    const targetLang =
      instanceManager.getSettings()?.preferredTranslationLanguage ??
      navigator.language.split('-')[0];

    // Check cache first
    const extractedContent = contentState.getExtractedContent();
    const cacheKey = `translation:${extractedContent?.url}:${detection.detectedLanguage}:${targetLang}`;
    const cached = await chrome.storage.local.get(cacheKey);

    if (cached[cacheKey]) {
      const cachedData = cached[cacheKey] as {
        summary: string[];
        timestamp: number;
      };
      const age = Date.now() - cachedData.timestamp;

      // Use cache if less than 24 hours old
      if (age < 24 * 60 * 60 * 1000) {
        console.log('Using cached translation');
        contentState.setSummary(cachedData.summary);
        contentState.setSummaryDisplay(cachedData.summary);
        stopSummaryAnimation();
        contentState.setSummaryStreamComplete(true);
        contentState.setSelectedTargetLanguage(targetLang);
        contentState.setLanguageDetection({
          detectedLanguage: targetLang,
          confidence: 1,
          languageName: getLanguageName(targetLang),
        });
        return;
      }
    }

    // Translate each bullet
    const translatedSummary: string[] = [];
    let successCount = 0;
    for (const bullet of contentState.getSummary()) {
      const response = await sendMessageToBackground<string>({
        type: 'translate',
        payload: {
          text: bullet,
          source: detection.detectedLanguage,
          target: targetLang,
        },
      });

      if (response.success) {
        translatedSummary.push(response.data);
        successCount += 1;
      } else {
        translatedSummary.push(bullet); // Keep original on error
      }
    }

    if (successCount === 0) {
      console.warn('Auto-translation skipped: no successful translations');
      return;
    }

    // Update summary
    contentState.setSummary(translatedSummary);
    contentState.setSummaryDisplay(translatedSummary);
    stopSummaryAnimation();
    contentState.setSummaryStreamComplete(true);

    if (successCount === translatedSummary.length) {
      contentState.setSelectedTargetLanguage(targetLang);
      contentState.setIsTargetLanguageOverridden(
        contentState.getPreferredLanguageBaseline() !== null &&
          targetLang !== contentState.getPreferredLanguageBaseline()
      );
      contentState.setLanguageDetection({
        detectedLanguage: targetLang,
        confidence: 1,
        languageName: getLanguageName(targetLang),
      });

      // Cache result only if we translated all bullets
      await chrome.storage.local.set({
        [cacheKey]: {
          summary: translatedSummary,
          timestamp: Date.now(),
        },
      });
    } else {
      console.warn('Auto-translation partially succeeded; cache skipped');
    }

    console.log('Auto-translation complete');
  } catch (error) {
    console.error('Auto-translation failed:', error);
    // Keep original summary on error
  }
};
const parseSummaryBuffer = (
  buffer: string,
  format: SummaryFormat
): string[] => {
  const normalized = buffer.replace(/\r/g, '');
  if (!normalized.trim()) {
    return [];
  }

  if (format === 'paragraph') {
    return [normalized.trim()];
  }

  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^[*•-]\s*/, '').trim());

  return lines;
};

const stopSummaryAnimation = () => {
  if (contentState.getSummaryAnimationTimer() !== null) {
    window.clearTimeout(contentState.getSummaryAnimationTimer()!);
    contentState.setSummaryAnimationTimer(null);
  }
};

const stepSummaryAnimation = () => {
  const targetLength = contentState.getSummaryBuffer().length;
  if (contentState.getSummaryAnimationIndex() >= targetLength) {
    contentState.setSummaryAnimationTimer(null);
    if (contentState.getSummaryStreamComplete()) {
      contentState.setSummaryDisplay(
        parseSummaryBuffer(
          contentState.getSummaryBuffer(),
          contentState.getSummaryAnimationFormat()
        )
      );
      renderOverlay();
    }
    return;
  }

  contentState.setSummaryAnimationIndex(
    Math.min(contentState.getSummaryAnimationIndex() + 3, targetLength)
  );

  const partial = contentState
    .getSummaryBuffer()
    .slice(0, contentState.getSummaryAnimationIndex());
  contentState.setSummaryDisplay(
    parseSummaryBuffer(partial, contentState.getSummaryAnimationFormat())
  );
  renderOverlay();

  contentState.setSummaryAnimationTimer(
    window.setTimeout(stepSummaryAnimation, 20)
  );
};

const startSummaryAnimation = (format: SummaryFormat) => {
  contentState.setSummaryAnimationFormat(format);
  if (contentState.getSummaryAnimationTimer() !== null) return;
  contentState.setSummaryAnimationTimer(
    window.setTimeout(stepSummaryAnimation, 0)
  );
};

const summarizeWithStreaming = async (
  content: string,
  format: SummaryFormat,
  detectedLanguage?: string
): Promise<boolean> => {
  if (format === 'headline-bullets') {
    return false;
  }

  return new Promise<boolean>((resolve, reject) => {
    contentState.setSummaryBuffer('');
    contentState.setSummary([]);
    contentState.setSummaryDisplay([]);
    contentState.setSummaryAnimationIndex(0);
    contentState.setSummaryStreamComplete(false);
    stopSummaryAnimation();
    let receivedChunk = false;
    let completed = false;

    if (contentState.getActiveSummaryStreamCleanup()) {
      contentState.getActiveSummaryStreamCleanup()?.();
      contentState.setActiveSummaryStreamCleanup(null);
    }

    const { cancel } = startAIStream(
      'summarize-stream',
      {
        content,
        format,
        detectedLanguage,
      },
      {
        onChunk: (chunk) => {
          if (!chunk) return;
          receivedChunk = true;
          contentState.setSummaryBuffer(
            contentState.getSummaryBuffer() + chunk
          );
          if (contentState.getIsLoadingSummary()) {
            contentState.setIsLoadingSummary(false);
          }
          startSummaryAnimation(format);
        },
        onComplete: (finalData) => {
          completed = true;
          if (typeof finalData === 'string' && finalData.length > 0) {
            contentState.setSummaryBuffer(finalData);
          }
          const finalSummary = parseSummaryBuffer(
            contentState.getSummaryBuffer(),
            format
          );
          contentState.setSummary(finalSummary);
          contentState.setSummaryStreamComplete(true);
          if (!receivedChunk) {
            startSummaryAnimation(format);
          } else if (contentState.getSummaryAnimationTimer() === null) {
            contentState.setSummaryDisplay(finalSummary);
            renderOverlay();
          }
          contentState.setIsLoadingSummary(false);
          contentState.setActiveSummaryStreamCleanup(null);
          resolve(
            parseSummaryBuffer(contentState.getSummaryBuffer(), format).length >
              0
          );
        },
        onError: (error) => {
          console.warn('Summarize stream error:', error);
          if (!completed) {
            contentState.setSummaryBuffer('');
          }
          contentState.setActiveSummaryStreamCleanup(null);
          contentState.setSummaryStreamComplete(true);
          if (receivedChunk) {
            resolve(false);
          } else {
            reject(new Error(error));
          }
        },
      }
    );

    contentState.setActiveSummaryStreamCleanup(() => {
      cancel();
      contentState.setActiveSummaryStreamCleanup(null);
    });
  });
};

/**
 * Helper function to render the overlay with current state
 * Used for initial render and re-renders when state changes
 */
const renderOverlay = () => {
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
      onFormatChange={handleFormatChange}
      currentFormat={contentState.getSummaryFormat()}
      isLoadingSummary={contentState.getIsLoadingSummary()}
      languageDetection={contentState.getOriginalContentLanguage() ?? undefined}
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
      ambientMuted={soundEnabled ? contentState.getIsAmbientMuted() : undefined}
      onToggleAmbient={soundEnabled ? handleToggleAmbient : undefined}
    />
  );
};

/**
 * Show the Reflect Mode overlay
 * Creates shadow DOM and renders the overlay component
 * Optimized to minimize layout shifts and track render time
 */
const showReflectModeOverlay = async () => {
  const overlayState = contentState.getOverlayState();
  if (overlayState.isVisible) {
    console.log('Overlay already visible');
    return;
  }

  // Start performance measurement
  performanceMonitor.startMeasure('overlay-render');

  console.log('Showing Reflect Mode overlay...');

  // Load current settings
  const settings = await (async () => {
    const settingsResponse = await sendMessageToBackground<Settings>({
      type: 'getSettings',
    });
    return settingsResponse.success ? settingsResponse.data : null;
  })();

  if (settings) {
    instanceManager.setSettings(settings);
  }

  // Initialize audio manager if sound is enabled
  if (settings?.enableSound) {
    instanceManager.initializeAudioManager(settings);
  }

  // Play entry chime and ambient loop if enabled
  const audioManagerForPlay = instanceManager.getAudioManager();
  if (settings?.enableSound && audioManagerForPlay) {
    void audioManagerForPlay.playEntryChime();
    void audioManagerForPlay.playAmbientLoop();
  }

  // Create overlay container using uiManager
  // We'll render an empty placeholder first, then use renderOverlay() to render with state
  uiManager.showOverlay(<div />);

  // Use the helper function for initial render
  renderOverlay();

  // End performance measurement
  performanceMonitor.endMeasure('overlay-render');

  // Start frame rate monitoring if animations are enabled
  const settingsForMotion = instanceManager.getSettings();
  if (!settingsForMotion?.reduceMotion) {
    performanceMonitor.startFrameRateMonitoring();
  }

  // Log memory usage
  performanceMonitor.logMemoryUsage();

  console.log('Reflect Mode overlay displayed');
};

/**
 * Get default settings as fallback
 * @returns Default Settings object
 */
const getDefaultSettings = (): Settings => ({
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
});

/**
 * Handle save reflection action
 * Sends reflection data to background worker for storage
 */
const handleSaveReflection = async (
  reflections: string[],
  voiceMetadata?: VoiceInputMetadata[],
  originalReflections?: (string | null)[]
) => {
  console.log('Saving reflection...');

  try {
    // Stop ambient audio if playing
    instanceManager.stopAudioManager();

    // Determine if any reflection was proofread
    // If originalReflections has non-null values, it means proofreading was applied
    const hasProofreadVersion = originalReflections?.some(
      (orig) => orig !== null
    );

    // Build the final reflection array
    // Use original versions where available, otherwise use current reflections
    const finalReflections = reflections.map((reflection, index) => {
      const original = originalReflections?.[index];
      return original ?? reflection;
    });

    // Create reflection object
    const reflection: Reflection = {
      id: generateUUID(),
      url: contentState.getExtractedContent()?.url ?? window.location.href,
      title: contentState.getExtractedContent()?.title ?? document.title,
      createdAt: Date.now(),
      summary: contentState.getSummary(),
      reflection: finalReflections,
      proofreadVersion: hasProofreadVersion
        ? reflections.join('\n\n')
        : undefined,
      voiceMetadata,
    };

    // Send to background worker for storage
    const saveResponse = await sendMessageToBackground<void>({
      type: 'save',
      payload: reflection,
    });

    if (!saveResponse.success) {
      console.error('Failed to save reflection:', saveResponse.error);

      // Check if it's a storage full error
      if (saveResponse.error.includes('Storage full')) {
        // Hide overlay first
        hideReflectModeOverlay();

        // Show storage full modal with export option
        showErrorModal(
          'Storage Full',
          ERROR_MESSAGES.STORAGE_FULL,
          'storage-full',
          () => {
            hideErrorModal();
            // Open popup to export reflections
            void chrome.runtime.sendMessage({ type: 'openPopup' });
          },
          'Export Reflections'
        );
        return;
      }

      // Show generic error notification
      showNotification(
        'Save Failed',
        saveResponse.error || ERROR_MESSAGES.GENERIC_ERROR,
        'error'
      );
    } else {
      console.log('Reflection saved successfully');

      // Play completion bell if enabled (before hiding overlay)
      const settingsForBell = instanceManager.getSettings();
      const audioManagerForBell = instanceManager.getAudioManager();
      if (settingsForBell?.enableSound && audioManagerForBell) {
        void audioManagerForBell.playCompletionBell();
      }
    }

    // Wait a brief moment for the completion bell to start playing
    // before hiding the overlay (bell continues playing after overlay closes)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Clean up and hide overlay
    hideReflectModeOverlay();
    resetReflectionState();
  } catch (error) {
    console.error('Error saving reflection:', error);

    // Show error notification
    showNotification(
      'Save Failed',
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      'error'
    );

    // Still hide overlay even if save failed
    hideReflectModeOverlay();
    resetReflectionState();
  }
};

/**
 * Handle cancel reflection action
 * Closes overlay without saving and shows the nudge again
 */
const handleCancelReflection = () => {
  console.log('Reflection cancelled');

  // Stop ambient audio if playing
  instanceManager.stopAudioManager();

  // Clean up and hide overlay
  hideReflectModeOverlay();
  resetReflectionState();

  // Show the lotus nudge again so user can retry
  showLotusNudge();
};

/**
 * Handle proofread request
 * Sends text to background worker for AI proofreading
 */
const handleProofread = async (
  text: string,
  index: number
): Promise<ProofreadResult> => {
  console.log(`Proofreading reflection ${index}...`);

  try {
    // Determine expected language for proofreading
    const expectedLanguage =
      contentState.getSelectedTargetLanguage() ??
      contentState.getOriginalDetectedLanguage() ??
      'en';

    const proofreadResponse = await sendMessageToBackground<ProofreadResult>({
      type: 'proofread',
      payload: {
        text,
        expectedLanguage,
      },
    });

    if (proofreadResponse.success) {
      console.log('Proofread completed');
      let result = proofreadResponse.data;

      // Ensure proofread output is in selected target language, if any
      if (contentState.getSelectedTargetLanguage() && result.correctedText) {
        try {
          const detect = await sendMessageToBackground<LanguageDetection>({
            type: 'detectLanguage',
            payload: {
              text: result.correctedText.substring(0, 500),
              pageUrl: contentState.getExtractedContent()?.url ?? location.href,
            },
          });
          const sourceLang = detect.success
            ? detect.data.detectedLanguage
            : (contentState.getOriginalDetectedLanguage() ?? 'en');
          if (sourceLang !== contentState.getSelectedTargetLanguage()) {
            const tr = await sendMessageToBackground<string>({
              type: 'translate',
              payload: {
                text: result.correctedText,
                source: sourceLang,
                target: contentState.getSelectedTargetLanguage() ?? 'en',
              },
            });
            if (tr.success) {
              result = { ...result, correctedText: tr.data };
            }
          }
        } catch (e) {
          console.warn('Proofread translation skipped due to error:', e);
        }
      }

      return result;
    } else {
      console.error('Proofread failed:', proofreadResponse.error);
      throw new Error(proofreadResponse.error);
    }
  } catch (error) {
    console.error('Error proofreading:', error);
    throw error;
  }
};

/**
 * Handle translate request
 * Translates summary and prompts to target language
 */
const handleTranslate = async (targetLanguage: string) => {
  if (
    !contentState.getLanguageDetection() ||
    !contentState.getExtractedContent()
  ) {
    return;
  }

  console.log(`Translating to ${targetLanguage}...`);
  contentState.setIsTranslating(true);

  // Re-render with loading state
  const overlayState = contentState.getOverlayState();
  if (overlayState.root && overlayState.container) {
    const settingsForTranslateRender = instanceManager.getSettings();
    const audioManagerForTranslateRender = instanceManager.getAudioManager();
    const soundEnabled = Boolean(
      settingsForTranslateRender?.enableSound && audioManagerForTranslateRender
    );
    const badgeLanguageDetection =
      contentState.getOriginalContentLanguage() ?? undefined;
    const summaryLanguageDetection =
      contentState.getLanguageDetection() ??
      contentState.getOriginalContentLanguage() ??
      undefined;
    overlayState.root.render(
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
        settings={settingsForTranslateRender ?? getDefaultSettings()}
        onProofread={handleProofread}
        onFormatChange={handleFormatChange}
        currentFormat={contentState.getSummaryFormat()}
        isLoadingSummary={false}
        languageDetection={badgeLanguageDetection}
        summaryLanguageDetection={summaryLanguageDetection}
        onTranslateToEnglish={handleTranslateToEnglish}
        onTranslate={handleTranslate}
        isTranslating={true}
        onRewrite={handleRewrite}
        isRewriting={contentState.getReflectionState().isRewriting}
        proofreaderAvailable={
          contentState.getAICapabilities()?.proofreader ?? false
        }
        ambientMuted={
          soundEnabled ? contentState.getIsAmbientMuted() : undefined
        }
        onToggleAmbient={
          soundEnabled
            ? async (mute) => {
                const audioManagerForAmbientToggle =
                  instanceManager.getAudioManager();
                if (!audioManagerForAmbientToggle) return;
                if (mute) {
                  await audioManagerForAmbientToggle.stopAmbientLoopGracefully(
                    400
                  );
                  contentState.setIsAmbientMuted(true);
                } else {
                  await audioManagerForAmbientToggle.playAmbientLoopGracefully(
                    400
                  );
                  contentState.setIsAmbientMuted(false);
                }
                renderOverlay();
              }
            : undefined
        }
      />
    );
  }

  try {
    const sourceLanguageCode =
      contentState.getOriginalContentLanguage()?.detectedLanguage ??
      contentState.getOriginalDetectedLanguage() ??
      contentState.getLanguageDetection()?.detectedLanguage ??
      'en';

    const summaryResponse = await sendMessageToBackground<string[]>({
      type: 'summarize',
      payload: {
        content: contentState.getExtractedContent()?.text ?? '',
        format: contentState.getSummaryFormat(),
        detectedLanguage: sourceLanguageCode,
        targetLanguage,
      },
    });

    if (!summaryResponse.success) {
      console.error('Regeneration in target language failed:', summaryResponse);
      showNotification(
        'Translation Failed',
        'Could not regenerate summary in the selected language',
        'error'
      );
      return;
    }

    contentState.setSummary(summaryResponse.data);
    contentState.setSummaryDisplay(summaryResponse.data);
    contentState.setSummaryBuffer('');
    contentState.setSummaryStreamComplete(true);

    let detectedSummaryLanguage = sourceLanguageCode;
    let requiresPostTranslation = true;

    try {
      const detectionSample = summaryResponse.data.join('\n').slice(0, 500);
      if (detectionSample.trim().length > 0) {
        const detectResponse = await sendMessageToBackground<LanguageDetection>(
          {
            type: 'detectLanguage',
            payload: {
              text: detectionSample,
              pageUrl: contentState.getExtractedContent()?.url ?? location.href,
            },
          }
        );
        if (detectResponse.success) {
          detectedSummaryLanguage = detectResponse.data.detectedLanguage;
          requiresPostTranslation =
            detectResponse.data.detectedLanguage !== targetLanguage;
        } else {
          requiresPostTranslation = true;
        }
      }
    } catch (detectError) {
      console.warn(
        'Failed to detect summary language, falling back to translation:',
        detectError
      );
      requiresPostTranslation = true;
    }

    if (requiresPostTranslation) {
      const translatedSummary: string[] = [];
      for (const bullet of contentState.getSummary()) {
        const translateResponse = await sendMessageToBackground<string>({
          type: 'translate',
          payload: {
            text: bullet,
            source: detectedSummaryLanguage ?? sourceLanguageCode ?? 'en',
            target: targetLanguage,
          },
        });

        translatedSummary.push(
          translateResponse.success ? translateResponse.data : bullet
        );
      }

      contentState.setSummary(translatedSummary);
      contentState.setSummaryDisplay(translatedSummary);
    }

    contentState.setSelectedTargetLanguage(targetLanguage);
    contentState.setIsTargetLanguageOverridden(
      contentState.getPreferredLanguageBaseline() !== null
        ? targetLanguage !== contentState.getPreferredLanguageBaseline()
        : true
    );
    contentState.setLanguageDetection({
      detectedLanguage: targetLanguage,
      confidence: 1,
      languageName: getLanguageName(targetLanguage),
    });

    showNotification(
      'Translation Complete',
      `Summary regenerated in ${getLanguageName(targetLanguage)}`,
      'info'
    );
  } catch (error) {
    console.error('Error translating:', error);
    showNotification(
      'Translation Failed',
      'Could not regenerate summary in the selected language',
      'error'
    );
  } finally {
    contentState.setIsTranslating(false);

    // Re-render overlay with translated content
    const overlayInfoFinal = uiManager.getOverlayRoot();
    if (overlayInfoFinal) {
      const soundEnabled = Boolean(
        instanceManager.getSettings()?.enableSound &&
          instanceManager.getAudioManager()
      );
      const badgeLanguageDetection =
        contentState.getOriginalContentLanguage() ?? undefined;
      const summaryLanguageDetection =
        contentState.getLanguageDetection() ??
        contentState.getOriginalContentLanguage() ??
        undefined;
      overlayInfoFinal.root.render(
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
          onProofread={handleProofread}
          onFormatChange={handleFormatChange}
          currentFormat={contentState.getSummaryFormat()}
          isLoadingSummary={false}
          languageDetection={badgeLanguageDetection}
          summaryLanguageDetection={summaryLanguageDetection}
          onTranslateToEnglish={handleTranslateToEnglish}
          onTranslate={handleTranslate}
          isTranslating={false}
          onRewrite={handleRewrite}
          isRewriting={contentState.getReflectionState().isRewriting}
          proofreaderAvailable={
            contentState.getAICapabilities()?.proofreader ?? false
          }
          ambientMuted={
            soundEnabled ? contentState.getIsAmbientMuted() : undefined
          }
          onToggleAmbient={
            soundEnabled
              ? async (mute) => {
                  const audioManagerForAmbient =
                    instanceManager.getAudioManager();
                  if (!audioManagerForAmbient) return;
                  if (mute) {
                    await audioManagerForAmbient.stopAmbientLoopGracefully(400);
                    contentState.setIsAmbientMuted(true);
                  } else {
                    await audioManagerForAmbient.playAmbientLoopGracefully(400);
                    contentState.setIsAmbientMuted(false);
                  }
                  renderOverlay();
                }
              : undefined
          }
        />
      );
    }
  }
};

/**
 * Handle translate to English request
 * Translates summary and prompts to English
 */
const handleTranslateToEnglish = async () => {
  if (
    !contentState.getLanguageDetection() ||
    !contentState.getExtractedContent()
  ) {
    return;
  }

  console.log('Translating to English...');

  try {
    // Translate summary
    const translatedSummary: string[] = [];
    let translatedCount = 0;
    let failedCount = 0;

    for (const bullet of contentState.getSummary()) {
      const translateResponse = await sendMessageToBackground<string>({
        type: 'translate',
        payload: {
          text: bullet,
          source: contentState.getLanguageDetection()?.detectedLanguage ?? 'en',
          target: 'en',
        },
      });

      if (translateResponse.success) {
        translatedSummary.push(translateResponse.data);
        translatedCount += 1;
      } else {
        console.error('Translation failed:', translateResponse.error);
        translatedSummary.push(bullet); // Keep original on error
        failedCount += 1;
      }
    }

    contentState.setSummary(translatedSummary);

    if (translatedCount === 0) {
      showNotification(
        'Translation Failed',
        'Could not translate content to English',
        'error'
      );
      return;
    }

    if (failedCount === 0) {
      // Update language detection to English
      contentState.setLanguageDetection({
        detectedLanguage: 'en',
        confidence: 1.0,
        languageName: getLanguageName('en'),
      });
      contentState.setSelectedTargetLanguage('en');
      contentState.setIsTargetLanguageOverridden(
        contentState.getPreferredLanguageBaseline() !== null
          ? 'en' !== contentState.getPreferredLanguageBaseline()
          : true
      );
    }

    // Re-render overlay with translated content
    const overlayInfoFinal = uiManager.getOverlayRoot();
    if (overlayInfoFinal) {
      const soundEnabled = Boolean(
        instanceManager.getSettings()?.enableSound &&
          instanceManager.getAudioManager()
      );
      const badgeLanguageDetection =
        contentState.getOriginalContentLanguage() ?? undefined;
      const summaryLanguageDetection =
        contentState.getLanguageDetection() ??
        contentState.getOriginalContentLanguage() ??
        undefined;
      overlayInfoFinal.root.render(
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
          onProofread={handleProofread}
          onFormatChange={handleFormatChange}
          currentFormat={contentState.getSummaryFormat()}
          isLoadingSummary={false}
          languageDetection={badgeLanguageDetection}
          summaryLanguageDetection={summaryLanguageDetection}
          onTranslateToEnglish={handleTranslateToEnglish}
          onTranslate={handleTranslate}
          isTranslating={contentState.getIsTranslating()}
          onRewrite={handleRewrite}
          isRewriting={contentState.getReflectionState().isRewriting}
          proofreaderAvailable={
            contentState.getAICapabilities()?.proofreader ?? false
          }
          ambientMuted={
            soundEnabled ? contentState.getIsAmbientMuted() : undefined
          }
          onToggleAmbient={
            soundEnabled
              ? async (mute) => {
                  const audioManagerForAmbient =
                    instanceManager.getAudioManager();
                  if (!audioManagerForAmbient) return;
                  if (mute) {
                    await audioManagerForAmbient.stopAmbientLoopGracefully(400);
                    contentState.setIsAmbientMuted(true);
                  } else {
                    await audioManagerForAmbient.playAmbientLoopGracefully(400);
                    contentState.setIsAmbientMuted(false);
                  }
                  renderOverlay();
                }
              : undefined
          }
        />
      );
    }

    if (failedCount === 0) {
      showNotification(
        'Translation Complete',
        'Content translated to English',
        'info'
      );
    } else {
      showNotification(
        'Translation Partially Complete',
        'Some items could not be translated to English',
        'warning'
      );
    }
  } catch (error) {
    console.error('Error translating to English:', error);
    showNotification(
      'Translation Failed',
      'Could not translate content to English',
      'error'
    );
  }
};

/**
 * Handle rewrite request
 * Rewrites text with selected tone preset
 */
const handleRewrite = async (
  text: string,
  tone: TonePreset,
  index: number
): Promise<{ original: string; rewritten: string }> => {
  console.log(`Rewriting reflection ${index} with tone: ${tone}...`);

  contentState.setIsRewriting(index, true);

  try {
    // Build context from summary and reflection prompt
    const contextParts: string[] = [];

    const summary = contentState.getSummary();
    if (summary?.length > 0) {
      contextParts.push(`Summary: ${summary.join(' ')}`);
    }

    const prompts = contentState.getPrompts();
    if (prompts?.[index]) {
      contextParts.push(`Reflection prompt: ${prompts[index]}`);
    }

    const context =
      contextParts.length > 0 ? contextParts.join('\n\n') : undefined;

    const rewriteResponse = await sendMessageToBackground<{
      original: string;
      rewritten: string;
    }>({
      type: 'rewrite',
      payload: {
        text,
        tone,
        context,
      },
    });

    if (rewriteResponse.success) {
      console.log('Rewrite completed');
      const { original, rewritten: rw } = rewriteResponse.data;
      let rewritten = rw;

      // Ensure output language matches selected target language, if any
      const targetLang = contentState.getSelectedTargetLanguage();
      if (targetLang) {
        try {
          // Detect language of rewritten text to avoid unnecessary translation
          const detect = await sendMessageToBackground<LanguageDetection>({
            type: 'detectLanguage',
            payload: {
              text: rewritten.substring(0, 500),
              pageUrl: contentState.getExtractedContent()?.url ?? location.href,
            },
          });
          const sourceLang = detect.success
            ? detect.data.detectedLanguage
            : (contentState.getOriginalDetectedLanguage() ?? 'en');
          if (sourceLang !== targetLang) {
            const tr = await sendMessageToBackground<string>({
              type: 'translate',
              payload: {
                text: rewritten,
                source: sourceLang,
                target: targetLang,
              },
            });
            if (tr.success) rewritten = tr.data;
          }
        } catch (e) {
          console.warn('Rewrite translation skipped due to error:', e);
        }
      }

      return { original, rewritten };
    } else {
      console.error('Rewrite failed:', rewriteResponse.error);
      throw new Error(rewriteResponse.error);
    }
  } catch (error) {
    console.error('Error rewriting:', error);
    throw error;
  } finally {
    contentState.setIsRewriting(index, false);
  }
};

/**
 * Handle summary format change
 * Re-requests summary with new format from background worker
 */
const handleFormatChange = async (format: SummaryFormat) => {
  if (
    !contentState.getExtractedContent() ||
    contentState.getIsLoadingSummary()
  ) {
    return;
  }

  console.log(`Changing summary format to: ${format}`);
  contentState.setSummaryFormat(format);
  contentState.setIsLoadingSummary(true);

  // Re-render overlay with loading state
  const overlayStateFormat = contentState.getOverlayState();
  if (overlayStateFormat.root && overlayStateFormat.container) {
    const settingsForFormat = instanceManager.getSettings();
    const audioManagerForFormat = instanceManager.getAudioManager();
    const soundEnabled = Boolean(
      settingsForFormat?.enableSound && audioManagerForFormat
    );
    const translationEnabled = Boolean(settingsForFormat?.enableTranslation);
    overlayStateFormat.root.render(
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
        onFormatChange={handleFormatChange}
        currentFormat={contentState.getSummaryFormat()}
        isLoadingSummary={true}
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
        onToggleAmbient={
          soundEnabled
            ? async (mute) => {
                const audioManagerForFormatToggle =
                  instanceManager.getAudioManager();
                if (!audioManagerForFormatToggle) return;
                if (mute) {
                  await audioManagerForFormatToggle.stopAmbientLoopGracefully(
                    400
                  );
                  contentState.setIsAmbientMuted(true);
                } else {
                  await audioManagerForFormatToggle.playAmbientLoopGracefully(
                    400
                  );
                  contentState.setIsAmbientMuted(false);
                }
                renderOverlay();
              }
            : undefined
        }
      />
    );
  }

  try {
    // Request new summary with selected format
    // Pass detected language to maintain source language when translation is disabled
    const summaryResponse = await sendMessageToBackground<string[]>({
      type: 'summarize',
      payload: {
        content: contentState.getExtractedContent()?.text ?? '',
        format: format,
        detectedLanguage: contentState.getLanguageDetection()?.detectedLanguage,
      },
    });

    if (summaryResponse.success) {
      let newSummary = summaryResponse.data;
      // If the user selected a target language, translate the freshly
      // generated summary to that language.
      if (contentState.getSelectedTargetLanguage()) {
        const translated: string[] = [];
        for (const item of newSummary) {
          const tr = await sendMessageToBackground<string>({
            type: 'translate',
            payload: {
              text: item,
              source: contentState.getOriginalDetectedLanguage() ?? 'en',
              target: contentState.getSelectedTargetLanguage() ?? 'en',
            },
          });
          translated.push(tr.success ? tr.data : item);
        }
        newSummary = translated;
      }
      contentState.setSummary(newSummary);
      contentState.setSummaryDisplay(newSummary);
      stopSummaryAnimation();
      contentState.setSummaryStreamComplete(true);
      console.log(
        'Summary updated with new format:',
        contentState.getSummary()
      );
    } else {
      console.error('Failed to update summary format:', summaryResponse.error);
      // Keep existing summary on error
      showNotification(
        'Format Change Failed',
        'Could not update summary format. Using previous format.',
        'error'
      );
    }
  } catch (error) {
    console.error('Error changing format:', error);
    showNotification(
      'Format Change Failed',
      'An error occurred while changing format.',
      'error'
    );
  } finally {
    contentState.setIsLoadingSummary(false);

    // Re-render overlay with updated summary
    const overlayInfoFinal = uiManager.getOverlayRoot();
    if (overlayInfoFinal) {
      const settingsForOverlay = instanceManager.getSettings();
      const audioManagerForOverlay = instanceManager.getAudioManager();
      const soundEnabled = Boolean(
        settingsForOverlay?.enableSound && audioManagerForOverlay
      );
      const translationEnabled = Boolean(settingsForOverlay?.enableTranslation);
      overlayInfoFinal.root.render(
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
          onFormatChange={handleFormatChange}
          currentFormat={contentState.getSummaryFormat()}
          isLoadingSummary={false}
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
          onToggleAmbient={
            soundEnabled
              ? async (mute) => {
                  const audioManagerForAmbient =
                    instanceManager.getAudioManager();
                  if (!audioManagerForAmbient) return;
                  if (mute) {
                    await audioManagerForAmbient.stopAmbientLoopGracefully(400);
                    contentState.setIsAmbientMuted(true);
                  } else {
                    await audioManagerForAmbient.playAmbientLoopGracefully(400);
                    contentState.setIsAmbientMuted(false);
                  }
                  renderOverlay();
                }
              : undefined
          }
        />
      );
    }
  }
};

/**
 * Hide the Reflect Mode overlay
 * Removes the component and cleans up the DOM
 */
const hideReflectModeOverlay = () => {
  // Stop ambient audio if playing
  instanceManager.stopAudioManager();

  // Stop frame rate monitoring if active
  performanceMonitor.stopFrameRateMonitoring();

  uiManager.hideOverlay();
};

/**
 * Reset reflection state after save or cancel
 * Clears current data and resets dwell tracker
 */
const resetReflectionState = () => {
  contentState.getActiveSummaryStreamCleanup()?.();
  contentState.setActiveSummaryStreamCleanup(null);
  contentState.resetReflectionState();
  contentState.setSummaryAnimationIndex(0);
  contentState.setSummaryStreamComplete(false);
  stopSummaryAnimation();
  contentState.setOriginalContentLanguage(null);
  // Reset dwell tracker to start tracking again
  instanceManager.resetDwellTracker();

  console.log('Reflection state reset');
};

/**
 * Initialize the content script
 * Sets up dwell tracking and prepares for UI injection
 */
const initializeContentScript = async () => {
  console.log('Content script ready');

  try {
    // Load settings from background worker
    const settings = await getSettings();
    instanceManager.setSettings(settings);
    applyTranslationPreference(settings);

    // Initialize dwell tracker with threshold from settings
    instanceManager.initializeDwellTracker(settings.dwellThreshold, () => {
      handleDwellThresholdReached();
    });

    // Listen for page navigation to reset tracker
    setupNavigationListeners();

    // Set up message listener for background worker responses
    setupMessageListener();

    console.log(
      `Dwell tracking started with threshold: ${settings.dwellThreshold}s`
    );
  } catch (error) {
    console.error('Failed to initialize content script:', error);
  }
};

/**
 * Get settings from background worker
 * @returns Settings object
 */
const getSettings = async (): Promise<Settings> => {
  const message: Message = {
    type: 'getSettings',
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const response = await chrome.runtime.sendMessage(message);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (response.success) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return response.data as Settings;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.error('Failed to load settings:', response.error);
    // Return default settings as fallback
    return {
      dwellThreshold: 30,
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
      enableTranslation: false,
      preferredTranslationLanguage: 'en',
      experimentalMode: false,
      autoDetectLanguage: true,
    };
  }
};

/**
 * Handle when dwell threshold is reached
 * Shows the lotus nudge icon to invite reflection
 */
const handleDwellThresholdReached = () => {
  console.log('Dwell threshold reached!');
  showLotusNudge();
};

/**
 * Show the lotus nudge icon
 * Creates a shadow DOM container and renders the React component
 */
const showLotusNudge = () => {
  uiManager.showNudge(
    <LotusNudge
      visible={true}
      onClick={handleNudgeClick}
      position="bottom-left"
      quickActionsCount={3}
      onDashboard={() => {
        void showDashboardModal();
      }}
      onHelp={() => {
        void showHelpModal();
      }}
      onSettings={() => {
        void showSettingsModal();
      }}
      onAnimationComplete={() => {
        console.log('Lotus nudge fade-in animation completed');
      }}
    />,
    LOTUS_NUDGE_STYLES
  );
};

/**
 * Handle click on lotus nudge icon
 * Initiates the complete reflection flow
 */
const handleNudgeClick = async () => {
  console.log('Lotus nudge clicked - initiating reflection');

  // Prevent multiple clicks while loading
  if (contentState.getNudgeState().isLoading) {
    console.log('Already processing, ignoring click');
    return;
  }

  // Start the reflection flow (loading state managed inside)
  await initiateReflectionFlow();

  // Hide the nudge after processing completes
  hideLotusNudge();
};

/**
 * Hide the lotus nudge icon
 * Removes the component and cleans up the DOM
 */
const hideLotusNudge = () => {
  uiManager.hideNudge();
};

/** Show AI Status modal in the center of the page */
const showHelpModal = async () => {
  const { AIStatusModal } = await import('./components/AIStatusModal');
  uiManager.showHelpModal(<AIStatusModal onClose={hideHelpModal} />);
};

/** Hide AI Status modal */
const hideHelpModal = () => {
  uiManager.hideHelpModal();
};

/**
 * Show Quick Settings modal in the center of the page
 */
const showSettingsModal = async () => {
  const { QuickSettingsModal } = await import(
    './components/QuickSettingsModal'
  );
  uiManager.showSettingsModal(
    <QuickSettingsModal onClose={hideSettingsModal} />
  );
};

/** Hide Quick Settings modal */
const hideSettingsModal = () => {
  uiManager.hideSettingsModal();
};

/**
 * Set up message listener for background worker responses
 * Handles any messages sent from the background worker
 */
const setupMessageListener = () => {
  chrome.runtime.onMessage.addListener(
    (message: unknown, _sender, sendResponse) => {
      try {
        if (message && typeof message === 'object' && 'type' in message) {
          const { type } = message as { type: string };
          if (type === 'settingsUpdated') {
            const updated = (message as { data?: unknown }).data as
              | Settings
              | undefined;
            if (updated) {
              console.log('Applying live settings update:', updated);
              applyTranslationPreference(updated);
              // Toast for user feedback
              try {
                showNotification('Settings updated', '', 'info');
              } catch {
                // no-op
              }
              // Live-update audio behavior for overlay
              const audioManagerForSettings = instanceManager.getAudioManager();
              if (
                contentState.getOverlayState().isVisible &&
                audioManagerForSettings
              ) {
                if (updated.enableSound) {
                  void audioManagerForSettings.playAmbientLoopGracefully(300);
                } else {
                  void audioManagerForSettings.stopAmbientLoopGracefully(300);
                }
              }

              // If overlay is mounted, re-render via unified renderer to reflect toggles consistently
              const overlayStateMessage = contentState.getOverlayState();
              if (
                overlayStateMessage.isVisible &&
                overlayStateMessage.root &&
                overlayStateMessage.container
              ) {
                renderOverlay();
              }
            }
          } else if (type === 'openDashboard') {
            void showDashboardModal();
            sendResponse({ success: true });
            return true;
          } else if (type === 'startReflection') {
            // Mirror lotus click behavior
            void (async () => {
              try {
                await initiateReflectionFlow();
                sendResponse({ success: true });
              } catch {
                sendResponse({ success: false });
              }
            })();
            return true;
          }
        }
      } catch (e) {
        console.warn('Error handling incoming message in content script:', e);
      }

      sendResponse({ success: true });
      return true;
    }
  );
};

/**
 * Set up listeners for page navigation
 * Resets the dwell tracker when navigating to a new page
 */
const setupNavigationListeners = () => {
  // Listen for popstate events (back/forward navigation)
  window.addEventListener('popstate', () => {
    instanceManager.resetDwellTracker();
    console.log('Dwell tracker reset due to navigation');
  });

  // Listen for pushState/replaceState (SPA navigation)
  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = function (...args) {
    originalPushState(...args);
    instanceManager.resetDwellTracker();
    console.log('Dwell tracker reset due to pushState');
  };

  history.replaceState = function (...args) {
    originalReplaceState(...args);
    instanceManager.resetDwellTracker();
    console.log('Dwell tracker reset due to replaceState');
  };
};

/**
 * Show error modal with specified configuration
 * @param title Modal title
 * @param message Error message
 * @param type Error type
 * @param onAction Optional action callback
 * @param actionLabel Optional action button label
 */

/**
 * Hide the error modal
 * Removes the component and cleans up the DOM
 */
const hideErrorModal = () => {
  uiManager.hideErrorModal();
};

/**
 * Show error modal - created with hide callback
 */
const showErrorModal = createShowErrorModal(hideErrorModal);

/**
 * Show notification toast
 * @param title Notification title
 * @param message Notification message
 * @param type Notification type
 * @param duration Optional duration in milliseconds
 */

/**
 * Hide the notification toast
 * Removes the component and cleans up the DOM
 */
const hideNotification = () => {
  uiManager.hideNotification();
};

/**
 * Show notification - created with hide callback
 */
const showNotification = createShowNotification(hideNotification);

/**
 * Clean up on page unload
 */
window.addEventListener('beforeunload', () => {
  instanceManager.cleanup();
  uiManager.cleanup();
});

// Initialize the content script
void initializeContentScript();

/** Show Dashboard modal */
async function showDashboardModal() {
  const { DashboardModal } = await import('./components/DashboardModal');
  uiManager.showDashboardModal(<DashboardModal onClose={hideDashboardModal} />);
}

function hideDashboardModal() {
  uiManager.hideDashboardModal();
}
