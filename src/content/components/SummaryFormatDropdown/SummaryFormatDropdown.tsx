/**
 * Summary Format Dropdown Component
 * Allows users to select different summary formats
 */

import React, { useState } from 'react';
import type { SummaryFormat } from '../../../types';
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
      className="relative inline-block font-sans"
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
          className="absolute top-[calc(100%+8px)] right-0 left-0 z-[1000] animate-[slideDown_0.2s_ease-out] overflow-hidden rounded-2xl border border-white/20 bg-slate-700/98 shadow-[0_8px_24px_rgba(0,0,0,0.3)] motion-reduce:animate-[fadeIn_0.15s_ease-in-out]"
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
