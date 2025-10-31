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
  proofreadEnabled: false,
  privacyMode: 'local',
  // New AI API settings
  useNativeSummarizer: false, // Use Summarizer API instead of Prompt API
  useNativeProofreader: false, // Use Proofreader API instead of Prompt API
  translationEnabled: true,
  targetLanguage: 'en',
  // Chrome AI APIs integration settings
  defaultSummaryFormat: 'bullets',
  enableProofreading: false,
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
 * Performance targets
 */
export const PERFORMANCE = {
  MAX_MEMORY_MB: 150, // Maximum memory usage in MB
  TARGET_FPS: 60, // Target animation frame rate
  MAX_RENDER_TIME: 300, // Maximum overlay render time in ms
};

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  REFLECTIONS: 'reflections',
  SETTINGS: 'settings',
  LAST_SYNC: 'lastSync',
  STREAK: 'streak',
  FIRST_LAUNCH: 'firstLaunch',
};

/**
 * AI prompts for Gemini Nano
 *
 * These prompts are carefully designed based on learning science research:
 *
 * SUMMARIZE:
 * - Three-bullet format follows cognitive load theory (3-5 items optimal for retention)
 * - "Insight" connects new information to existing knowledge (elaborative encoding)
 * - "Surprise" highlights novel elements that aid memory formation (von Restorff effect)
 * - "Apply" encourages practical application, improving long-term retention (transfer-appropriate processing)
 * - 20-word limit ensures conciseness and forces prioritization of key information
 *
 * REFLECT:
 * - Two questions balance depth with brevity (prevents cognitive overload)
 * - Action-oriented questions promote active learning and application
 * - 15-word limit keeps questions focused and clear
 * - Designed to trigger deeper processing (levels of processing theory)
 *
 * PROOFREAD:
 * - Preserves user's authentic voice (important for personal reflections)
 * - Minimal editing (max 2 per sentence) maintains original meaning
 * - Focuses on clarity over perfection (reduces friction in reflection process)
 */
export const AI_PROMPTS = {
  /**
   * Summarization prompt
   * Generates a three-bullet summary with specific structure:
   * - Insight: Main idea or key takeaway
   * - Surprise: Unexpected or counterintuitive element
   * - Apply: Practical application or action item
   *
   * Placeholder: {content} - The article text to summarize
   */
  SUMMARIZE: `Summarize the following article into exactly 3 concise bullets. Each bullet should be no more than 20 words.

Format your response as:
- Insight: [One key insight from the article]
- Surprise: [One surprising or unexpected element]
- Apply: [One actionable takeaway]

Article content:
{content}`,

  /**
   * Reflection prompt generation
   * Creates two action-oriented questions to deepen understanding.
   * Questions should be:
   * - Thought-provoking and open-ended
   * - Focused on application or deeper analysis
   * - Concise (max 15 words each)
   *
   * Placeholder: {summary} - The three-bullet summary to base questions on
   */
  REFLECT: `Based on this article summary, generate exactly 2 thoughtful reflection questions that help the reader think deeper about the content. Each question should be:
- Action-oriented and practical
- No more than 15 words
- Designed to help apply the insights

Summary:
{summary}

Format your response as:
1. [First reflection question]
2. [Second reflection question]`,

  /**
   * Proofreading prompt
   * Improves grammar and clarity while preserving the user's voice.
   * Guidelines:
   * - Maximum 2 edits per sentence (minimal intervention)
   * - Preserve original tone and style
   * - Focus on clarity and correctness, not perfection
   *
   * Placeholder: {text} - The user's reflection text to proofread
   */
  PROOFREAD: `Proofread the following text for grammar and clarity. Preserve the original tone and voice. Make no more than 2 edits per sentence. Only fix clear errors or improve clarity.

Original text:
{text}

Provide only the corrected version without explanations.`,
};

/**
 * UI constants
 */
export const UI = {
  NUDGE_Z_INDEX: 999999,
  OVERLAY_Z_INDEX: 2147483647, // Maximum z-index
  SHADOW_DOM_ID: 'reflexa-shadow-root',
  NUDGE_ID: 'reflexa-nudge',
  OVERLAY_ID: 'reflexa-overlay',
};

/**
 * Accessibility
 */
export const A11Y = {
  MIN_CONTRAST_RATIO: 4.5, // WCAG AA standard
  FOCUS_OUTLINE_WIDTH: 2, // Focus outline width in pixels
  FOCUS_OUTLINE_OFFSET: 2, // Focus outline offset in pixels
};

/**
 * Export formats
 */
export const EXPORT_FORMATS = {
  JSON: 'json',
  MARKDOWN: 'markdown',
} as const;

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
