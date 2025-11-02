/**
 * Dropdown Trigger Component
 * Button that opens/closes the translation language dropdown
 */

import React from 'react';

interface DropdownTriggerProps {
  isOpen: boolean;
  loading: boolean;
  disabled: boolean;
  onToggle: () => void;
}

export const DropdownTrigger: React.FC<DropdownTriggerProps> = ({
  isOpen,
  loading,
  disabled,
  onToggle,
}) => (
  <button
    type="button"
    className={`reflexa-translate-dropdown__trigger ${
      disabled || loading ? 'reflexa-translate-dropdown__trigger--disabled' : ''
    } ${isOpen ? 'reflexa-translate-dropdown__trigger--open' : ''}`}
    onClick={onToggle}
    disabled={disabled || loading}
    aria-label="Select translation language"
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    data-testid="translate-trigger"
  >
    <span className="reflexa-translate-dropdown__icon">🌐</span>
    <span className="reflexa-translate-dropdown__label">
      {loading ? 'Translating...' : 'Translate'}
    </span>
    {loading && (
      <span
        className="reflexa-translate-dropdown__spinner"
        aria-label="Loading"
      >
        ⟳
      </span>
    )}
    {!loading && (
      <span
        className={`reflexa-translate-dropdown__chevron ${
          isOpen ? 'reflexa-translate-dropdown__chevron--open' : ''
        }`}
      >
        ▼
      </span>
    )}
  </button>
);
