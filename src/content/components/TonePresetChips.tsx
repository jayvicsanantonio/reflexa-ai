import React from 'react';
import type { TonePreset } from '../../types';
import '../styles.css';

interface TonePresetChipsProps {
  selectedTone?: TonePreset;
  onToneSelect: (tone: TonePreset) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

interface ToneOption {
  value: TonePreset;
  label: string;
  icon: string;
  description: string;
}

const toneOptions: ToneOption[] = [
  {
    value: 'calm',
    label: 'Calm',
    icon: '🧘',
    description: 'Peaceful and centered',
  },
  {
    value: 'concise',
    label: 'Concise',
    icon: '✂️',
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

/**
 * Tone Preset Chips Component
 * Allows users to select different tone presets for text rewriting
 * Includes active state highlighting, hover effects, and loading state
 */
export const TonePresetChips: React.FC<TonePresetChipsProps> = ({
  selectedTone,
  onToneSelect,
  disabled = false,
  isLoading = false,
}) => {
  const handleToneClick = (tone: TonePreset) => {
    if (!disabled && !isLoading) {
      onToneSelect(tone);
    }
  };

  return (
    <div
      className="reflexa-tone-preset-chips"
      role="group"
      aria-label="Tone preset options"
      data-testid="tone-preset-chips"
    >
      {toneOptions.map((option) => {
        const isSelected = selectedTone === option.value;
        const isDisabled = disabled || isLoading;

        return (
          <button
            key={option.value}
            type="button"
            className={`reflexa-tone-preset-chip ${
              isSelected ? 'reflexa-tone-preset-chip--selected' : ''
            } ${isDisabled ? 'reflexa-tone-preset-chip--disabled' : ''}`}
            onClick={() => handleToneClick(option.value)}
            disabled={isDisabled}
            aria-label={`${option.label} tone: ${option.description}`}
            aria-pressed={isSelected}
            data-testid={`tone-chip-${option.value}`}
            title={option.description}
          >
            <span className="reflexa-tone-preset-chip__icon">
              {option.icon}
            </span>
            <span className="reflexa-tone-preset-chip__label">
              {option.label}
            </span>
            {isLoading && isSelected && (
              <span
                className="reflexa-tone-preset-chip__spinner"
                aria-label="Loading"
              >
                <svg
                  className="reflexa-tone-preset-chip__spinner-svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    className="reflexa-tone-preset-chip__spinner-circle"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
