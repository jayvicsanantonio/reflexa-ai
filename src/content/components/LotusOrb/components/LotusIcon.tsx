/**
 * Lotus Icon Component
 * SVG lotus flower icon used in the breathing orb
 */

import React from 'react';

interface LotusIconProps {
  size?: number;
  enabled?: boolean;
  duration?: number;
  iterations?: number;
}

export const LotusIcon: React.FC<LotusIconProps> = ({
  size = 200,
  enabled = true,
  duration = 8,
  iterations = Infinity,
}) => {
  const iterationValue =
    iterations === Infinity ? 'infinite' : String(iterations);

  const svgStyle: React.CSSProperties = enabled
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        width: size,
        height: size,
        zIndex: 1,
        pointerEvents: 'none',
        borderRadius: '50%',
        overflow: 'hidden',
        animation: `breathingPulse ${duration}s cubic-bezier(0.22, 0.9, 0.2, 1) ${iterationValue} both`,
      }
    : {
        position: 'absolute',
        top: 0,
        left: 0,
        width: size,
        height: size,
        zIndex: 1,
        pointerEvents: 'none',
        borderRadius: '50%',
        overflow: 'hidden',
        opacity: 0.6,
      };

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={svgStyle}
    >
      {/* Center circle */}
      <circle cx="24" cy="24" r="6" fill="#f0abfc" opacity="1" />

      {/* Petals - arranged in lotus pattern */}
      {/* Top petal */}
      <ellipse cx="24" cy="12" rx="5" ry="10" fill="#ffffff" opacity="0.95" />

      {/* Top-right petal */}
      <ellipse
        cx="32"
        cy="16"
        rx="5"
        ry="10"
        fill="#ffffff"
        opacity="0.95"
        transform="rotate(45 32 16)"
      />

      {/* Right petal */}
      <ellipse
        cx="36"
        cy="24"
        rx="5"
        ry="10"
        fill="#ffffff"
        opacity="0.95"
        transform="rotate(90 36 24)"
      />

      {/* Bottom-right petal */}
      <ellipse
        cx="32"
        cy="32"
        rx="5"
        ry="10"
        fill="#ffffff"
        opacity="0.95"
        transform="rotate(135 32 32)"
      />

      {/* Bottom petal */}
      <ellipse cx="24" cy="36" rx="5" ry="10" fill="#ffffff" opacity="0.95" />

      {/* Bottom-left petal */}
      <ellipse
        cx="16"
        cy="32"
        rx="5"
        ry="10"
        fill="#ffffff"
        opacity="0.95"
        transform="rotate(-135 16 32)"
      />

      {/* Left petal */}
      <ellipse
        cx="12"
        cy="24"
        rx="5"
        ry="10"
        fill="#ffffff"
        opacity="0.95"
        transform="rotate(-90 12 24)"
      />

      {/* Top-left petal */}
      <ellipse
        cx="16"
        cy="16"
        rx="5"
        ry="10"
        fill="#ffffff"
        opacity="0.95"
        transform="rotate(-45 16 16)"
      />
    </svg>
  );
};
