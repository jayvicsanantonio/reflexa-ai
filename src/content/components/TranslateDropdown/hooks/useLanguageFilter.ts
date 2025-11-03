/**
 * Hook for filtering languages based on search query
 */

import { useMemo } from 'react';
import type { LanguageOption } from '../constants';

export const useLanguageFilter = (
  searchQuery: string,
  languages: LanguageOption[]
): LanguageOption[] => {
  return useMemo(() => {
    if (!searchQuery.trim()) {
      return languages;
    }

    const query = searchQuery.toLowerCase();
    return languages.filter(
      (lang) =>
        lang.name.toLowerCase().includes(query) ||
        lang.nativeName.toLowerCase().includes(query) ||
        lang.code.toLowerCase().includes(query)
    );
  }, [searchQuery, languages]);
};
