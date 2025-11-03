/**
 * Side-by-Side Layout Component
 * Layout with original and translation side by side
 */

import React from 'react';
import { ContentRenderer } from './ContentRenderer';
import { Label } from './Label';

interface SideBySideLayoutProps {
  original: string[];
  translated: string[];
  sourceLanguage: string;
  targetLanguage: string;
  format: 'bullets' | 'paragraph';
}

export const SideBySideLayout: React.FC<SideBySideLayoutProps> = ({
  original,
  translated,
  sourceLanguage,
  targetLanguage,
  format,
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 24,
      color: '#f1f5f9',
      fontSize: 15,
    }}
  >
    {/* Original */}
    <div>
      <Label language={sourceLanguage} label="Original" />
      <ContentRenderer content={original} format={format} />
    </div>

    {/* Translation */}
    <div>
      <Label language={targetLanguage} label="Translation" />
      <ContentRenderer content={translated} format={format} />
    </div>
  </div>
);
