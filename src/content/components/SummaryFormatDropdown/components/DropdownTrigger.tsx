/**
 * Dropdown Trigger Component
 * Button that opens/closes the format dropdown
 */

import React from 'react';

interface DropdownTriggerProps {
  isOpen: boolean;
  disabled: boolean;
  icon: string;
  label: string;
  onToggle: () => void;
}

export const DropdownTrigger: React.FC<DropdownTriggerProps> = ({
  isOpen,
  disabled,
  icon,
  label,
  onToggle,
}) => (
  <button
    type="button"
    className={`reflexa-summary-format-dropdown__trigger ${
      disabled ? 'reflexa-summary-format-dropdown__trigger--disabled' : ''
    } ${isOpen ? 'reflexa-summary-format-dropdown__trigger--open' : ''}`}
    onClick={onToggle}
    disabled={disabled}
    aria-label="Select summary format"
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    data-testid="summary-format-trigger"
  >
    <span className="reflexa-summary-format-dropdown__icon">{icon}</span>
    <span className="reflexa-summary-format-dropdown__label">{label}</span>
    <span
      className={`reflexa-summary-format-dropdown__chevron ${
        isOpen ? 'reflexa-summary-format-dropdown__chevron--open' : ''
      }`}
    >
      ▼
    </span>
  </button>
);
