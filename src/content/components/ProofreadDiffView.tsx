import React, { useState } from 'react';
import type { ProofreadResult } from '../../types';
import '../styles.css';

interface ProofreadDiffViewProps {
  original: string;
  result: ProofreadResult;
  onAccept: () => void;
  onDiscard: () => void;
}

interface TextSegment {
  text: string;
  isHighlight: boolean;
  correctionIndex?: number;
}

/**
 * Categorize change type based on heuristics
 * Note: Chrome Proofreader API doesn't provide explicit type categorization
 */
const categorizeChange = (
  original: string,
  corrected: string
): 'grammar' | 'clarity' | 'spelling' => {
  const originalLower = original.toLowerCase();
  const correctedLower = corrected.toLowerCase();

  // Spelling: same length or very similar, different case or characters
  if (
    Math.abs(original.length - corrected.length) <= 2 &&
    originalLower !== correctedLower
  ) {
    return 'spelling';
  }

  // Grammar: structural changes, punctuation, articles, verb forms
  const grammarPatterns = /\b(a|an|the|is|are|was|were|has|have|had)\b/i;
  if (grammarPatterns.test(original) || grammarPatterns.test(corrected)) {
    return 'grammar';
  }

  // Clarity: significant rewording or length changes
  return 'clarity';
};

/**
 * Proofread Diff View Component
 * Displays side-by-side comparison of original and corrected text
 * with inline change highlighting and Accept/Discard actions
 */
