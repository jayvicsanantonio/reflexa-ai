/**
 * Hook for managing reflection state
 * Handles step navigation, answers, rewrite preview, and proofread results
 */

import { useState, useCallback } from 'react';
import type { ProofreadResult } from '../../../../types';

export interface UseReflectionStateReturn {
  step: number;
  setStep: (step: number | ((prev: number) => number)) => void;
  answers: string[];
  setAnswers: (answers: string[] | ((prev: string[]) => string[])) => void;
  rewritePreview: {
    index: number;
    original: string;
    rewritten: string;
  } | null;
  setRewritePreview: (
    preview: {
      index: number;
      original: string;
      rewritten: string;
    } | null
  ) => void;
  proofreadResult: {
    index: number;
    result: ProofreadResult;
  } | null;
  setProofreadResult: (
    result: { index: number; result: ProofreadResult } | null
  ) => void;
  isProofreading: boolean[];
  setIsProofreading: (
    state: boolean[] | ((prev: boolean[]) => boolean[])
  ) => void;
  prev: () => void;
  next: () => void;
}

export function useReflectionState(
  maxStep = 3,
  isLoadingSummary = false
): UseReflectionStateReturn {
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<string[]>(['', '']);
  const [rewritePreview, setRewritePreview] = useState<{
    index: number;
    original: string;
    rewritten: string;
  } | null>(null);
  const [proofreadResult, setProofreadResult] = useState<{
    index: number;
    result: ProofreadResult;
  } | null>(null);
  const [isProofreading, setIsProofreading] = useState<boolean[]>([
    false,
    false,
  ]);

  const prev = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const next = useCallback(() => {
    // Don't advance from step 0 if still loading summary
    if (step === 0 && isLoadingSummary) return;
    setStep((s) => Math.min(maxStep, s + 1));
  }, [step, isLoadingSummary, maxStep]);

  return {
    step,
    setStep,
    answers,
    setAnswers,
    rewritePreview,
    setRewritePreview,
    proofreadResult,
    setProofreadResult,
    isProofreading,
    setIsProofreading,
    prev,
    next,
  };
}
