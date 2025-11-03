/**
 * Translate Dropdown Component
 * Allows users to select a target language for translation
 */

import React, { useState } from 'react';
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
      className="relative inline-block"
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
          className="-webkit-backdrop-blur-[12px] absolute top-[calc(100%+8px)] left-0 z-[1000] flex max-h-[400px] min-w-[280px] animate-[dropdownSlideIn_0.2s_ease] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-700/98 shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-[12px] motion-reduce:animate-[fadeIn_0.15s_ease-in-out] sm:max-h-[320px] sm:min-w-[260px]"
          role="listbox"
          aria-label="Translation language options"
          data-testid="translate-menu"
        >
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            isOpen={isOpen}
          />

          <div className="max-h-[320px] overflow-y-auto sm:max-h-[240px] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-slate-400/30 [&::-webkit-scrollbar-track]:bg-transparent">
            {filteredLanguages.length === 0 ? (
              <div
                className="px-4 py-6 text-center text-[13px] text-(--color-calm-400)"
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
