/**
 * Hook for managing rewrite preview state
 * Handles preview display, accept, and discard actions for text rewrites
 */

import { useState, useCallback } from 'react';

/**
 * State representing a rewrite preview
 */
export interface RewritePreviewState {
  index: number;
  original: string;
  rewritten: string;
}

/**
 * Return type for useRewritePreview hook
 */
export interface UseRewritePreviewResult {
  preview: RewritePreviewState | null;
  setPreview: (preview: RewritePreviewState | null) => void;
  acceptRewrite: () => string | null;
  discardRewrite: () => void;
}

/**
 * Custom hook for managing rewrite preview state with accept/discard actions
 *
 * @example
 * ```tsx
 * const { preview, setPreview, acceptRewrite, discardRewrite } = useRewritePreview();
 *
 * // Set a preview
 * setPreview({ index: 0, original: 'Hello', rewritten: 'Hi there' });
 *
 * // Accept the rewrite (returns rewritten text and clears preview)
 * const rewrittenText = acceptRewrite();
 *
 * // Or discard the rewrite (clears preview)
 * discardRewrite();
 * ```
 */
export function useRewritePreview(): UseRewritePreviewResult {
  const [preview, setPreview] = useState<RewritePreviewState | null>(null);

  /**
   * Accept the current rewrite preview
   * Returns the rewritten text if a preview exists, null otherwise
   * Clears the preview state after accepting
   */
  const acceptRewrite = useCallback((): string | null => {
    if (!preview) {
      return null;
    }

    const rewrittenText = preview.rewritten;
    setPreview(null);
    return rewrittenText;
  }, [preview]);

  /**
   * Discard the current rewrite preview
   * Clears the preview state without returning any text
   */
  const discardRewrite = useCallback((): void => {
    setPreview(null);
  }, []);

  return {
    preview,
    setPreview,
    acceptRewrite,
    discardRewrite,
  };
}
