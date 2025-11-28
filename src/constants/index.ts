/**
 * Constants for Reflexa AI Chrome Extension
 */

import type { Settings } from '../types';

/**
 * Default user settings
 */
export const DEFAULT_SETTINGS: Settings = {
  dwellThreshold: 10, // 10 seconds default
  enableSound: true,
  reduceMotion: false,
  proofreadEnabled: true,
  privacyMode: 'local',
  // New AI API settings
  useNativeSummarizer: false, // Use Summarizer API instead of Prompt API
  useNativeProofreader: false, // Use Proofreader API instead of Prompt API
  translationEnabled: true,
  targetLanguage: 'en',
  // Chrome AI APIs integration settings
  defaultSummaryFormat: 'bullets',
  enableProofreading: true,
  enableTranslation: true,
  preferredTranslationLanguage: 'en',
  experimentalMode: true,
  autoDetectLanguage: true,
  // Voice input settings
  voiceInputEnabled: true,
  voiceLanguage: undefined, // Will default to browser language
  voiceAutoStopDelay: 10000, // 10 seconds
};

/**
 * Timing values (in milliseconds unless specified)
 */
export const TIMING = {
  DWELL_MIN: 0, // Minimum dwell threshold in seconds (0 = instant)
  DWELL_MAX: 60, // Maximum dwell threshold in seconds
  DWELL_DEFAULT: 10, // Default dwell threshold in seconds
  AI_TIMEOUT: 4000, // AI request timeout in milliseconds
  OVERLAY_FADE_IN: 1000, // Overlay fade-in duration
  BREATHING_CYCLE: 7000, // Breathing orb animation cycle
  BREATHING_EXPAND: 3500, // Breathing orb expand duration
  BREATHING_CONTRACT: 3500, // Breathing orb contract duration
  OVERLAY_RENDER_TARGET: 300, // Target overlay render time
  SETTINGS_DEBOUNCE: 500, // Settings auto-save debounce
  CACHE_TTL: 300000, // Cache time-to-live (5 minutes)
};

/**
 * Audio settings
 */
export const AUDIO = {
  VOLUME: 0.3, // 30% volume
  ENTRY_CHIME_DURATION: 1000, // Entry chime duration in ms
  AMBIENT_LOOP_DURATION: 8000, // Ambient loop duration in ms
  COMPLETION_BELL_DURATION: 800, // Completion bell duration in ms
  VOICE_STOP_CUE_DURATION: 250, // Voice stop cue duration in ms (< 0.3s per requirements)
};

/**
 * Content extraction limits
 */
export const CONTENT_LIMITS = {
  MAX_TOKENS: 3000, // Maximum tokens for AI processing
  TRUNCATE_TOKENS: 2500, // Truncate to this if exceeds max
  WORDS_PER_TOKEN: 0.75, // Estimation: 1 token ≈ 0.75 words
  MAX_SUMMARY_WORDS: 20, // Maximum words per summary bullet
  MAX_PROMPT_WORDS: 15, // Maximum words per reflection prompt
};

/**
 * Storage keys
 */
const STORAGE_NAMESPACE = 'reflexa:' as const;
export const STORAGE_KEYS = {
  REFLECTIONS: `${STORAGE_NAMESPACE}reflections`,
  SETTINGS: `${STORAGE_NAMESPACE}settings`,
  LAST_SYNC: `${STORAGE_NAMESPACE}lastSync`,
  STREAK: `${STORAGE_NAMESPACE}streak`,
  FIRST_LAUNCH: `${STORAGE_NAMESPACE}firstLaunch`,
};

/**
 * Privacy notice text
 */
export const PRIVACY_NOTICE =
  "Your reflections never leave your device. All AI processing happens locally using Chrome's built-in Gemini Nano.";

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  AI_UNAVAILABLE: 'Local AI disabled — manual reflection available.',
  AI_TIMEOUT:
    'AI taking longer than expected. You can enter your summary manually.',
  CONTENT_TOO_LARGE: 'Long article detected. Summary based on first section.',
  STORAGE_FULL: 'Storage full. Export older reflections to free space.',
  NETWORK_ERROR: 'Network error. Changes will sync when online.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  PROOFREADER_UNAVAILABLE: 'Proofreader API not available.',
  SUMMARIZER_UNAVAILABLE: 'Summarizer API not available.',
  TRANSLATOR_UNAVAILABLE: 'Translator API not available.',
  WRITER_UNAVAILABLE: 'Writer API not available.',
  REWRITER_UNAVAILABLE: 'Rewriter API not available.',
};

/**
 * Supported languages for translation
 * Common languages that users might want to translate to/from
 */
export const COMMON_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
] as const;
