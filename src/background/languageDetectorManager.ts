/**
 * Language Detector Manager for Chrome Built-in Language Detector API
 * Handles automatic language detection with caching and ISO 639-1 code mapping
 * Implements per-page caching to avoid redundant detection calls
 */

import type { LanguageDetection } from '../types';
import type {
  AILanguageDetector,
  LanguageDetectionResult,
} from '../types/chrome-ai';
import { capabilityDetector } from './capabilityDetector';

/**
 * Maximum characters to use for language detection (for speed)
 */
const DETECTION_SAMPLE_LENGTH = 500;

/**
 * ISO 639-1 language code to human-readable name mapping
 */
const LANGUAGE_NAMES: Record<string, string> = {
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
  bg: 'Bulgarian',
  hr: 'Croatian',
  sk: 'Slovak',
  lt: 'Lithuanian',
  sl: 'Slovenian',
  et: 'Estonian',
  lv: 'Latvian',
  fa: 'Persian',
  bn: 'Bengali',
  ta: 'Tamil',
  te: 'Telugu',
  mr: 'Marathi',
  ur: 'Urdu',
  ms: 'Malay',
  sw: 'Swahili',
  af: 'Afrikaans',
  sq: 'Albanian',
  am: 'Amharic',
  hy: 'Armenian',
  az: 'Azerbaijani',
  eu: 'Basque',
  be: 'Belarusian',
  bs: 'Bosnian',
  ca: 'Catalan',
  ceb: 'Cebuano',
  ny: 'Chichewa',
  co: 'Corsican',
  eo: 'Esperanto',
  tl: 'Filipino',
  fy: 'Frisian',
  gl: 'Galician',
  ka: 'Georgian',
  gu: 'Gujarati',
  ht: 'Haitian Creole',
  ha: 'Hausa',
  haw: 'Hawaiian',
  hmn: 'Hmong',
  hu: 'Hungarian',
  is: 'Icelandic',
  ig: 'Igbo',
  ga: 'Irish',
  jw: 'Javanese',
  kn: 'Kannada',
  kk: 'Kazakh',
  km: 'Khmer',
  ku: 'Kurdish',
  ky: 'Kyrgyz',
  lo: 'Lao',
  la: 'Latin',
  lb: 'Luxembourgish',
  mk: 'Macedonian',
  mg: 'Malagasy',
  ml: 'Malayalam',
  mt: 'Maltese',
  mi: 'Maori',
  mn: 'Mongolian',
  my: 'Myanmar (Burmese)',
  ne: 'Nepali',
  ps: 'Pashto',
  pa: 'Punjabi',
  sm: 'Samoan',
  gd: 'Scots Gaelic',
  sr: 'Serbian',
  st: 'Sesotho',
  sn: 'Shona',
  sd: 'Sindhi',
  si: 'Sinhala',
  so: 'Somali',
  su: 'Sundanese',
  tg: 'Tajik',
  tt: 'Tatar',
  tk: 'Turkmen',
  ug: 'Uyghur',
  uz: 'Uzbek',
  cy: 'Welsh',
  xh: 'Xhosa',
  yi: 'Yiddish',
  yo: 'Yoruba',
  zu: 'Zulu',
};

/**
 * Cache entry for language detection results
 */
interface DetectionCacheEntry {
  result: LanguageDetection;
  timestamp: number;
}

/**
 * LanguageDetectorManager class
 * Manages Chrome Language Detector API with per-page caching
 */
