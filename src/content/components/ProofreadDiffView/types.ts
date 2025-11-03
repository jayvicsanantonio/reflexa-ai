/**
 * ProofreadDiffView Types
 * Type definitions for ProofreadDiffView component
 */

export interface TextSegment {
  text: string;
  isHighlight: boolean;
  correctionIndex?: number;
}
