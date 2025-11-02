/**
 * Translate Dropdown Component
 * Allows users to select a target language for translation
 */

import React, { useState } from 'react';
import '../styles.css';
import { DropdownTrigger, SearchInput, LanguageOption } from './components';
import { useDropdownState, useLanguageFilter } from './hooks';
import { languageOptions } from './constants';

interface TranslateDropdownProps {
  currentLanguage?: string;
  onTranslate: (targetLanguage: string) => void;
  disabled?: boolean;
  loading?: boolean;
  unsupportedLanguages?: string[];
}

export const TranslateDropdown: React.FC<TranslateDropdownProps> = ({
  currentLanguage,
  onTranslate,
  disabled = false,
  loading = false,
  unsupportedLanguages = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLanguages = useLanguageFilter(searchQuery, languageOptions);
  const dropdownRef = useDropdownState(isOpen, () => {
    setIsOpen(false);
    setSearchQuery('');
  });

  const handleToggle = () => {
    if (!disabled && !loading) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchQuery('');
      }
    }
  };

  const handleSelect = (languageCode: string) => {
    const isUnsupported = unsupportedLanguages.includes(languageCode);
    const isCurrent = languageCode === currentLanguage;

    if (!disabled && !loading && !isUnsupported && !isCurrent) {
      onTranslate(languageCode);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="reflexa-translate-dropdown"
      data-testid="translate-dropdown"
    >
      <DropdownTrigger
        isOpen={isOpen}
        loading={loading}
        disabled={disabled}
        onToggle={handleToggle}
      />

      {isOpen && (
        <div
          className="reflexa-translate-dropdown__menu"
          role="listbox"
          aria-label="Translation language options"
          data-testid="translate-menu"
        >
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            isOpen={isOpen}
          />

          <div className="reflexa-translate-dropdown__options">
            {filteredLanguages.length === 0 ? (
              <div
                className="reflexa-translate-dropdown__no-results"
                data-testid="translate-no-results"
              >
                No languages found
              </div>
            ) : (
              filteredLanguages.map((option) => (
                <LanguageOption
                  key={option.code}
                  option={option}
                  isCurrent={option.code === currentLanguage}
                  isUnsupported={unsupportedLanguages.includes(option.code)}
                  onSelect={handleSelect}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
