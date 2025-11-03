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
}) => {
  const getHighlightClasses = (changeType: string, isOriginal: boolean) => {
    const base =
      'relative px-1 py-0.5 rounded-sm cursor-help transition-[background-color,transform] duration-200 animate-[highlightFadeIn_0.4s_ease-in-out] motion-reduce:animate-none hover:scale-[1.02] motion-reduce:hover:scale-100';

    if (isOriginal) {
      if (changeType === 'grammar') {
        return `${base} bg-red-500/15 border-b-2 border-b-red-500/50`;
      }
      if (changeType === 'clarity') {
        return `${base} bg-blue-500/15 border-b-2 border-b-blue-500/50`;
      }
      if (changeType === 'spelling') {
        return `${base} bg-orange-500/15 border-b-2 border-b-orange-500/50`;
      }
    } else {
      return `${base} bg-emerald-500/15 border-b-2 border-b-emerald-500/50`;
    }
    return base;
  };

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-2 border-b border-b-white/10 pb-2">
        <span className="text-base leading-none">{icon}</span>
        <span className="font-sans text-[13px] font-semibold tracking-wide text-(--color-calm-400) uppercase">
          {title}
        </span>
      </div>
      <div
        className="min-h-[120px] rounded-2xl border border-white/5 bg-white/2 p-4 font-serif text-[15px] leading-[1.7] break-words whitespace-pre-wrap text-(--color-calm-100) sm:min-h-[100px] sm:p-3 sm:text-sm"
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
              className={getHighlightClasses(changeType, isOriginal)}
              data-testid={`highlight-${testIdPrefix}-${segment.correctionIndex}`}
              onMouseEnter={() => onHoverChange(segment.correctionIndex!)}
              onMouseLeave={() => onHoverChange(null)}
              role="mark"
              aria-label={`${changeType} correction`}
            >
              {segment.text}
              {hoveredIndex === segment.correctionIndex && (
                <span
                  className="pointer-events-none absolute bottom-full left-1/2 z-[1000] mb-2 flex -translate-x-1/2 animate-[tooltipFadeIn_0.2s_ease-in-out] flex-col gap-1 rounded-sm border border-white/20 bg-slate-900/98 px-3 py-2 whitespace-nowrap shadow-[0_4px_12px_rgba(0,0,0,0.4)] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[6px] after:border-transparent after:border-t-slate-900/98 after:content-[''] motion-reduce:animate-none"
                  role="tooltip"
                  data-testid={`tooltip-${testIdPrefix}-${segment.correctionIndex}`}
                >
                  <span className="font-sans text-[11px] font-bold tracking-wide text-(--color-zen-400) uppercase">
                    {changeType.charAt(0).toUpperCase() + changeType.slice(1)}
                  </span>
                  <span className="font-sans text-xs text-(--color-calm-100)">
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
};
