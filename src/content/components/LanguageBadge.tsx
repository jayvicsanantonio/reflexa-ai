import React from 'react';
import type { LanguageDetection } from '../../types';

interface LanguageBadgeProps {
  detection: LanguageDetection;
  onTranslate?: () => void;
  showConfidence?: boolean;
  compact?: boolean;
}

/**
 * Language Badge Component
 * Shows detected language with optional translation button
 */
export const LanguageBadge: React.FC<LanguageBadgeProps> = ({
  detection,
  onTranslate,
  showConfidence = false,
  compact = false,
}) => {
  const { languageName, confidence, detectedLanguage } = detection;

  // Confidence color coding
  const getConfidenceColor = (conf: number): string => {
    if (conf >= 0.9) return '#22c55e'; // green
    if (conf >= 0.7) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? 4 : 8,
        padding: compact ? '4px 8px' : '6px 12px',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 999,
        fontSize: compact ? 11 : 13,
        color: '#e2e8f0',
      }}
    >
      {/* Language flag emoji (optional) */}
      <span style={{ fontSize: compact ? 14 : 16 }} aria-hidden="true">
        🌐
      </span>

      {/* Language name */}
      <span style={{ fontWeight: 600 }}>
        {languageName}
        {showConfidence && (
          <span
            style={{
              marginLeft: 4,
              fontSize: compact ? 9 : 10,
              color: getConfidenceColor(confidence),
            }}
          >
            ({Math.round(confidence * 100)}%)
          </span>
        )}
      </span>

      {/* Language code */}
      {!compact && (
        <span
          style={{
            fontSize: 10,
            color: 'rgba(226, 232, 240, 0.6)',
            textTransform: 'uppercase',
          }}
        >
          {detectedLanguage}
        </span>
      )}

      {/* Translate button */}
      {onTranslate && (
        <button
          type="button"
          onClick={onTranslate}
          aria-label={`Translate from ${languageName}`}
          style={{
            background: 'rgba(96, 165, 250, 0.2)',
            border: '1px solid rgba(96, 165, 250, 0.4)',
            color: '#60a5fa',
            borderRadius: 999,
            padding: compact ? '2px 6px' : '4px 8px',
            fontSize: compact ? 10 : 11,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(96, 165, 250, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(96, 165, 250, 0.2)';
          }}
        >
          Translate
        </button>
      )}
    </div>
  );
};
