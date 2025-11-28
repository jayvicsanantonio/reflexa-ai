/**
 * Translation Preferences and Auto-Translate Logic
 * Handles translation preference application and automatic translation during reflection flow
 */

import { contentState } from '../state';
import type { Settings } from '../../types';

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
