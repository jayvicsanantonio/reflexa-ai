import React from 'react';

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

  const baseClasses =
    'inline-flex items-center justify-center gap-1.5 w-9 h-9 p-0 bg-transparent border border-white/15 rounded-lg text-white/70 cursor-pointer transition-[background-color,border-color,color] duration-200 select-none relative focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 focus-visible:outline-offset-2';

  const recordingClasses = isRecording
    ? 'bg-red-500/12 border-red-500/40 text-red-500'
    : '';

  const disabledClasses = disabled
    ? 'opacity-40 cursor-not-allowed pointer-events-none'
    : '';

  const motionClasses = reduceMotion ? '[&_.indicator]:animate-none' : '';

  return (
    <button
      type="button"
      className={`${baseClasses} ${recordingClasses} ${disabledClasses} ${motionClasses} sm:h-8 sm:w-8 motion-reduce:[&_.indicator]:animate-none [&_svg]:sm:h-[18px] [&_svg]:sm:w-[18px]`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={ariaLabel}
      title={isRecording ? 'Click to stop recording' : tooltipText}
      data-testid="voice-toggle-button"
    >
      <svg
        className="flex h-5 w-5 flex-shrink-0 items-center justify-center"
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
          className={`indicator absolute top-1 right-1 h-2 w-2 animate-[voicePulse_1.5s_ease-in-out_infinite] rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)] ${reduceMotion ? 'animate-none opacity-100' : ''}`}
          aria-hidden="true"
        />
      )}
    </button>
  );
};
