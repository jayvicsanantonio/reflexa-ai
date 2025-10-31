import React, { useState } from 'react';
import type { AIResponse } from '../../types';
import '../styles.css';

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
        console.log('[StartReflectionButton] Draft received:', draft);
        console.log('[StartReflectionButton] Draft type:', typeof draft);

        // Show success animation
        setShowSuccess(true);

        // Call callback with generated draft
        onDraftGenerated(draft);

        // Reset success animation after 2 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 2000);
      } else {
        console.error('Draft generation failed:', response.error);
        // Could show error state here
      }
    } catch (error) {
      console.error('Error generating draft:', error);
      // Could show error state here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={`reflexa-start-reflection-button ${
        isLoading ? 'reflexa-start-reflection-button--loading' : ''
      } ${showSuccess ? 'reflexa-start-reflection-button--success' : ''} ${
        disabled ? 'reflexa-start-reflection-button--disabled' : ''
      }`}
      onClick={handleClick}
      disabled={disabled || isLoading}
      aria-label="Start reflection with AI-generated draft"
      data-testid="start-reflection-button"
    >
      {isLoading ? (
        <>
          <span
            className="reflexa-start-reflection-button__spinner"
            aria-label="Generating draft"
          >
            <svg
              className="reflexa-start-reflection-button__spinner-svg"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="reflexa-start-reflection-button__spinner-circle"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="reflexa-start-reflection-button__text">
            Generating...
          </span>
        </>
      ) : showSuccess ? (
        <>
          <span className="reflexa-start-reflection-button__icon">✓</span>
          <span className="reflexa-start-reflection-button__text">
            Draft Inserted!
          </span>
        </>
      ) : (
        <>
          <span className="reflexa-start-reflection-button__icon">✨</span>
          <span className="reflexa-start-reflection-button__text">
            Start Reflection
          </span>
        </>
      )}
    </button>
  );
};
