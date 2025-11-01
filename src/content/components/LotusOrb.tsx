import React from 'react';

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
  const iterationValue =
    iterations === Infinity ? 'infinite' : String(iterations);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: size,
    height: size,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const orbStyle: React.CSSProperties = enabled
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

  // Ring that pulses at peak expansion
  const ringStyle: React.CSSProperties = enabled
    ? {
        content: '""',
        position: 'absolute',
        top: -8,
        left: -8,
        right: -8,
        bottom: -8,
        borderRadius: '50%',
        border: '2px solid rgba(96, 165, 250, 0.9)',
        boxShadow: '0 0 18px rgba(96, 165, 250, 0.45)',
        pointerEvents: 'none',
        opacity: 0,
        animation: `ringPulse ${duration}s cubic-bezier(0.22, 0.9, 0.2, 1) ${iterationValue} both`,
      }
    : {
        display: 'none',
      };

  const lotusContainerStyle: React.CSSProperties = enabled
    ? {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1,
        pointerEvents: 'none',
        animation: `breathingPulse ${duration}s cubic-bezier(0.22, 0.9, 0.2, 1) ${iterationValue} both`,
      }
    : {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1,
        pointerEvents: 'none',
        opacity: 0.6,
      };

  // Make lotus 85% of orb size so it almost touches the edges
  const lotusSize = size * 0.85;

  return (
    <div style={containerStyle}>
      {/* Blue pulsing orb background */}
      <div style={orbStyle} />

      {/* Pulsing ring at peak expansion */}
      <div style={ringStyle} />

      {/* Lotus flower on top, centered */}
      <div style={lotusContainerStyle}>
        <svg
          width={lotusSize}
          height={lotusSize}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          style={{
            display: 'block',
            background: 'transparent',
          }}
        >
          {/* Lotus flower icon with zen aesthetic - same as LotusNudge */}
          {/* Center circle */}
          <circle cx="24" cy="24" r="6" fill="#f0abfc" opacity="1" />

          {/* Petals - arranged in lotus pattern */}
          {/* Top petal */}
          <ellipse
            cx="24"
            cy="12"
            rx="5"
            ry="10"
            fill="#ffffff"
            opacity="0.95"
          />

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
          <ellipse
            cx="24"
            cy="36"
            rx="5"
            ry="10"
            fill="#ffffff"
            opacity="0.95"
          />

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
      </div>
    </div>
  );
};
