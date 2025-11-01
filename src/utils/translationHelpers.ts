/**
 * Translation Helper Utilities
 * Provides smart translation logic and user experience enhancements
 */

import type { LanguageDetection, Settings } from '../types';

/**
 * Determine if translation should be offered to the user
 */
export function shouldOfferTranslation(
  detection: LanguageDetection,
  settings: Settings,
  userLanguage: string = navigator.language.split('-')[0]
): boolean {
  // Translation must be enabled
  if (!settings.enableTranslation && !settings.translationEnabled) {
    return false;
  }

  // Don't offer if already in user's language
  if (detection.detectedLanguage === userLanguage) {
    return false;
  }

  // Don't offer if already in preferred translation language
  if (detection.detectedLanguage === settings.preferredTranslationLanguage) {
    return false;
  }

  // Only offer if confidence is high enough
  const minConfidence = settings.experimentalMode ? 0.6 : 0.8;
  if (detection.confidence < minConfidence) {
    return false;
  }

  return true;
}

/**
 * Get user's native language from browser settings
 */
export function getUserNativeLanguage(): string {
  // Try to get from navigator.languages (preferred languages list)
  if (navigator.languages && navigator.languages.length > 0) {
    return navigator.languages[0].split('-')[0];
  }

  // Fallback to navigator.language
  return navigator.language.split('-')[0];
}

/**
 * Check if content appears to be in multiple languages
 */
export function hasMixedLanguages(
  text: string,
  primaryLanguage: string
): boolean {
  // Simple heuristic: check for common words in other languages
  const languagePatterns: Record<string, RegExp[]> = {
    en: [/\b(the|and|is|are|was|were|have|has|had)\b/gi],
    es: [/\b(el|la|los|las|de|que|es|son|está|están)\b/gi],
    fr: [/\b(le|la|les|de|que|est|sont|était|étaient)\b/gi],
    de: [/\b(der|die|das|und|ist|sind|war|waren)\b/gi],
    it: [/\b(il|la|i|le|di|che|è|sono|era|erano)\b/gi],
    pt: [/\b(o|a|os|as|de|que|é|são|era|eram)\b/gi],
  };

  let matchCount = 0;
  let totalPatterns = 0;

  for (const [lang, patterns] of Object.entries(languagePatterns)) {
    if (lang === primaryLanguage) continue;

    for (const pattern of patterns) {
      totalPatterns++;
      const matches = text.match(pattern);
      if (matches && matches.length > 5) {
        matchCount++;
      }
    }
  }

  // If more than 30% of patterns match, likely mixed languages
  return matchCount / totalPatterns > 0.3;
}

/**
 * Get language name from ISO code
 */
export function getLanguageName(code: string): string {
  const languageNames: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    ar: 'Arabic',
    ru: 'Russian',
    hi: 'Hindi',
    nl: 'Dutch',
    sv: 'Swedish',
    pl: 'Polish',
    tr: 'Turkish',
    vi: 'Vietnamese',
    th: 'Thai',
    id: 'Indonesian',
    cs: 'Czech',
    ro: 'Romanian',
    el: 'Greek',
    he: 'Hebrew',
    da: 'Danish',
    fi: 'Finnish',
    no: 'Norwegian',
    uk: 'Ukrainian',
  };

  return languageNames[code] || code.toUpperCase();
}

/**
 * Get flag emoji for language code
 */
export function getLanguageFlag(code: string): string {
  const flags: Record<string, string> = {
    en: '🇬🇧',
    es: '🇪🇸',
    fr: '🇫🇷',
    de: '🇩🇪',
    it: '🇮🇹',
    pt: '🇵🇹',
    zh: '🇨🇳',
    ja: '🇯🇵',
    ko: '🇰🇷',
    ar: '🇸🇦',
    ru: '🇷🇺',
    hi: '🇮🇳',
    nl: '🇳🇱',
    sv: '🇸🇪',
    pl: '🇵🇱',
    tr: '🇹🇷',
    vi: '🇻🇳',
    th: '🇹🇭',
    id: '🇮🇩',
    cs: '🇨🇿',
    ro: '🇷🇴',
    el: '🇬🇷',
    he: '🇮🇱',
    da: '🇩🇰',
    fi: '🇫🇮',
    no: '🇳🇴',
    uk: '🇺🇦',
  };

  return flags[code] || '🌐';
}

/**
 * Format translation cache key
 */
export function getTranslationCacheKey(
  pageUrl: string,
  sourceLanguage: string,
  targetLanguage: string
): string {
  return `translation:${pageUrl}:${sourceLanguage}:${targetLanguage}`;
}

/**
 * Check if translation is cached and still valid
 */
export async function getCachedTranslation(
  pageUrl: string,
  sourceLanguage: string,
  targetLanguage: string,
  maxAge: number = 24 * 60 * 60 * 1000 // 24 hours
): Promise<string[] | null> {
  try {
    const key = getTranslationCacheKey(pageUrl, sourceLanguage, targetLanguage);
    const result = await chrome.storage.local.get(key);

    if (!result[key]) return null;

    const cached = result[key] as {
      summary: string[];
      timestamp: number;
    };

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > maxAge) {
      // Cache expired, remove it
      await chrome.storage.local.remove(key);
      return null;
    }

    return cached.summary;
  } catch (error) {
    console.error('Error getting cached translation:', error);
    return null;
  }
}

/**
 * Cache translation for future use
 */
export async function cacheTranslation(
  pageUrl: string,
  sourceLanguage: string,
  targetLanguage: string,
  summary: string[]
): Promise<void> {
  try {
    const key = getTranslationCacheKey(pageUrl, sourceLanguage, targetLanguage);
    await chrome.storage.local.set({
      [key]: {
        summary,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error('Error caching translation:', error);
  }
}

/**
 * Estimate translation time based on content length
 */
export function estimateTranslationTime(textLength: number): number {
  // Rough estimate: 100 characters per second
  const seconds = Math.ceil(textLength / 100);
  return Math.max(1, Math.min(seconds, 10)); // Between 1-10 seconds
}

/**
 * Split long text into chunks for translation
 */
export function chunkTextForTranslation(
  text: string,
  maxChunkSize = 1000
): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];

  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length <= maxChunkSize) {
      currentChunk += sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim());

  return chunks;
}

/**
 * Detect if user is likely a language learner
 */
export function isLikelyLanguageLearner(
  detectedLanguage: string,
  userLanguage: string,
  translationHistory: { source: string; target: string }[]
): boolean {
  // Check if user frequently translates from the same language
  const sameSourceCount = translationHistory.filter(
    (t) => t.source === detectedLanguage
  ).length;

  // Check if user translates to their native language
  const toNativeCount = translationHistory.filter(
    (t) => t.target === userLanguage
  ).length;

  // If >70% of translations are from same source to native, likely learning
  return (
    translationHistory.length > 5 &&
    sameSourceCount / translationHistory.length > 0.7 &&
    toNativeCount / translationHistory.length > 0.7
  );
}

/**
 * Get suggested target languages based on user's history
 */
export function getSuggestedTargetLanguages(
  translationHistory: { source: string; target: string }[],
  maxSuggestions = 3
): string[] {
  const targetCounts: Record<string, number> = {};

  for (const { target } of translationHistory) {
    targetCounts[target] = (targetCounts[target] || 0) + 1;
  }

  return Object.entries(targetCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxSuggestions)
    .map(([lang]) => lang);
}
