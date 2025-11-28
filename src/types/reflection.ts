/**
 * Reflection-related type definitions
 */

import type { SummaryFormat, TonePreset, TextChange, AIMetadata } from './ai';

/**
 * Voice input metadata for individual reflections
 */
export interface VoiceInputMetadata {
  isVoiceTranscribed: boolean;
  transcriptionLanguage?: string;
  transcriptionTimestamp?: number;
  wordCount?: number;
}

/**
 * Reflection data structure stored for each user reflection session
 */
export interface Reflection {
  id: string;
  url: string;
  title: string;
  createdAt: number;
  summary: string[];
  reflection: string[];
  proofreadVersion?: string;
  tags?: string[];
  embedding?: number[];
  summaryFormat?: SummaryFormat;
  detectedLanguage?: string;
  originalLanguage?: string;
  translatedTo?: string;
  toneUsed?: TonePreset;
  proofreadChanges?: TextChange[];
  aiMetadata?: AIMetadata;
  voiceMetadata?: VoiceInputMetadata[];
}

/**
 * Extracted content from a web page
 */
export interface ExtractedContent {
  title: string;
  text: string;
  url: string;
  wordCount: number;
}

/**
 * Page metadata for tracking and storage
 */
export interface PageMetadata {
  title: string;
  url: string;
  domain: string;
  timestamp: number;
}

/**
 * Calm statistics for dashboard visualization
 */
export interface CalmStats {
  totalReflections: number;
  averagePerDay: number;
  totalReadingTime: number;
  totalReflectionTime: number;
  reflectionRatio: number;
}

/**
 * Streak tracking data
 */
export interface StreakData {
  current: number;
  lastReflectionDate: string;
}
