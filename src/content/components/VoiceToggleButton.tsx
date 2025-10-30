import React from 'react';
import '../styles.css';

interface VoiceToggleButtonProps {
  isRecording: boolean;
  onToggle: () => void;
  disabled?: boolean;
  language?: string;
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
  const tooltipText = language ? `Voice input (${language})` : 'Voice input';

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
