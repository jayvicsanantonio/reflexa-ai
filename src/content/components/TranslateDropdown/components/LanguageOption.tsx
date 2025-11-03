/**
 * Language Option Component
 * Individual language option button in the dropdown
 */

import React from 'react';
import type { LanguageOption as LanguageOptionType } from '../constants';

interface LanguageOptionProps {
  option: LanguageOptionType;
  isCurrent: boolean;
  isUnsupported: boolean;
  onSelect: (code: string) => void;
}

export const LanguageOption: React.FC<LanguageOptionProps> = ({
  option,
  isCurrent,
  isUnsupported,
  onSelect,
}) => {
  const handleClick = () => {
    if (!isUnsupported && !isCurrent) {
      onSelect(option.code);
    }
  };

  return (
    <button
      type="button"
      className={`reflexa-translate-dropdown__option ${
        isCurrent ? 'reflexa-translate-dropdown__option--current' : ''
      } ${
        isUnsupported ? 'reflexa-translate-dropdown__option--unsupported' : ''
      }`}
      onClick={handleClick}
      disabled={isUnsupported || isCurrent}
      role="option"
      aria-selected={isCurrent}
      aria-disabled={isUnsupported}
      title={
        isUnsupported
          ? `Translation to ${option.name} is not available`
          : isCurrent
            ? `Currently in ${option.name}`
            : `Translate to ${option.name}`
      }
      data-testid={`translate-option-${option.code}`}
    >
      <span
        className="reflexa-translate-dropdown__option-flag"
        aria-hidden="true"
      >
        {option.flag}
      </span>
      <div className="reflexa-translate-dropdown__option-content">
        <span className="reflexa-translate-dropdown__option-name">
          {option.name}
        </span>
        <span className="reflexa-translate-dropdown__option-native">
          {option.nativeName}
        </span>
      </div>
      {isCurrent && (
        <span className="reflexa-translate-dropdown__option-badge">
          Current
        </span>
      )}
      {isUnsupported && !isCurrent && (
        <span className="reflexa-translate-dropdown__option-badge reflexa-translate-dropdown__option-badge--unavailable">
          Unavailable
        </span>
      )}
    </button>
  );
};
