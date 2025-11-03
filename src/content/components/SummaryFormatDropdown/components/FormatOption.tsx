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
}) => (
  <button
    type="button"
    className={`reflexa-summary-format-dropdown__option ${
      isSelected ? 'reflexa-summary-format-dropdown__option--selected' : ''
    }`}
    onClick={() => onSelect(option.value)}
    role="option"
    aria-selected={isSelected}
    data-testid={`summary-format-option-${option.value}`}
  >
    <span className="reflexa-summary-format-dropdown__option-icon">
      {option.icon}
    </span>
    <div className="reflexa-summary-format-dropdown__option-content">
      <span className="reflexa-summary-format-dropdown__option-label">
        {option.label}
      </span>
      <span className="reflexa-summary-format-dropdown__option-description">
        {option.description}
      </span>
    </div>
    {isSelected && (
      <span className="reflexa-summary-format-dropdown__option-check">✓</span>
    )}
  </button>
);
