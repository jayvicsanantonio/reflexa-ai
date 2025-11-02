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
import { uiManager } from '../ui';
import type { AICapabilities, LanguageDetection } from '../../types';
import { ERROR_MESSAGES } from '../../constants';

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
    console.log('AI availability:', contentState.getAIAvailable());
    if (!contentState.getAIAvailable()) {
      console.log(
        '💡 To enable AI: Check background service worker logs for instructions'
      );
    }
    return aiCheckResponse.data;
  } else {
    contentState.setAIAvailable(false);
    console.error('AI check failed:', aiCheckResponse.error);
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
    console.error('Failed to get capabilities:', capabilitiesResponse.error);
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
      console.error('Content extraction succeeded but content is null');
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
        console.log(
          `Language detected: ${detection.languageName} (${detection.detectedLanguage})`
        );
      }
    } else {
      console.warn('Language detection failed:', languageResponse.error);
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
      console.log('Auto-translating content...');
      // Auto-translate logic will be handled in overlay workflow
    }

    // Start summarization with streaming
    console.log('Starting summarization...');
    setNudgeLoadingState(false); // Hide nudge, overlay handles loading state

    // Summarization will be handled by overlay workflow's streaming logic
  } catch (error) {
    console.error('Error in reflection flow:', error);
    setNudgeLoadingState(false);
    getShowErrorModal()(
      'Reflection Flow Error',
      error instanceof Error ? error.message : 'An unexpected error occurred',
      'ai-unavailable'
    );
  }
}
