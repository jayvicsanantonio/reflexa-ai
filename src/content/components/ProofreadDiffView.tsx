import React, { useState } from 'react';
import type { ProofreadResult } from '../../types';
import {
  Header,
  TextColumn,
  ActionButtons,
} from './ProofreadDiffView/components';
import { getTextSegments } from './ProofreadDiffView/utils';

interface ProofreadDiffViewProps {
  original: string;
  result: ProofreadResult;
  onAccept: () => void;
  onDiscard: () => void;
}

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

  const originalSegments = getTextSegments(original, corrections);
  const correctedSegments = getTextSegments(correctedText, corrections);

  return (
    <div
      className="flex w-full animate-[fadeIn_0.3s_ease-in-out] flex-col gap-5 rounded-3xl border border-white/10 bg-white/3 p-6 motion-reduce:animate-none sm:gap-4 sm:p-4"
      data-testid="proofread-diff-view"
      role="region"
      aria-label="Proofreading results"
    >
      <Header correctionCount={corrections.length} />

      <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-1 sm:gap-5">
        <TextColumn
          title="Original"
          icon="📝"
          segments={originalSegments}
          corrections={corrections}
          correctedText={correctedText}
          hoveredIndex={hoveredIndex}
          onHoverChange={setHoveredIndex}
          isOriginal
          testIdPrefix="original"
        />
        <TextColumn
          title="Corrected"
          icon="✨"
          segments={correctedSegments}
          corrections={corrections}
          correctedText={correctedText}
          hoveredIndex={hoveredIndex}
          onHoverChange={setHoveredIndex}
          testIdPrefix="corrected"
        />
      </div>

      <ActionButtons onAccept={onAccept} onDiscard={onDiscard} />
    </div>
  );
};
