import React from 'react';
import './BreathingOrb.css';

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
    return (
      <div
        className="reflexa-breathing-orb-container"
        role="presentation"
        aria-hidden="true"
        data-testid="breathing-orb"
      >
        <div
          className={`reflexa-breathing-orb ${
            enabled
              ? mode === 'box'
                ? 'reflexa-breathing-orb--box'
                : mode === 'pulse'
                  ? 'reflexa-breathing-orb--pulse'
                  : 'reflexa-breathing-orb--animated'
              : ''
          }`}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            animationDuration: enabled ? `${duration}s` : undefined,
            animationIterationCount:
              enabled && iterations ? String(iterations) : undefined,
          }}
        />
      </div>
    );
  }
);
