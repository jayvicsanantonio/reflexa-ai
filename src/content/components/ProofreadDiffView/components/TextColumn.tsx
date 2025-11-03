/**
 * Text Column Component
 * Displays original or corrected text with highlights
 */

import React from 'react';
import type { ProofreadResult } from '../../../../types';
import type { TextSegment } from '../types';
import { categorizeChange } from '../utils/categorizeChange';

interface TextColumnProps {
  title: string;
  icon: string;
  segments: TextSegment[];
  corrections: ProofreadResult['corrections'];
  correctedText: string;
  hoveredIndex: number | null;
  onHoverChange: (index: number | null) => void;
  isOriginal?: boolean;
  testIdPrefix: string;
}

export const TextColumn: React.FC<TextColumnProps> = ({
  title,
  icon,
  segments,
  corrections,
  correctedText,
  hoveredIndex,
  onHoverChange,
  isOriginal = false,
  testIdPrefix,
}) => (
  <div className="reflexa-proofread-diff-view__column">
    <div className="reflexa-proofread-diff-view__column-header">
      <span className="reflexa-proofread-diff-view__column-icon">{icon}</span>
      <span className="reflexa-proofread-diff-view__column-title">{title}</span>
    </div>
    <div
      className="reflexa-proofread-diff-view__text"
      data-testid={`${testIdPrefix}-text`}
    >
      {segments.map((segment, idx) => {
        if (!segment.isHighlight) {
          return <span key={idx}>{segment.text}</span>;
        }

        const correction = corrections[segment.correctionIndex!];
        const changeType = categorizeChange(
          correction.original,
          correctedText.substring(correction.startIndex, correction.endIndex)
        );

        return (
          <span
            key={idx}
            className={`reflexa-proofread-diff-view__highlight reflexa-proofread-diff-view__highlight--${changeType} reflexa-proofread-diff-view__highlight--${isOriginal ? 'original' : 'corrected'}`}
            data-testid={`highlight-${testIdPrefix}-${segment.correctionIndex}`}
            onMouseEnter={() => onHoverChange(segment.correctionIndex!)}
            onMouseLeave={() => onHoverChange(null)}
            role="mark"
            aria-label={`${changeType} correction`}
          >
            {segment.text}
            {hoveredIndex === segment.correctionIndex && (
              <span
                className="reflexa-proofread-diff-view__tooltip"
                role="tooltip"
                data-testid={`tooltip-${testIdPrefix}-${segment.correctionIndex}`}
              >
                <span className="reflexa-proofread-diff-view__tooltip-type">
                  {changeType.charAt(0).toUpperCase() + changeType.slice(1)}
                </span>
                <span className="reflexa-proofread-diff-view__tooltip-text">
                  {isOriginal ? 'Original text' : 'Suggested correction'}
                </span>
              </span>
            )}
          </span>
        );
      })}
    </div>
  </div>
);
