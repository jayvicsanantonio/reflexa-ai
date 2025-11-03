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
      className="-webkit-backdrop-blur-[8px] inline-flex animate-[voiceIndicatorFadeIn_0.3s_ease-in-out] items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 font-sans shadow-[0_2px_8px_rgba(239,68,68,0.15)] backdrop-blur-[8px] select-none motion-reduce:animate-[fadeIn_0.15s_ease-in-out]"
      role="status"
      aria-live="polite"
      aria-label="Voice recording in progress"
    >
      <span
        className={`relative h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] ${
          reduceMotion
            ? ''
            : 'animate-[voiceIndicatorPulse_1s_ease-in-out_infinite] [&::before]:absolute [&::before]:top-1/2 [&::before]:left-1/2 [&::before]:h-full [&::before]:w-full [&::before]:-translate-x-1/2 [&::before]:-translate-y-1/2 [&::before]:animate-[voiceIndicatorRing_1s_ease-in-out_infinite] [&::before]:rounded-full [&::before]:bg-red-500 [&::before]:opacity-0 [&::before]:content-[""]'
        }`}
        aria-hidden="true"
      />
      <span className="text-[13px] leading-none font-medium tracking-tight text-red-500 text-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
        Recording...
      </span>
    </div>
  );
};
