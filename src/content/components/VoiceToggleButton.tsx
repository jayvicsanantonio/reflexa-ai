import React from 'react';
import '../styles.css';

interface VoiceToggleButtonProps {
  isRecording: boolean;
  onToggle: () => void;
  disabled?: boolean;
  language?: string;
  languageName?: string; // Human-readable language name
  isLanguageFallback?: boolean; // True if using fallback language
  reduceMotion?: boolean;
}

/**
 * Voice Toggle Button Component
 * Allows users to start/stop voice input for reflection text
 * Includes recording state visualization, accessibility features, and reduce motion support
 */
export const VoiceToggleButton: React.FC<VoiceToggleButtonProps> = ({
  isRecording,
  onToggle,
  disabled = false,
  language,
  languageName,
  isLanguageFallback = false,
  reduceMotion = false,
}) => {
  const handleClick = () => {
    if (!disabled) {
      onToggle();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  const ariaLabel = isRecording ? 'Stop voice input' : 'Start voice input';

  // Build tooltip text with language information
  let tooltipText = 'Voice input';
  if (languageName) {
    tooltipText = `Voice input (${languageName})`;
    if (isLanguageFallback) {
      tooltipText += ' - Using fallback language';
    }
  } else if (language) {
    tooltipText = `Voice input (${language})`;
  }

  return (
    <button
      type="button"
      className={`reflexa-voice-toggle-button ${
        isRecording ? 'reflexa-voice-toggle-button--recording' : ''
      } ${disabled ? 'reflexa-voice-toggle-button--disabled' : ''} ${
        reduceMotion ? 'reflexa-voice-toggle-button--reduce-motion' : ''
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={ariaLabel}
      title={isRecording ? 'Click to stop recording' : tooltipText}
      data-testid="voice-toggle-button"
    >
      <svg
        className="reflexa-voice-toggle-button__icon"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
      {isRecording && (
        <span
          className="reflexa-voice-toggle-button__indicator"
          aria-hidden="true"
        />
      )}
    </button>
  );
};
