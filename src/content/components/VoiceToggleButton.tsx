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
      title={tooltipText}
      data-testid="voice-toggle-button"
    >
      {isRecording ? (
        <>
          <span
            className="reflexa-voice-toggle-button__indicator"
            aria-hidden="true"
          />
          <span className="reflexa-voice-toggle-button__text">
            Recording...
          </span>
        </>
      ) : (
        <span className="reflexa-voice-toggle-button__icon" aria-hidden="true">
          🎤
        </span>
      )}
    </button>
  );
};
