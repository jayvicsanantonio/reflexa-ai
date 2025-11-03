import React, { useState } from 'react';
import type { AIResponse } from '../../types';
import { devLog, devError } from '../../utils/logger';

interface StartReflectionButtonProps {
  summary: string[];
  prompts: string[];
  onDraftGenerated: (draft: string) => void;
  disabled?: boolean;
}

/**
 * Start Reflection Button Component
 * Triggers draft generation using Writer API and inserts generated text into reflection input
 * Includes loading spinner and success animation
 */
export const StartReflectionButton: React.FC<StartReflectionButtonProps> = ({
  summary,
  prompts,
  onDraftGenerated,
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClick = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    setShowSuccess(false);

    try {
      // Create prompt from summary and reflection prompts
      const summaryText = summary.join('\n');
      const reflectionPrompt = prompts[0] || 'Reflect on this content';
      const prompt = `Based on this summary:\n${summaryText}\n\nReflection prompt: ${reflectionPrompt}\n\nWrite a reflective paragraph that addresses the reflection prompt.`;

      // Call Writer API via background service worker
      const response: AIResponse<string> = await chrome.runtime.sendMessage({
        type: 'write',
        payload: {
          prompt,
          options: {
            tone: 'neutral', // Maps to 'calm' in WriterOptions
            format: 'plain-text',
            length: 'short', // 50-100 words
          },
        },
      });

      if (response.success) {
        const draft = response.data;
        devLog('[StartReflectionButton] Draft received:', draft);
        devLog('[StartReflectionButton] Draft type:', typeof draft);

        // Show success animation
        setShowSuccess(true);

        // Call callback with generated draft
        onDraftGenerated(draft);

        // Reset success animation after 2 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 2000);
      } else {
        devError('Draft generation failed:', response.error);
        // Could show error state here
      }
    } catch (error) {
      devError('Error generating draft:', error);
      // Could show error state here
    } finally {
      setIsLoading(false);
    }
  };

  const baseClasses =
    'inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-sky-500 to-sky-700 border-none rounded-2xl text-white font-sans text-base font-semibold cursor-pointer transition-[transform,box-shadow,background] duration-200 shadow-[0_4px_12px_rgba(0,0,0,0.08)] min-w-[180px]';

  const hoverClasses =
    'hover:not-disabled:-translate-y-0.5 hover:not-disabled:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:not-disabled:from-sky-400 hover:not-disabled:to-sky-500';

  const activeClasses =
    'active:not-disabled:translate-y-0 active:not-disabled:shadow-[0_2px_6px_rgba(0,0,0,0.05)]';

  const focusClasses =
    'focus-visible:outline focus-visible:outline-3 focus-visible:outline-sky-500 focus-visible:outline-offset-4';

  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed from-slate-500 to-slate-600'
    : '';

  const loadingClasses = isLoading ? 'cursor-wait' : '';

  const successClasses = showSuccess
    ? 'from-emerald-500 to-emerald-600 animate-[successPulse_0.5s_ease-out]'
    : '';

  const motionReduceClasses =
    'motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0 motion-reduce:[&_.spinner-svg]:animate-none';

  return (
    <button
      type="button"
      className={`${baseClasses} ${hoverClasses} ${activeClasses} ${focusClasses} ${disabledClasses} ${loadingClasses} ${successClasses} ${motionReduceClasses}`}
      onClick={handleClick}
      disabled={disabled || isLoading}
      aria-label="Start reflection with AI-generated draft"
      data-testid="start-reflection-button"
    >
      {isLoading ? (
        <>
          <span
            className="flex h-5 w-5 items-center justify-center"
            aria-label="Generating draft"
          >
            <svg
              className="spinner-svg h-full w-full animate-[spin_1s_linear_infinite]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="50"
                strokeDashoffset="25"
                style={{ transformOrigin: 'center' }}
              />
            </svg>
          </span>
          <span className="leading-none">Generating...</span>
        </>
      ) : showSuccess ? (
        <>
          <span className="flex items-center justify-center text-xl leading-none">
            ✓
          </span>
          <span className="leading-none">Draft Inserted!</span>
        </>
      ) : (
        <>
          <span className="flex items-center justify-center text-xl leading-none">
            ✨
          </span>
          <span className="leading-none">Start Reflection</span>
        </>
      )}
    </button>
  );
};
