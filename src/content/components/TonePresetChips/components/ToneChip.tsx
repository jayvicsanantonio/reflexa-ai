/**
 * Tone Chip Component
 * Individual tone preset button
 */

import React from 'react';
import type { TonePreset } from '../../../../types';
import { ToneIcon } from './ToneIcon';

interface ToneChipProps {
  value: TonePreset;
  label: string;
  icon: string;
  description: string;
  isSelected: boolean;
  isDisabled: boolean;
  isLoading: boolean;
  onSelect: (tone: TonePreset) => void;
}

export const ToneChip: React.FC<ToneChipProps> = ({
  value,
  label,
  icon,
  description,
  isSelected,
  isDisabled,
  isLoading,
  onSelect,
}) => {
  const handleClick = () => {
    if (!isDisabled && !isLoading) {
      onSelect(value);
    }
  };

  return (
    <button
      type="button"
      className={`reflexa-tone-preset-chip ${
        isSelected ? 'reflexa-tone-preset-chip--selected' : ''
      } ${isDisabled ? 'reflexa-tone-preset-chip--disabled' : ''}`}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={`${label} tone: ${description}`}
      aria-pressed={isSelected}
      data-testid={`tone-chip-${value}`}
      title={description}
    >
      <span className="reflexa-tone-preset-chip__icon">
        <ToneIcon type={icon} />
      </span>
      <span className="reflexa-tone-preset-chip__label">{label}</span>
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
};
