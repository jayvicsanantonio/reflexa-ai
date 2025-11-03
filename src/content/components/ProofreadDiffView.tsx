import React, { useState } from 'react';
import type { ProofreadResult } from '../../types';
import '../styles.css';
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
      className="reflexa-proofread-diff-view"
      data-testid="proofread-diff-view"
      role="region"
      aria-label="Proofreading results"
    >
      <Header correctionCount={corrections.length} />

      <div className="reflexa-proofread-diff-view__comparison">
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
