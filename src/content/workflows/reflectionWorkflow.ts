/**
 * Reflection Workflow
 * Handles the complete reflection flow from initiation to overlay display
 */

import { contentState } from '../state';
import { instanceManager } from '../core';
import { sendMessageToBackground } from '../runtime/messageBus';
import { setNudgeLoadingState, createShowErrorModal } from '../ui';
import { showReflectModeOverlay } from './overlayWorkflow';
import { extractAndStoreContent } from './contentExtraction';
import { applyTranslationPreference } from './translationPreferences';
import { summarizeWithStreaming } from './summarizationStreaming';
import { uiManager } from '../ui';
import type {
  AICapabilities,
  LanguageDetection,
  SummaryFormat,
} from '../../types';
import { ERROR_MESSAGES } from '../../constants';
import { devLog, devWarn, devError } from '../../utils/logger';

// Create error modal helper - this will be passed from index.tsx
let showErrorModal: ReturnType<typeof createShowErrorModal> | null = null;

export function setErrorModalHandler(
  handler: ReturnType<typeof createShowErrorModal>
): void {
  showErrorModal = handler;
}

function getShowErrorModal() {
  showErrorModal ??= createShowErrorModal(() => {
    uiManager.hideErrorModal();
  });
  return showErrorModal;
}

// Store renderOverlay function for summarization
let renderOverlayFn: (() => void) | null = null;

export function setRenderOverlayForReflection(handler: () => void): void {
  renderOverlayFn = handler;
}

/**
 * Check AI availability and update state
 */
async function checkAIAvailability(): Promise<boolean> {
  if (contentState.getAIAvailable() !== null) {
    return contentState.getAIAvailable() ?? false;
  }

  const aiCheckResponse = await sendMessageToBackground<boolean>({
    type: 'checkAI',
  });

  if (aiCheckResponse.success) {
    contentState.setAIAvailable(aiCheckResponse.data);
    devLog('AI availability:', contentState.getAIAvailable());
    if (!contentState.getAIAvailable()) {
      devLog(
        '💡 To enable AI: Check background service worker logs for instructions'
      );
    }
    return aiCheckResponse.data;
  } else {
    contentState.setAIAvailable(false);
    devError('AI check failed:', aiCheckResponse.error);
    return false;
  }
}

/**
 * Get AI capabilities and update state
 */
async function getAICapabilities(): Promise<AICapabilities | null> {
  if (contentState.getAICapabilities() !== null) {
    return contentState.getAICapabilities();
  }

  const capabilitiesResponse = await sendMessageToBackground<AICapabilities>({
    type: 'getCapabilities',
  });

  if (capabilitiesResponse.success) {
    contentState.setAICapabilities(capabilitiesResponse.data);
    console.log('AI capabilities:', contentState.getAICapabilities());
    return capabilitiesResponse.data;
  } else {
    devError('Failed to get capabilities:', capabilitiesResponse.error);
    return null;
  }
}

// applyTranslationPreference is now imported from './translationPreferences'

/**
 * Initiate the complete reflection flow
 * Extracts content, requests AI processing, and shows overlay
 */
