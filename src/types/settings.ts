/**
 * Settings-related type definitions
 */

import type { SummaryFormat } from './ai';

/**
 * User settings and preferences
 */
export interface Settings {
  dwellThreshold: number;
  enableSound: boolean;
  reduceMotion: boolean;
  proofreadEnabled: boolean;
  privacyMode: 'local' | 'sync';
  useNativeSummarizer: boolean;
  useNativeProofreader: boolean;
  translationEnabled: boolean;
  targetLanguage: string;
  defaultSummaryFormat: SummaryFormat;
  enableProofreading: boolean;
  enableTranslation: boolean;
  preferredTranslationLanguage: string;
  experimentalMode: boolean;
  autoDetectLanguage: boolean;
  voiceInputEnabled?: boolean;
  voiceLanguage?: string;
  voiceAutoStopDelay?: number;
}
