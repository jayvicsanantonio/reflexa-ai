import React, { useState, useRef, useEffect } from 'react';
import '../styles.css';

interface TranslateDropdownProps {
  currentLanguage?: string;
  onTranslate: (targetLanguage: string) => void;
  disabled?: boolean;
  loading?: boolean;
  unsupportedLanguages?: string[];
}

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languageOptions: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
];

/**
 * Translate Dropdown Component
 * Allows users to select a target language for translation
 * Includes flag icons, search/filter, loading state, and unsupported language graying
 */
export const TranslateDropdown: React.FC<TranslateDropdownProps> = ({
  currentLanguage,
  onTranslate,
  disabled = false,
  loading = false,
  unsupportedLanguages = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter languages based on search query
  const filteredLanguages = languageOptions.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
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
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

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
      <button
        type="button"
        className={`reflexa-translate-dropdown__trigger ${
          disabled || loading
            ? 'reflexa-translate-dropdown__trigger--disabled'
            : ''
        } ${isOpen ? 'reflexa-translate-dropdown__trigger--open' : ''}`}
        onClick={handleToggle}
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

      {isOpen && (
        <div
          className="reflexa-translate-dropdown__menu"
          role="listbox"
          aria-label="Translation language options"
          data-testid="translate-menu"
        >
          <div className="reflexa-translate-dropdown__search">
            <input
              ref={searchInputRef}
              type="text"
              className="reflexa-translate-dropdown__search-input"
              placeholder="Search languages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search languages"
              data-testid="translate-search"
            />
          </div>

          <div className="reflexa-translate-dropdown__options">
            {filteredLanguages.length === 0 ? (
              <div
                className="reflexa-translate-dropdown__no-results"
                data-testid="translate-no-results"
              >
                No languages found
              </div>
            ) : (
              filteredLanguages.map((option) => {
                const isUnsupported = unsupportedLanguages.includes(
                  option.code
                );
                const isCurrent = option.code === currentLanguage;

                return (
                  <button
                    key={option.code}
                    type="button"
                    className={`reflexa-translate-dropdown__option ${
                      isCurrent
                        ? 'reflexa-translate-dropdown__option--current'
                        : ''
                    } ${
                      isUnsupported
                        ? 'reflexa-translate-dropdown__option--unsupported'
                        : ''
                    }`}
                    onClick={() => handleSelect(option.code)}
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
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
