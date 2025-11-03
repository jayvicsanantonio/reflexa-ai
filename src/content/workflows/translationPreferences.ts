/**
 * Translation Preferences and Auto-Translate Logic
 * Handles translation preference application and automatic translation during reflection flow
 */

import { contentState } from '../state';
import { instanceManager } from '../core';
import { sendMessageToBackground } from '../runtime/messageBus';
import type { Settings, LanguageDetection } from '../../types';
import { getLanguageName } from '../../utils/translationHelpers';
import { devLog, devError } from '../../utils/logger';

/**
 * Apply translation preference based on settings
 * Updates the session target language based on current settings.
 * Defaults to the preferred translation language when translation
 * features are enabled. Clears the override when translation is off.
 */
export function applyTranslationPreference(
  settings: Settings | null | undefined
): void {
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
}

/**
 * Determine if content should be auto-translated
 * Checks translation settings, language detection confidence, and user preferences
 */
export function shouldAutoTranslate(
  detection: LanguageDetection,
  settings: Settings | null
): boolean {
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
}

/**
 * Auto-translate content during breathing phase
 * Translates summary to target language with caching support
 * Note: This requires stopSummaryAnimation and renderOverlay callbacks for UI updates
 */
export async function handleAutoTranslate(
  detection: LanguageDetection,
  stopSummaryAnimation: () => void,
  renderOverlay: () => void
): Promise<void> {
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
        devLog('Using cached translation');
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
        renderOverlay();
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
        devError('Translation failed:', response.error);
        translatedSummary.push(bullet); // Keep original on error
      }
    }

    // Update state with translated summary
    contentState.setSummary(translatedSummary);
    contentState.setSummaryDisplay(translatedSummary);
    stopSummaryAnimation();
    contentState.setSummaryStreamComplete(true);

    // Update language detection
    if (successCount > 0) {
      contentState.setSelectedTargetLanguage(targetLang);
      contentState.setLanguageDetection({
        detectedLanguage: targetLang,
        confidence: 1,
        languageName: getLanguageName(targetLang),
      });
    }

    // Cache the translation
    if (extractedContent?.url && successCount === translatedSummary.length) {
      await chrome.storage.local.set({
        [cacheKey]: {
          summary: translatedSummary,
          timestamp: Date.now(),
        },
      });
    }

    // Re-render overlay with translated content
    renderOverlay();
  } catch (error) {
    devError('Error during auto-translate:', error);
    // Continue with original summary on error
  }
}