export class LanguageDetectorManager {
  private available = false;
  private detector: AILanguageDetector | null = null;
  private cache = new Map<string, DetectionCacheEntry>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if Language Detector API is available
   * Uses capability detector for consistent availability checking
   * @returns Promise resolving to availability status
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const capabilities = await Promise.resolve(
        capabilityDetector.getCapabilities()
      );
      this.available = Boolean(capabilities.languageDetector);
      return this.available;
    } catch (error) {
      console.error('Error checking Language Detector availability:', error);
      this.available = false;
      return false;
    }
  }

  /**
   * Check if Language Detector API is available (synchronous)
   * @returns True if Language Detector API is available
   */
  isAvailable(): boolean {
    return this.available;
  }

  /**
   * Get or create the language detector instance
   * @returns AILanguageDetector instance or null if unavailable
   */
  private async getDetector(): Promise<AILanguageDetector | null> {
    if (this.detector) {
      return this.detector;
    }

    try {
      // Access ai.languageDetector from globalThis (service worker context)
      if (typeof ai === 'undefined' || !ai?.languageDetector) {
        console.warn('Language Detector API not available');
        return null;
      }

      // Create detector instance
      this.detector = await ai.languageDetector.create();
      console.log('Created language detector instance');

      return this.detector;
    } catch (error) {
      console.error('Error creating language detector:', error);
      return null;
    }
  }

  /**
   * Detect language of text content
   * Uses first 500 characters for speed and implements per-page caching
   * @param text - Text content to analyze
   * @param pageUrl - Optional page URL for caching (defaults to text hash)
   * @returns LanguageDetection object with code, confidence, and name
   * @throws Error if detection fails
   */
  async detect(text: string, pageUrl?: string): Promise<LanguageDetection> {
    // Check availability first
    if (!this.available) {
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        throw new Error('Language Detector API is not available');
      }
    }

    // Generate cache key from page URL or text sample
    const cacheKey = pageUrl ?? this.generateCacheKey(text);

    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      console.log(`Using cached language detection for: ${cacheKey}`);
      return cached;
    }

    // Get detector instance
    const detector = await this.getDetector();
    if (!detector) {
      throw new Error('Failed to create language detector');
    }

    try {
      // Use first 500 characters for speed
      const sample = text.slice(0, DETECTION_SAMPLE_LENGTH);

      // Detect language
      const results: LanguageDetectionResult[] = await detector.detect(sample);

      // Get the most confident result
      if (!results || results.length === 0) {
        throw new Error('No language detection results');
      }

      // Sort by confidence (descending) and take the top result
      const topResult = results.sort((a, b) => b.confidence - a.confidence)[0];

      const detectedLanguage = topResult.detectedLanguage ?? 'unknown';
      const confidence = topResult.confidence ?? 0;

      // Map ISO code to human-readable name
      const languageName = this.getLanguageName(detectedLanguage);

      const result: LanguageDetection = {
        detectedLanguage,
        confidence,
        languageName,
      };

      // Cache the result
      this.cacheResult(cacheKey, result);

      console.log(
        `Detected language: ${languageName} (${detectedLanguage}) with confidence ${confidence.toFixed(2)}`
      );

      return result;
    } catch (error) {
      console.error('Language detection failed:', error);
      throw new Error(
        `Language detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Map ISO 639-1 language code to human-readable name
   * @param code - ISO 639-1 language code
   * @returns Human-readable language name
   */
  private getLanguageName(code: string): string {
    // Normalize code to lowercase
    const normalizedCode = code.toLowerCase();

    // Return mapped name or fallback to code
    return LANGUAGE_NAMES[normalizedCode] ?? code.toUpperCase();
  }

  /**
   * Generate cache key from text content
   * Uses a simple hash of the first 100 characters
   * @param text - Text content
   * @returns Cache key string
   */
  private generateCacheKey(text: string): string {
    const sample = text.slice(0, 100).trim();
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < sample.length; i++) {
      const char = sample.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `text_${hash}`;
  }

  /**
   * Get cached detection result if available and not expired
   * @param key - Cache key
   * @returns Cached LanguageDetection or null if not found/expired
   */
  private getCachedResult(key: string): LanguageDetection | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if cache entry is expired
    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  /**
   * Cache detection result
   * @param key - Cache key
   * @param result - Detection result to cache
   */
  private cacheResult(key: string, result: LanguageDetection): void {
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all cached detection results
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Cleared language detection cache');
  }

  /**
   * Clear cache for specific page URL
   * @param pageUrl - Page URL to clear from cache
   */
  clearCacheForPage(pageUrl: string): void {
    this.cache.delete(pageUrl);
    console.log(`Cleared cache for page: ${pageUrl}`);
  }

  /**
   * Clean up expired cache entries
   */
  cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    if (keysToDelete.length > 0) {
      console.log(`Cleaned up ${keysToDelete.length} expired cache entries`);
    }
  }

  /**
   * Clean up detector instance
   */
  destroy(): void {
    if (this.detector) {
      try {
        this.detector.destroy();
        console.log('Destroyed language detector instance');
      } catch (error) {
        console.error('Error destroying language detector:', error);
      }
      this.detector = null;
    }
    this.clearCache();
  }
}

// Export singleton instance
export const languageDetectorManager = new LanguageDetectorManager();
