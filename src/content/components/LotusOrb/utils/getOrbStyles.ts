/**
 * Utility functions for generating orb styles
 */

import type React from 'react';

export const getOrbStyle = (
  enabled: boolean,
  size: number,
  duration: number,
  iterations: number
): React.CSSProperties => {
  const iterationValue =
    iterations === Infinity ? 'infinite' : String(iterations);

  return enabled
    ? {
        width: size,
        height: size,
        borderRadius: '50%',
        background:
          'radial-gradient(circle at 30% 30%, #38bdf8 0%, #0ea5e9 40%, #0284c7 100%)',
        boxShadow:
          '0 0 40px rgba(14, 165, 233, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.2)',
        animation: `breathingPulse ${duration}s cubic-bezier(0.22, 0.9, 0.2, 1) ${iterationValue} both`,
        position: 'absolute',
        top: 0,
        left: 0,
      }
    : {
        width: size,
        height: size,
        borderRadius: '50%',
        background:
          'radial-gradient(circle at 30% 30%, #38bdf8 0%, #0ea5e9 40%, #0284c7 100%)',
        boxShadow:
          '0 0 40px rgba(14, 165, 233, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.2)',
        opacity: 0.6,
        position: 'absolute',
        top: 0,
        left: 0,
      };
};

export const getRingStyle = (
  enabled: boolean,
  duration: number,
  iterations: number
): React.CSSProperties => {
  const iterationValue =
    iterations === Infinity ? 'infinite' : String(iterations);

  return enabled
    ? {
        content: '""',
        position: 'absolute',
        top: -20,
        left: -20,
        right: -20,
        bottom: -20,
        borderRadius: '50%',
        border: '3px solid rgba(96, 165, 250, 0.9)',
        boxShadow: '0 0 24px rgba(96, 165, 250, 0.5)',
        pointerEvents: 'none',
        opacity: 0,
        animation: `ringPulse ${duration}s cubic-bezier(0.22, 0.9, 0.2, 1) ${iterationValue} both`,
      }
    : {
        display: 'none',
      };
};
