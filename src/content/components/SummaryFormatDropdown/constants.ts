/**
 * Summary format options
 */

import type { SummaryFormat } from '../../../types';

export interface FormatOption {
  value: SummaryFormat;
  label: string;
  icon: string;
  description: string;
}

export const formatOptions: FormatOption[] = [
  {
    value: 'bullets',
    label: 'Bullets',
    icon: '•',
    description: '3 concise bullet points',
  },
  {
    value: 'paragraph',
    label: 'Paragraph',
    icon: '¶',
    description: 'Single flowing paragraph',
  },
  {
    value: 'headline-bullets',
    label: 'Headline + Bullets',
    icon: '⚡',
    description: 'Headline with bullet points',
  },
];
