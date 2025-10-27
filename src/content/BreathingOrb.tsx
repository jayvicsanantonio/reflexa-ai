import React from 'react';
import './BreathingOrb.css';

interface BreathingOrbProps {
  enabled?: boolean;
  duration?: number;
  size?: number;
}

/**
 * Breathing orb animation component for Reflect Mode
 * Provides a calming visual element with 7-second breathing cycle
 * Respects user preferences for reduced motion
 */
export const BreathingOrb: React.FC<BreathingOrbProps> = ({
  enabled = true,
  duration = 7,
  size = 120,
}) => {
  return (
    <div
      className="reflexa-breathing-orb-container"
      role="presentation"
      aria-hidden="true"
      data-testid="breathing-orb"
    >
      <div
        className={`reflexa-breathing-orb ${enabled ? 'reflexa-breathing-orb--animated' : ''}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          animationDuration: enabled ? `${duration}s` : undefined,
        }}
      />
    </div>
  );
};
