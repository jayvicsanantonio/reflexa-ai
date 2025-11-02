/**
 * Summary Format Dropdown Component
 * Allows users to select different summary formats
 */

import React, { useState } from 'react';
import type { SummaryFormat } from '../../../types';
import '../../styles.css';
import { DropdownTrigger, FormatOption } from './components';
import { useDropdownState } from './hooks';
import { formatOptions } from './constants';

interface SummaryFormatDropdownProps {
  selectedFormat: SummaryFormat;
  onFormatChange: (format: SummaryFormat) => void;
  disabled?: boolean;
}

export const SummaryFormatDropdown: React.FC<SummaryFormatDropdownProps> = ({
  selectedFormat,
  onFormatChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const dropdownRef = useDropdownState(isOpen, () => setIsOpen(false));

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (format: SummaryFormat) => {
    if (!disabled && format !== selectedFormat) {
      onFormatChange(format);
      setIsOpen(false);
    }
  };

  const selectedOption = formatOptions.find(
    (opt) => opt.value === selectedFormat
  );

  return (
    <div
      ref={dropdownRef}
      className="reflexa-summary-format-dropdown"
      data-testid="summary-format-dropdown"
    >
      <DropdownTrigger
        isOpen={isOpen}
        disabled={disabled}
        icon={selectedOption?.icon ?? '•'}
        label={selectedOption?.label ?? 'Bullets'}
        onToggle={handleToggle}
      />

      {isOpen && (
        <div
          className="reflexa-summary-format-dropdown__menu"
          role="listbox"
          aria-label="Summary format options"
          data-testid="summary-format-menu"
        >
          {formatOptions.map((option) => (
            <FormatOption
              key={option.value}
              option={option}
              isSelected={option.value === selectedFormat}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};
