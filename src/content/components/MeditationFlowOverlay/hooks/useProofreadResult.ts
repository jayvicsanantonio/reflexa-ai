/**
 * Hook for managing proofread result state
 * Handles result display, accept, and discard actions for proofreading
 */

import { useState, useCallback } from 'react';
import type { ProofreadResult } from '../../../../types';

/**
 * State representing a proofread result
 */
export interface ProofreadResultState {
  index: number;
  result: ProofreadResult;
}

/**
 * Return type for useProofreadResult hook
 */
export interface UseProofreadResultResult {
  result: ProofreadResultState | null;
  setResult: (result: ProofreadResultState | null) => void;
  acceptProofread: (index: 0 | 1) => string | null;
  discardProofread: () => void;
}

/**
 * Custom hook for managing proofread result state with accept/discard actions
 *
 * @example
 * ```tsx
 * const { result, setResult, acceptProofread, discardProofread } = useProofreadResult();
 *
 * // Set a result
 * setResult({ index: 0, result: { correctedText: 'Hello', corrections: [] } });
 *
 * // Accept the proofread (returns corrected text and clears result)
 * const correctedText = acceptProofread(0);
 *
 * // Or discard the proofread (clears result)
 * discardProofread();
 * ```
 */
export function useProofreadResult(): UseProofreadResultResult {
  const [result, setResult] = useState<ProofreadResultState | null>(null);

  /**
   * Accept the current proofread result for the given index
   * Returns the corrected text if a result exists for that index, null otherwise
   * Clears the result state after accepting
   */
  const acceptProofread = useCallback(
    (index: 0 | 1): string | null => {
      if (result?.index !== index) {
        return null;
      }

      const correctedText = result.result.correctedText;
      setResult(null);
      return correctedText;
    },
    [result]
  );

  /**
   * Discard the current proofread result
   * Clears the result state without returning any text
   */
  const discardProofread = useCallback((): void => {
    setResult(null);
  }, []);

  return {
    result,
    setResult,
    acceptProofread,
    discardProofread,
  };
}
