import React, { useState, useRef, useEffect } from 'react';
import type { SummaryFormat } from '../../types';
import '../styles.css';

interface SummaryFormatDropdownProps {
  selectedFormat: SummaryFormat;
  onFormatChange: (format: SummaryFormat) => void;
  disabled?: boolean;
}

interface FormatOption {
  value: SummaryFormat;
  label: string;
  icon: string;
  description: string;
}

const formatOptions: FormatOption[] = [
  {
    value: 'bullets',
    label: 'Bullets',
    icon: '•',
    description: '3 concise bullet points',
  },
  {
    value: 'paragraph',
    label: 'Paragraph',
    icon: '¶',
    description: 'Single flowing paragraph',
  },
  {
    value: 'headline-bullets',
    label: 'Headline + Bullets',
    icon: '⚡',
    description: 'Headline with bullet points',
  },
];

/**
 * Summary Format Dropdown Component
 * Allows users to select different summary formats (bullets, paragraph, headline-bullets)
 * Includes smooth transitions and disabled state during AI processing
 */
export const SummaryFormatDropdown: React.FC<SummaryFormatDropdownProps> = ({
  selectedFormat,
  onFormatChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

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
      <button
        type="button"
        className={`reflexa-summary-format-dropdown__trigger ${
          disabled ? 'reflexa-summary-format-dropdown__trigger--disabled' : ''
        } ${isOpen ? 'reflexa-summary-format-dropdown__trigger--open' : ''}`}
        onClick={handleToggle}
        disabled={disabled}
        aria-label="Select summary format"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        data-testid="summary-format-trigger"
      >
        <span className="reflexa-summary-format-dropdown__icon">
          {selectedOption?.icon}
        </span>
        <span className="reflexa-summary-format-dropdown__label">
          {selectedOption?.label}
        </span>
        <span
          className={`reflexa-summary-format-dropdown__chevron ${
            isOpen ? 'reflexa-summary-format-dropdown__chevron--open' : ''
          }`}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          className="reflexa-summary-format-dropdown__menu"
          role="listbox"
          aria-label="Summary format options"
          data-testid="summary-format-menu"
        >
          {formatOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`reflexa-summary-format-dropdown__option ${
                option.value === selectedFormat
                  ? 'reflexa-summary-format-dropdown__option--selected'
                  : ''
              }`}
              onClick={() => handleSelect(option.value)}
              role="option"
              aria-selected={option.value === selectedFormat}
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
              {option.value === selectedFormat && (
                <span className="reflexa-summary-format-dropdown__option-check">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
