/**
 * Stacked Layout Component
 * Layout with original and translation stacked vertically
 */

import React from 'react';
import { ContentRenderer } from './ContentRenderer';
import { Label } from './Label';

interface StackedLayoutProps {
  original: string[];
  translated: string[];
  sourceLanguage: string;
  targetLanguage: string;
  format: 'bullets' | 'paragraph';
}

export const StackedLayout: React.FC<StackedLayoutProps> = ({
  original,
  translated,
  sourceLanguage,
  targetLanguage,
  format,
}) => (
  <div style={{ color: '#f1f5f9', fontSize: 15 }}>
    {/* Original */}
    <div style={{ marginBottom: 24 }}>
      <Label language={sourceLanguage} label="Original" />
      <ContentRenderer content={original} format={format} />
    </div>

    {/* Divider */}
    <div
      style={{
        height: 1,
        background: 'rgba(226, 232, 240, 0.15)',
        marginBottom: 24,
      }}
    />

    {/* Translation */}
    <div>
      <Label language={targetLanguage} label="Translation" />
      <ContentRenderer content={translated} format={format} />
    </div>
  </div>
);
