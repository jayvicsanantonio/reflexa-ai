/**
 * Search Input Component
 * Search field for filtering languages
 */

import React, { useEffect, useRef } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  isOpen: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  isOpen,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="reflexa-translate-dropdown__search">
      <input
        ref={searchInputRef}
        type="text"
        className="reflexa-translate-dropdown__search-input"
        placeholder="Search languages..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search languages"
        data-testid="translate-search"
      />
    </div>
  );
};
