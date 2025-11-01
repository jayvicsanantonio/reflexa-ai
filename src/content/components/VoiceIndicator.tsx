import React from 'react';

interface VoiceIndicatorProps {
  isRecording: boolean;
  reduceMotion?: boolean;
}

export const VoiceIndicator: React.FC<VoiceIndicatorProps> = ({
  isRecording,
  reduceMotion = false,
}) => {
  if (!isRecording) {
    return null;
  }

  return (
    <div
      className="reflexa-voice-indicator"
      role="status"
      aria-live="polite"
      aria-label="Voice recording in progress"
    >
      <span
        className={`reflexa-voice-indicator-dot ${reduceMotion ? 'reduce-motion' : ''}`}
        aria-hidden="true"
      />
      <span className="reflexa-voice-indicator-text">Recording...</span>
    </div>
  );
};
