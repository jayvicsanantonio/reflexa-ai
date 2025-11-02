/**
 * Toggle Layout Component
 * Layout with toggle buttons to show/hide original/translated
 */

import React, { useState } from 'react';
import { ContentRenderer } from './ContentRenderer';
import { Label } from './Label';

interface ToggleLayoutProps {
  original: string[];
  translated: string[];
  sourceLanguage: string;
  targetLanguage: string;
  format: 'bullets' | 'paragraph';
}

export const ToggleLayout: React.FC<ToggleLayoutProps> = ({
  original,
  translated,
  sourceLanguage,
  targetLanguage,
  format,
}) => {
  const [showOriginal, setShowOriginal] = useState(true);
  const [showTranslated, setShowTranslated] = useState(true);

  return (
    <div>
      {/* Toggle controls */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
          justifyContent: 'center',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setShowOriginal(true);
            setShowTranslated(false);
          }}
          style={{
            padding: '6px 12px',
            borderRadius: 999,
            border: '1px solid rgba(226, 232, 240, 0.25)',
            background:
              showOriginal && !showTranslated
                ? 'rgba(96, 165, 250, 0.2)'
                : 'transparent',
            color: '#e2e8f0',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {sourceLanguage.toUpperCase()}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowOriginal(false);
            setShowTranslated(true);
          }}
          style={{
            padding: '6px 12px',
            borderRadius: 999,
            border: '1px solid rgba(226, 232, 240, 0.25)',
            background:
              !showOriginal && showTranslated
                ? 'rgba(96, 165, 250, 0.2)'
                : 'transparent',
            color: '#e2e8f0',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {targetLanguage.toUpperCase()}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowOriginal(true);
            setShowTranslated(true);
          }}
          style={{
            padding: '6px 12px',
            borderRadius: 999,
            border: '1px solid rgba(226, 232, 240, 0.25)',
            background:
              showOriginal && showTranslated
                ? 'rgba(96, 165, 250, 0.2)'
                : 'transparent',
            color: '#e2e8f0',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Both
        </button>
      </div>

      {/* Content */}
      <div style={{ color: '#f1f5f9', fontSize: 15 }}>
        {showOriginal && (
          <div style={{ marginBottom: showTranslated ? 16 : 0 }}>
            <Label language={sourceLanguage} label="Original" />
            <ContentRenderer content={original} format={format} />
          </div>
        )}
        {showTranslated && (
          <div>
            <Label language={targetLanguage} label="Translation" />
            <ContentRenderer content={translated} format={format} />
          </div>
        )}
      </div>
    </div>
  );
};
