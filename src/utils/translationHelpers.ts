/**
 * Translation Helper Utilities
 * Provides smart translation logic and user experience enhancements
 */

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
