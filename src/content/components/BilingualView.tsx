import React, { useState } from 'react';

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
  const [showOriginal, setShowOriginal] = useState(true);
  const [showTranslated, setShowTranslated] = useState(true);

  const renderContent = (content: string[]) => {
    if (format === 'bullets') {
      return (
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            listStyle: 'disc',
          }}
        >
          {content.map((item, i) => (
            <li
              key={i}
              style={{
                marginBottom: 8,
                lineHeight: 1.6,
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      );
    }

    return <p style={{ margin: 0, lineHeight: 1.8 }}>{content.join(' ')}</p>;
  };

  if (layout === 'toggle') {
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
              <div
                style={{
                  fontSize: 11,
                  color: 'rgba(226, 232, 240, 0.6)',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Original ({sourceLanguage})
              </div>
              {renderContent(original)}
            </div>
          )}
          {showTranslated && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: 'rgba(226, 232, 240, 0.6)',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Translation ({targetLanguage})
              </div>
              {renderContent(translated)}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (layout === 'stacked') {
    return (
      <div style={{ color: '#f1f5f9', fontSize: 15 }}>
        {/* Original */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 11,
              color: 'rgba(226, 232, 240, 0.6)',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Original ({sourceLanguage})
          </div>
          {renderContent(original)}
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
          <div
            style={{
              fontSize: 11,
              color: 'rgba(226, 232, 240, 0.6)',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Translation ({targetLanguage})
          </div>
          {renderContent(translated)}
        </div>
      </div>
    );
  }

  // Side-by-side layout
  return (
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
        <div
          style={{
            fontSize: 11,
            color: 'rgba(226, 232, 240, 0.6)',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Original ({sourceLanguage})
        </div>
        {renderContent(original)}
      </div>

      {/* Translation */}
      <div>
        <div
          style={{
            fontSize: 11,
            color: 'rgba(226, 232, 240, 0.6)',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Translation ({targetLanguage})
        </div>
        {renderContent(translated)}
      </div>
    </div>
  );
};
