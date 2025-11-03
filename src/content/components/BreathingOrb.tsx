import React from 'react';

interface BreathingOrbProps {
  enabled?: boolean;
  duration?: number;
  size?: number;
  mode?: 'pulse' | 'box' | 'smooth';
  iterations?: number;
}

/**
 * Breathing orb animation component for Reflect Mode
 * Provides a calming visual element with 7-second breathing cycle
 * Respects user preferences for reduced motion
 * Memoized to prevent unnecessary re-renders
 */
export const BreathingOrb: React.FC<BreathingOrbProps> = React.memo(
  ({
    enabled = true,
    duration = 7,
    size = 120,
    mode = 'pulse',
    iterations,
  }) => {
    const iterationValue =
      iterations === Infinity ? 'infinite' : String(iterations ?? 2);

    const animationClass = enabled
      ? mode === 'box'
        ? 'animate-[breathingBox_16s_linear_infinite]'
        : mode === 'pulse'
          ? 'animate-[breathingPulse_var(--orbDur,8s)_cubic-bezier(0.22,0.9,0.2,1)_var(--orbIter,2)_both] motion-reduce:animate-none'
          : 'animate-[breathing_7s_ease-in-out_infinite] motion-reduce:animate-none'
      : '';

    const orbClasses = `w-[120px] h-[120px] rounded-full bg-[radial-gradient(circle_at_30%_30%,#38bdf8_0%,#0ea5e9_40%,#0284c7_100%)] shadow-[0_0_40px_rgba(14,165,233,0.4),inset_0_0_20px_rgba(255,255,255,0.2)] relative ${animationClass}`;

    const styleVars: React.CSSProperties & {
      ['--orbDur']?: string;
      ['--orbIter']?: string;
    } = {
      width: `${size}px`,
      height: `${size}px`,
      animationDuration: enabled ? `${duration}s` : undefined,
      animationIterationCount:
        enabled && iterations ? iterationValue : undefined,
      '--orbDur': enabled ? `${duration}s` : undefined,
      '--orbIter': enabled ? iterationValue : undefined,
    };

    return (
      <div
        className="flex w-full items-center justify-center py-12"
        role="presentation"
        aria-hidden="true"
        data-testid="breathing-orb"
      >
        <div className={orbClasses} style={styleVars}>
          {mode === 'pulse' && enabled && (
            <div
              className="pointer-events-none absolute -inset-2 animate-[ringPulse_var(--orbDur,8s)_cubic-bezier(0.22,0.9,0.2,1)_var(--orbIter,2)_both] rounded-full border-2 border-sky-400/90 opacity-0 shadow-[0_0_18px_rgba(96,165,250,0.45)] motion-reduce:animate-none"
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    );
  }
);
