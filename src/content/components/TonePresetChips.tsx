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

const ToneIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'calm':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      );
    case 'concise':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="4" y1="12" x2="20" y2="12" />
          <polyline points="14 6 20 12 14 18" />
        </svg>
      );
    case 'empathetic':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    case 'academic':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      );
    default:
      return null;
  }
};

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
              <ToneIcon type={option.icon} />
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
