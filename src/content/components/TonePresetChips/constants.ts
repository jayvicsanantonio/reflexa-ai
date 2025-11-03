/**
 * Tone preset options
 */

import type { TonePreset } from '../../../types';

export interface ToneOption {
  value: TonePreset;
  label: string;
  icon: string;
  description: string;
}

export const toneOptions: ToneOption[] = [
  {
    value: 'calm',
    label: 'Calm',
    icon: 'calm',
    description: 'Peaceful and centered',
  },
  {
    value: 'concise',
    label: 'Concise',
    icon: 'concise',
    description: 'Brief and to the point',
  },
  {
    value: 'empathetic',
    label: 'Empathetic',
    icon: 'empathetic',
    description: 'Warm and understanding',
  },
  {
    value: 'academic',
    label: 'Academic',
    icon: 'academic',
    description: 'Formal and scholarly',
  },
];