export async function initiateReflectionFlow(): Promise<void> {
  try {
    console.log('Starting reflection flow...');

    const settingsForReflection = instanceManager.getSettings();
    applyTranslationPreference(settingsForReflection);

    // Show loading state
    setNudgeLoadingState(true);

    // Check AI availability first if not already checked
    const aiAvailable = await checkAIAvailability();

    // Get AI capabilities
    await getAICapabilities();

    // Extract and validate content from the page
    const extractionSuccess = extractAndStoreContent();

    if (!extractionSuccess) {
      setNudgeLoadingState(false);
      getShowErrorModal()(
        'Content Extraction Failed',
        'Unable to extract content from this page. Please try a different page.',
        'content-truncated'
      );
      return;
    }

    // Get extracted content (should exist after successful extraction)
    const extractedContentInitial = contentState.getExtractedContent();
    if (!extractedContentInitial) {
      devError('Content extraction succeeded but content is null');
      setNudgeLoadingState(false);
      getShowErrorModal()(
        'Content Extraction Failed',
        'Unable to extract content from this page. Please try a different page.',
        'content-truncated'
      );
      return;
    }

    // If AI is unavailable, show manual mode option
    if (!aiAvailable) {
      setNudgeLoadingState(false);
      getShowErrorModal()(
        'AI Unavailable',
        ERROR_MESSAGES.AI_UNAVAILABLE,
        'ai-unavailable',
        () => {
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

    // Detect language first - extractedContentInitial is guaranteed non-null here
    const languageResponse = await sendMessageToBackground<LanguageDetection>({
      type: 'detectLanguage',
      payload: {
        text: extractedContentInitial.text.substring(0, 500),
        pageUrl: extractedContentInitial.url,
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
        devLog(
          `Language detected: ${detection.languageName} (${detection.detectedLanguage})`
        );
      }
    } else {
      devWarn('Language detection failed:', languageResponse.error);
      // Default to English if detection fails
      detectedLanguageCode = 'en';
    }

    // Store original detected language for translation context
    if (detectedLanguageCode) {
      contentState.setOriginalDetectedLanguage(detectedLanguageCode);
    }

    // Auto-translate if enabled and language differs from preferred
    const settingsForAutoTranslate = instanceManager.getSettings();
    if (
      settingsForAutoTranslate?.enableTranslation &&
      detectedLanguageCode &&
      contentState.getPreferredLanguageBaseline() &&
      detectedLanguageCode !== contentState.getPreferredLanguageBaseline()
    ) {
      devLog('Auto-translating content...');
      // Auto-translate logic will be handled in overlay workflow
    }

    // Start summarization with streaming
    console.log('Starting summarization...');
    setNudgeLoadingState(false); // Hide nudge, overlay handles loading state

    // Get summary format from settings
    const settingsForSummary = instanceManager.getSettings();
    const summaryFormat: SummaryFormat =
      settingsForSummary?.defaultSummaryFormat ?? 'bullets';

    // Set summary format in state
    contentState.setSummaryFormat(summaryFormat);

    // Handle summarization based on format
    // headline-bullets doesn't support streaming, so use non-streaming API
    if (summaryFormat === 'headline-bullets') {
      // Use non-streaming API for headline-bullets format
      if (renderOverlayFn) {
        void (async () => {
          try {
            const summaryResponse = await sendMessageToBackground<string[]>({
              type: 'summarize',
              payload: {
                content: extractedContentInitial.text,
                format: summaryFormat,
                detectedLanguage: detectedLanguageCode,
              },
            });

            if (summaryResponse.success && summaryResponse.data.length > 0) {
              contentState.setSummary(summaryResponse.data);
              contentState.setSummaryDisplay(summaryResponse.data);
              contentState.setSummaryStreamComplete(true);
              contentState.setIsLoadingSummary(false);
              renderOverlayFn();
              devLog('Summary generated successfully (non-streaming)');
            } else {
              const errorMessage =
                summaryResponse.success === false
                  ? summaryResponse.error
                  : 'Summary generation failed';
              throw new Error(errorMessage);
            }
          } catch (error) {
            devError('Summarization failed:', error);
            contentState.setIsLoadingSummary(false);
            getShowErrorModal()(
              'Summarization Failed',
              'Unable to generate summary. Please try again.',
              'ai-unavailable'
            );
          }
        })();
      } else {
        devWarn('renderOverlay not set, cannot start summarization');
        contentState.setIsLoadingSummary(false);
      }
    } else {
      // Use streaming API for bullets and paragraph formats
      if (renderOverlayFn) {
        void summarizeWithStreaming(
          extractedContentInitial.text,
          summaryFormat,
          detectedLanguageCode,
          renderOverlayFn
        ).catch((error) => {
          devError('Summarization failed:', error);
          contentState.setIsLoadingSummary(false);
          getShowErrorModal()(
            'Summarization Failed',
            'Unable to generate summary. Please try again.',
            'ai-unavailable'
          );
        });
      } else {
        devWarn('renderOverlay not set, cannot start summarization');
        contentState.setIsLoadingSummary(false);
      }
    }
  } catch (error) {
    devError('Error in reflection flow:', error);
    setNudgeLoadingState(false);
    getShowErrorModal()(
      'Reflection Flow Error',
      error instanceof Error ? error.message : 'An unexpected error occurred',
      'ai-unavailable'
    );
  }
}
