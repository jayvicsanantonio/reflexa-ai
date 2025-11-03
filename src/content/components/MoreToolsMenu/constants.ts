/**
 * More Tools Menu Constants
 * Shared constants for format and tone options
 */

import type { SummaryFormat, TonePreset } from '../../../types';

export interface FormatOption {
  value: SummaryFormat;
  label: string;
  description: string;
}

export interface ToneOption {
  value: TonePreset;
  label: string;
  icon: string;
  description: string;
}

export const formatOptions: FormatOption[] = [
  {
    value: 'bullets',
    label: 'Bullets',
    description: '3 concise bullet points',
  },
  {
    value: 'paragraph',
    label: 'Paragraph',
    description: 'Single flowing paragraph',
  },
  {
    value: 'headline-bullets',
    label: 'Headline',
    description: 'Headline with bullet points',
  },
];

export const toneOptions: ToneOption[] = [
  {
    value: 'calm',
    label: 'Calm',
    icon: '😌',
    description: 'Peaceful and centered',
  },
  {
    value: 'concise',
    label: 'Concise',
    icon: '→',
    description: 'Brief and to the point',
  },
  {
    value: 'empathetic',
    label: 'Empathetic',
    icon: '💙',
    description: 'Warm and understanding',
  },
  {
    value: 'academic',
    label: 'Academic',
    icon: '🎓',
    description: 'Formal and scholarly',
  },
];

// Language options for translation
export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export const languageOptions: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
];
