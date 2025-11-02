/**
 * Type definitions for workflow modules
 */

import type {
  Settings,
  LanguageDetection,
  AICapabilities,
  ExtractedContent,
} from '../../types';

export interface ReflectionWorkflowDependencies {
  getSettings: () => Settings | null;
  checkAIAvailability: () => Promise<boolean>;
  getAICapabilities: () => Promise<AICapabilities | null>;
  extractContent: () => ExtractedContent;
  detectLanguage: (
    text: string,
    pageUrl: string
  ) => Promise<LanguageDetection | null>;
  applyTranslationPreference: (settings: Settings | null) => void;
}
