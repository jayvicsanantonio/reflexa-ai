import React from 'react';
import {
  ToggleLayout,
  StackedLayout,
  SideBySideLayout,
} from './BilingualView/components';

interface BilingualViewProps {
  original: string[];
  translated: string[];
  sourceLanguage: string;
  targetLanguage: string;
  layout?: 'side-by-side' | 'stacked' | 'toggle';
  format?: 'bullets' | 'paragraph';
}

/**
 * Bilingual View Component
 * Shows original and translated content for language learners
 */
export const BilingualView: React.FC<BilingualViewProps> = ({
  original,
  translated,
  sourceLanguage,
  targetLanguage,
  layout = 'side-by-side',
  format = 'bullets',
}) => {
  const commonProps = {
    original,
    translated,
    sourceLanguage,
    targetLanguage,
    format,
  };

  if (layout === 'toggle') {
    return <ToggleLayout {...commonProps} />;
  }

  if (layout === 'stacked') {
    return <StackedLayout {...commonProps} />;
  }

  // Side-by-side layout (default)
  return <SideBySideLayout {...commonProps} />;
};
