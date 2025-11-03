/**
 * Tone Preset Chips Component
 * Allows users to select different tone presets for text rewriting
 */

import React from 'react';
import type { TonePreset } from '../../../types';
import { ToneChip } from './components';
import { toneOptions } from './constants';

interface TonePresetChipsProps {
  selectedTone?: TonePreset;
  onToneSelect: (tone: TonePreset) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export const TonePresetChips: React.FC<TonePresetChipsProps> = ({
  selectedTone,
  onToneSelect,
  disabled = false,
  isLoading = false,
}) => {
  return (
    <div
      className="flex items-center gap-1.5"
      role="group"
      aria-label="Tone preset options"
      data-testid="tone-preset-chips"
    >
      {toneOptions.map((option) => (
        <ToneChip
          key={option.value}
          value={option.value}
          label={option.label}
          icon={option.icon}
          description={option.description}
          isSelected={selectedTone === option.value}
          isDisabled={disabled || isLoading}
          isLoading={isLoading}
          onSelect={onToneSelect}
        />
      ))}
    </div>
  );
};
