/**
 * Summary Phase Component (Step 1)
 * Displays the generated summary with format options
 */

import React from 'react';
import { renderMarkdown } from '../../../utils/markdownRenderer';
import type { SummaryFormat, LanguageDetection } from '../../../types';

interface SummaryPhaseProps {
  summary: string[];
  summaryDisplay?: string[];
  currentFormat: SummaryFormat;
  isLoadingSummary: boolean;
  languageDetection?: LanguageDetection;
}

export const SummaryPhase: React.FC<SummaryPhaseProps> = ({
  summary,
  summaryDisplay,
  currentFormat,
  isLoadingSummary,
  languageDetection,
}) => {
  const renderedSummary = summaryDisplay ?? summary;

  return (
    <div className="reflexa-meditation-slide" style={{ position: 'relative' }}>
      {/* Subtle language badge - show when language is detected */}
      {languageDetection && (
        <div
          style={{
            position: 'absolute',
            top: -8,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(226, 232, 240, 0.18)',
            borderRadius: 999,
            fontSize: 11,
            color: 'rgba(226, 232, 240, 0.75)',
            backdropFilter: 'blur(8px)',
          }}
          aria-live="polite"
        >
          <span aria-hidden style={{ fontSize: 13 }}>
            🌐
          </span>
          <span>Translated from {languageDetection.languageName}</span>
        </div>
      )}

      <h2 style={{ fontSize: 22, margin: '0 0 12px', fontWeight: 800 }}>
        Summary
      </h2>
      <div
        style={{
          color: '#f1f5f9',
          fontSize: 16,
          lineHeight: 1.8,
          textAlign: 'left',
          margin: '0 auto',
          maxWidth: 720,
          minHeight: 120,
        }}
      >
        {isLoadingSummary ? (
          <div style={{ color: '#cbd5e1' }}>Generating…</div>
        ) : currentFormat === 'bullets' ? (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {renderedSummary.map((s, i) => (
              <li
                key={i}
                style={{ marginBottom: 8 }}
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(s),
                }}
              />
            ))}
          </ul>
        ) : currentFormat === 'headline-bullets' ? (
          <div>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: '0 0 16px',
              }}
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(renderedSummary[0] || ''),
              }}
            />
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {renderedSummary.slice(1).map((s, i) => (
                <li
                  key={i}
                  style={{ marginBottom: 8 }}
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(s),
                  }}
                />
              ))}
            </ul>
          </div>
        ) : (
          <p
            style={{ margin: 0 }}
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(renderedSummary.join(' ')),
            }}
          />
        )}
      </div>
    </div>
  );
};
