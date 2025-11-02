/**
 * Lotus Orb Component
 * Breathing meditation orb with animated lotus flower
 */

import React from 'react';
import { LotusIcon } from './components';
import { getOrbStyle, getRingStyle } from './utils';

interface LotusOrbProps {
  enabled?: boolean;
  duration?: number;
  iterations?: number;
  size?: number;
}

export const LotusOrb: React.FC<LotusOrbProps> = ({
  enabled = true,
  duration = 8,
  iterations = Infinity,
  size = 200,
}) => {
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: size,
    height: size,
    margin: '0 auto',
  };

  const orbStyle = getOrbStyle(enabled, size, duration, iterations);
  const ringStyle = getRingStyle(enabled, duration, iterations);

  return (
    <div style={containerStyle}>
      {/* Blue pulsing orb background */}
      <div style={orbStyle} />

      {/* Pulsing ring at peak expansion */}
      <div style={ringStyle} />

      {/* Lotus flower SVG */}
      <LotusIcon
        size={size}
        enabled={enabled}
        duration={duration}
        iterations={iterations}
      />
    </div>
  );
};
