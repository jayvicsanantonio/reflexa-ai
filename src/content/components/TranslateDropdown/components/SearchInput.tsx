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
    <div className="border-b border-b-white/10 p-3">
      <input
        ref={searchInputRef}
        type="text"
        className="w-full rounded-sm border border-white/10 bg-white/5 px-3 py-2 font-sans text-[13px] text-(--color-zen-100) transition-all duration-200 outline-none placeholder:text-(--color-calm-400) focus:border-sky-400/40 focus:bg-white/8"
        placeholder="Search languages..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search languages"
        data-testid="translate-search"
      />
    </div>
  );
};
