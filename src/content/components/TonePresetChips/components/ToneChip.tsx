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

  const baseClasses =
    'flex items-center gap-1.5 px-3 py-1.75 bg-transparent border border-slate-200/20 rounded-lg text-slate-200/70 text-xs font-medium cursor-pointer transition-all duration-200 whitespace-nowrap';
  const selectedClasses = isSelected
    ? 'border-sky-400/50 text-sky-400 bg-sky-400/10'
    : '';
  const disabledClasses = isDisabled ? 'opacity-50 cursor-not-allowed' : '';
  const hoverClasses =
    !isDisabled && !isSelected
      ? 'hover:border-sky-400/40 hover:text-sky-400 hover:bg-sky-400/5'
      : '';
  const focusClasses =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 focus-visible:outline-offset-2';

  return (
    <button
      type="button"
      className={`${baseClasses} ${selectedClasses} ${disabledClasses} ${hoverClasses} ${focusClasses}`}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={`${label} tone: ${description}`}
      aria-pressed={isSelected}
      data-testid={`tone-chip-${value}`}
      title={description}
    >
      <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center">
        <ToneIcon type={icon} />
      </span>
      <span className="leading-none">{label}</span>
      {isLoading && isSelected && (
        <span
          className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center"
          aria-label="Loading"
        >
          <svg
            className="h-full w-full animate-[spin_1s_linear_infinite] motion-reduce:animate-none"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="50"
              strokeDashoffset="25"
              style={{ transformOrigin: 'center' }}
            />
          </svg>
        </span>
      )}
    </button>
  );
};
