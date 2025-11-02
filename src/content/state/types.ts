/**
 * Type definitions for content script state management
 */

import type {
  ExtractedContent,
  SummaryFormat,
  LanguageDetection,
  AICapabilities,
} from '../../types';
import type { createRoot } from 'react-dom/client';

/**
 * UI component state - tracks visibility and React roots for each UI component
 */
export interface UIState {
  // Nudge state
  nudge: {
    container: HTMLDivElement | null;
    root: ReturnType<typeof createRoot> | null;
    isVisible: boolean;
    isLoading: boolean;
  };

  // Overlay state
  overlay: {
    container: HTMLDivElement | null;
    root: ReturnType<typeof createRoot> | null;
    isVisible: boolean;
  };

  // Error modal state
  errorModal: {
    container: HTMLDivElement | null;
    root: ReturnType<typeof createRoot> | null;
    isVisible: boolean;
  };

  // Notification state
  notification: {
    container: HTMLDivElement | null;
    root: ReturnType<typeof createRoot> | null;
    isVisible: boolean;
  };

  // Help modal (AI Status) state
  helpModal: {
    container: HTMLDivElement | null;
    root: ReturnType<typeof createRoot> | null;
    isVisible: boolean;
  };

  // Settings modal state
  settingsModal: {
    container: HTMLDivElement | null;
    root: ReturnType<typeof createRoot> | null;
    isVisible: boolean;
  };

  // Dashboard modal state
  dashboardModal: {
    container: HTMLDivElement | null;
    root: ReturnType<typeof createRoot> | null;
    isVisible: boolean;
  };
}

/**
 * Reflection workflow state - tracks current reflection session data
 */
export interface ReflectionState {
  extractedContent: ExtractedContent | null;
  summary: string[];
  summaryDisplay: string[];
  prompts: string[];
  format: SummaryFormat;
  isLoadingSummary: boolean;
  summaryBuffer: string;
  summaryAnimationIndex: number;
  summaryAnimationTimer: number | null;
  summaryAnimationFormat: SummaryFormat;
  summaryStreamComplete: boolean;
  activeSummaryStreamCleanup: (() => void) | null;
  isRewriting: boolean[];
}

/**
 * Language detection and translation state
 */
export interface LanguageState {
  detection: LanguageDetection | null;
  isTranslating: boolean;
  selectedTargetLanguage: string | null;
  preferredLanguageBaseline: string | null;
  isTargetLanguageOverridden: boolean;
  originalDetectedLanguage: string | null;
  originalContentLanguage: LanguageDetection | null;
}

/**
 * AI capabilities and availability state
 */
export interface AIState {
  capabilities: AICapabilities | null;
  available: boolean | null;
}

/**
 * Audio state
 */
export interface AudioState {
  isAmbientMuted: boolean;
}

/**
 * Complete content script state
 */
export interface ContentScriptState {
  ui: UIState;
  reflection: ReflectionState;
  language: LanguageState;
  ai: AIState;
  audio: AudioState;
}
