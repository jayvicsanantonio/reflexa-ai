/**
 * Get Text Segments Utility
 * Splits text into segments with highlights for corrections
 */

import type { ProofreadResult } from '../../../../types';
import type { TextSegment } from '../types';

export const getTextSegments = (
  text: string,
  corrections: ProofreadResult['corrections']
): TextSegment[] => {
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
