/**
 * Format Option Component
 * Individual format option button in the dropdown
 */

import React from 'react';
import type { SummaryFormat } from '../../../../types';
import type { FormatOption as FormatOptionType } from '../constants';

interface FormatOptionProps {
  option: FormatOptionType;
  isSelected: boolean;
  onSelect: (format: SummaryFormat) => void;
}

export const FormatOption: React.FC<FormatOptionProps> = ({
  option,
  isSelected,
  onSelect,
}) => {
  const baseClasses =
    'flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none text-(--color-zen-100) text-left cursor-pointer transition-all duration-150 border-b border-b-white/5 last:border-b-0';
  const selectedClasses = isSelected ? 'bg-sky-400/15' : '';
  const hoverClasses = !isSelected ? 'hover:bg-sky-400/10' : '';
  const focusClasses =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-(--color-zen-400) focus-visible:outline-offset-[-2px]';

  return (
    <button
      type="button"
      className={`${baseClasses} ${selectedClasses} ${hoverClasses} ${focusClasses}`}
      onClick={() => onSelect(option.value)}
      role="option"
      aria-selected={isSelected}
      data-testid={`summary-format-option-${option.value}`}
    >
      <span className="flex-shrink-0 text-xl leading-none text-(--color-zen-400)">
        {option.icon}
      </span>
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-(--color-zen-100)">
          {option.label}
        </span>
        <span className="text-xs text-(--color-calm-400)">
          {option.description}
        </span>
      </div>
      {isSelected && (
        <span className="flex-shrink-0 text-base text-(--color-zen-400)">
          ✓
        </span>
      )}
    </button>
  );
};
