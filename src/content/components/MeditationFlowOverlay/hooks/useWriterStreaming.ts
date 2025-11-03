/**
 * Hook for managing writer streaming animation
 * Handles character-by-character animation for writer API responses
 */

import { useState, useRef, useCallback, useEffect } from 'react';

const WRITER_CHAR_STEP = 2;
const WRITER_FRAME_DELAY = 24;

type CleanupFn = (() => void) | undefined;

export interface UseWriterStreamingReturn {
  writerTargetTextRef: React.MutableRefObject<string[]>;
  writerDisplayIndexRef: React.MutableRefObject<number[]>;
  writerAnimationTimerRef: React.MutableRefObject<number[]>;
  writerStreamCleanupRef: React.MutableRefObject<CleanupFn[]>;
  startWriterAnimation: (index: 0 | 1, forceRestart?: boolean) => void;
  setIsDraftGenerating: (
    state: boolean[] | ((prev: boolean[]) => boolean[])
  ) => void;
  isDraftGenerating: boolean[];
}

export function useWriterStreaming(
  setAnswers: (answers: string[] | ((prev: string[]) => string[])) => void,
  lastTextValueRef: React.MutableRefObject<string[]>
): UseWriterStreamingReturn {
  const writerStreamCleanupRef = useRef<CleanupFn[]>([]);
  const writerTargetTextRef = useRef<string[]>(['', '']);
  const writerDisplayIndexRef = useRef<number[]>([0, 0]);
  const writerAnimationTimerRef = useRef<number[]>([0, 0]);
  const [isDraftGenerating, setIsDraftGenerating] = useState<boolean[]>([
    false,
    false,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    const cleanupRef = [...writerStreamCleanupRef.current];
    const timersSnapshot = [...writerAnimationTimerRef.current];
    return () => {
      cleanupRef.forEach((cleanup) => {
        cleanup?.();
      });
      timersSnapshot.forEach((timer, index) => {
        if (timer) {
          window.clearTimeout(timer);
          timersSnapshot[index] = 0;
        }
      });
      writerAnimationTimerRef.current = timersSnapshot;
    };
  }, []);

  const startWriterAnimation = useCallback(
    (index: 0 | 1, forceRestart = false) => {
      const existingTimer = writerAnimationTimerRef.current[index];
      if (existingTimer) {
        if (!forceRestart) {
          return;
        }
        window.clearTimeout(existingTimer);
        writerAnimationTimerRef.current[index] = 0;
      }

      const run = () => {
        const target = writerTargetTextRef.current[index] ?? '';
        const currentPos = writerDisplayIndexRef.current[index] ?? 0;

        if (currentPos >= target.length) {
          writerAnimationTimerRef.current[index] = 0;
          setAnswers((prev) => {
            const next = [...prev];
            next[index] = target;
            return next;
          });
          lastTextValueRef.current[index] = target;
          return;
        }

        const nextPos = Math.min(currentPos + WRITER_CHAR_STEP, target.length);
        writerDisplayIndexRef.current[index] = nextPos;

        const textToShow = target.slice(0, nextPos);
        setAnswers((prev) => {
          const next = [...prev];
          next[index] = textToShow;
          return next;
        });
        lastTextValueRef.current[index] = textToShow;

        writerAnimationTimerRef.current[index] = window.setTimeout(
          run,
          WRITER_FRAME_DELAY
        );
      };

      writerAnimationTimerRef.current[index] = window.setTimeout(run, 0);
    },
    [setAnswers, lastTextValueRef]
  );

  return {
    writerTargetTextRef,
    writerDisplayIndexRef,
    writerAnimationTimerRef,
    writerStreamCleanupRef,
    startWriterAnimation,
    setIsDraftGenerating,
    isDraftGenerating,
  };
}