export const ProofreadDiffView: React.FC<ProofreadDiffViewProps> = ({
  original,
  result,
  onAccept,
  onDiscard,
}) => {
  const { correctedText, corrections } = result;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  /**
   * Split text into segments with highlights for corrections
   */
  const getTextSegments = (text: string): TextSegment[] => {
    if (corrections.length === 0) {
      return [{ text, isHighlight: false }];
    }

    const segments: TextSegment[] = [];
    let lastIndex = 0;

    // Sort corrections by start index
    const sortedCorrections = [...corrections].sort(
      (a, b) => a.startIndex - b.startIndex
    );

    sortedCorrections.forEach((correction, idx) => {
      const { startIndex, endIndex } = correction;

      // Add text before this correction
      if (startIndex > lastIndex) {
        segments.push({
          text: text.substring(lastIndex, startIndex),
          isHighlight: false,
        });
      }

      // Add highlighted correction
      segments.push({
        text: text.substring(startIndex, endIndex),
        isHighlight: true,
        correctionIndex: idx,
      });

      lastIndex = endIndex;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      segments.push({
        text: text.substring(lastIndex),
        isHighlight: false,
      });
    }

    return segments;
  };

  const originalSegments = getTextSegments(original);
  const correctedSegments = getTextSegments(correctedText);

  return (
    <div
      className="reflexa-proofread-diff-view"
      data-testid="proofread-diff-view"
      role="region"
      aria-label="Proofreading results"
    >
      <div className="reflexa-proofread-diff-view__header">
        <h3 className="reflexa-proofread-diff-view__title">
          Proofreading Results
        </h3>
        <p className="reflexa-proofread-diff-view__subtitle">
          {corrections.length === 0
            ? 'No corrections needed'
            : `${corrections.length} ${corrections.length === 1 ? 'correction' : 'corrections'} suggested`}
        </p>
      </div>

      <div className="reflexa-proofread-diff-view__comparison">
        {/* Original Text Column */}
        <div className="reflexa-proofread-diff-view__column">
          <div className="reflexa-proofread-diff-view__column-header">
            <span className="reflexa-proofread-diff-view__column-icon">📝</span>
            <span className="reflexa-proofread-diff-view__column-title">
              Original
            </span>
          </div>
          <div
            className="reflexa-proofread-diff-view__text"
            data-testid="original-text"
          >
            {originalSegments.map((segment, idx) => {
              if (!segment.isHighlight) {
                return <span key={idx}>{segment.text}</span>;
              }

              const correction = corrections[segment.correctionIndex!];
              const changeType = categorizeChange(
                correction.original,
                correctedText.substring(
                  correction.startIndex,
                  correction.endIndex
                )
              );

              return (
                <span
                  key={idx}
                  className={`reflexa-proofread-diff-view__highlight reflexa-proofread-diff-view__highlight--${changeType} reflexa-proofread-diff-view__highlight--original`}
                  data-testid={`highlight-original-${segment.correctionIndex}`}
                  onMouseEnter={() => setHoveredIndex(segment.correctionIndex!)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  role="mark"
                  aria-label={`${changeType} correction`}
                >
                  {segment.text}
                  {hoveredIndex === segment.correctionIndex && (
                    <span
                      className="reflexa-proofread-diff-view__tooltip"
                      role="tooltip"
                      data-testid={`tooltip-${segment.correctionIndex}`}
                    >
                      <span className="reflexa-proofread-diff-view__tooltip-type">
                        {changeType.charAt(0).toUpperCase() +
                          changeType.slice(1)}
                      </span>
                      <span className="reflexa-proofread-diff-view__tooltip-text">
                        Original text
                      </span>
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        {/* Corrected Text Column */}
        <div className="reflexa-proofread-diff-view__column">
          <div className="reflexa-proofread-diff-view__column-header">
            <span className="reflexa-proofread-diff-view__column-icon">✨</span>
            <span className="reflexa-proofread-diff-view__column-title">
              Corrected
            </span>
          </div>
          <div
            className="reflexa-proofread-diff-view__text"
            data-testid="corrected-text"
          >
            {correctedSegments.map((segment, idx) => {
              if (!segment.isHighlight) {
                return <span key={idx}>{segment.text}</span>;
              }

              const correction = corrections[segment.correctionIndex!];
              const changeType = categorizeChange(
                correction.original,
                correctedText.substring(
                  correction.startIndex,
                  correction.endIndex
                )
              );

              return (
                <span
                  key={idx}
                  className={`reflexa-proofread-diff-view__highlight reflexa-proofread-diff-view__highlight--${changeType} reflexa-proofread-diff-view__highlight--corrected`}
                  data-testid={`highlight-corrected-${segment.correctionIndex}`}
                  onMouseEnter={() => setHoveredIndex(segment.correctionIndex!)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  role="mark"
                  aria-label={`${changeType} correction`}
                >
                  {segment.text}
                  {hoveredIndex === segment.correctionIndex && (
                    <span
                      className="reflexa-proofread-diff-view__tooltip"
                      role="tooltip"
                      data-testid={`tooltip-corrected-${segment.correctionIndex}`}
                    >
                      <span className="reflexa-proofread-diff-view__tooltip-type">
                        {changeType.charAt(0).toUpperCase() +
                          changeType.slice(1)}
                      </span>
                      <span className="reflexa-proofread-diff-view__tooltip-text">
                        Suggested correction
                      </span>
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="reflexa-proofread-diff-view__actions">
        <button
          type="button"
          className="reflexa-proofread-diff-view__button reflexa-proofread-diff-view__button--discard"
          onClick={onDiscard}
          data-testid="discard-button"
          aria-label="Keep original text"
        >
          <span className="reflexa-proofread-diff-view__button-icon">✕</span>
          <span className="reflexa-proofread-diff-view__button-label">
            Keep Original
          </span>
        </button>
        <button
          type="button"
          className="reflexa-proofread-diff-view__button reflexa-proofread-diff-view__button--accept"
          onClick={onAccept}
          data-testid="accept-button"
          aria-label="Apply corrections"
        >
          <span className="reflexa-proofread-diff-view__button-icon">✓</span>
          <span className="reflexa-proofread-diff-view__button-label">
            Apply Corrections
          </span>
        </button>
      </div>
    </div>
  );
};
