/**
 * Hook for handling keyboard navigation and shortcuts in the overlay
 * Handles ArrowRight, ArrowLeft, Escape, and Cmd+G shortcuts
 */

import { useEffect, useCallback } from 'react';

/**
 * Configuration for overlay keyboard shortcuts
 */
export interface OverlayKeyboardConfig {
  /** Current step in the overlay flow (0-3) */
  step: number;
  /** Whether the summary is currently loading */
  isLoadingSummary: boolean;
  /** Whether any AI processing is in progress */
  isProcessing: boolean;
  /** Whether the Writer API is available */
  writerAvailable: boolean;
  /** Current answers for reflection inputs */
  answers: string[];
  /** Callback for navigating to next step */
  onNext: () => void;
  /** Callback for navigating to previous step */
  onPrev: () => void;
  /** Callback for canceling/closing the overlay */
  onCancel: () => void;
  /** Callback for generating a draft */
  onGenerateDraft: (index: 0 | 1) => void;
}

/**
 * Result type for the keyboard shortcut handler
 * Used for testing to verify which callback was invoked
 */
export type KeyboardShortcutResult =
  | { action: 'next' }
  | { action: 'prev' }
  | { action: 'cancel' }
  | { action: 'generateDraft'; index: 0 | 1 }
  | { action: 'none' };

/**
 * Determines what action should be taken for a given keyboard event
 * This is a pure function that can be tested independently
 */
export function getKeyboardAction(
  event: { key: string; metaKey: boolean; ctrlKey: boolean },
  config: Omit<
    OverlayKeyboardConfig,
    'onNext' | 'onPrev' | 'onCancel' | 'onGenerateDraft'
  >
): KeyboardShortcutResult {
  const { step, isLoadingSummary, isProcessing, writerAvailable, answers } =
    config;

  // Escape always cancels
  if (event.key === 'Escape') {
    return { action: 'cancel' };
  }

  // ArrowLeft goes to previous step (unless at step 0 or processing)
  if (event.key === 'ArrowLeft') {
    if (step > 0 && !isProcessing) {
      return { action: 'prev' };
    }
    return { action: 'none' };
  }

  // ArrowRight or Enter goes to next step (unless at step 3, loading, or processing)
  if (event.key === 'ArrowRight' || event.key === 'Enter') {
    // Don't advance from step 0 if still loading summary
    if (step === 0 && isLoadingSummary) {
      return { action: 'none' };
    }
    // Don't advance if processing
    if (isProcessing) {
      return { action: 'none' };
    }
    // Don't advance past step 3
    if (step < 3) {
      return { action: 'next' };
    }
    return { action: 'none' };
  }

  // Cmd/Ctrl + G generates draft (only on steps 2 or 3)
  if ((event.metaKey || event.ctrlKey) && event.key === 'g') {
    if ((step === 2 || step === 3) && writerAvailable) {
      const index: 0 | 1 = step === 2 ? 0 : 1;
      // Only generate if the answer is empty
      if (!answers[index]?.trim()) {
        return { action: 'generateDraft', index };
      }
    }
    return { action: 'none' };
  }

  return { action: 'none' };
}

/**
 * Custom hook for handling keyboard navigation and shortcuts in the overlay
 *
 * @example
 * ```tsx
 * useOverlayKeyboardShortcuts({
 *   step: 1,
 *   isLoadingSummary: false,
 *   isProcessing: false,
 *   writerAvailable: true,
 *   answers: ['', ''],
 *   onNext: () => setStep(s => s + 1),
 *   onPrev: () => setStep(s => s - 1),
 *   onCancel: () => closeOverlay(),
 *   onGenerateDraft: (index) => generateDraft(index),
 * });
 * ```
 */
export function useOverlayKeyboardShortcuts(
  config: OverlayKeyboardConfig
): void {
  const {
    step,
    isLoadingSummary,
    isProcessing,
    writerAvailable,
    answers,
    onNext,
    onPrev,
    onCancel,
    onGenerateDraft,
  } = config;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const action = getKeyboardAction(
        { key: e.key, metaKey: e.metaKey, ctrlKey: e.ctrlKey },
        { step, isLoadingSummary, isProcessing, writerAvailable, answers }
      );

      switch (action.action) {
        case 'next':
          e.preventDefault();
          onNext();
          break;
        case 'prev':
          e.preventDefault();
          onPrev();
          break;
        case 'cancel':
          e.preventDefault();
          onCancel();
          break;
        case 'generateDraft':
          e.preventDefault();
          onGenerateDraft(action.index);
          break;
        case 'none':
        default:
          // Do nothing
          break;
      }
    },
    [
      step,
      isLoadingSummary,
      isProcessing,
      writerAvailable,
      answers,
      onNext,
      onPrev,
      onCancel,
      onGenerateDraft,
    ]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
