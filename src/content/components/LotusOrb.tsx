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
  size = 140,
}) => {
  if (!enabled) {
    return (
      <div
        style={{
          width: size,
          height: size,
          margin: '0 auto',
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 140 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <LotusPath opacity={0.6} />
        </svg>
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        margin: '0 auto',
        animation: `lotusPulse ${duration}s ease-in-out ${
          iterations === Infinity ? 'infinite' : iterations
        }`,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 140 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <LotusPath opacity={1} />
      </svg>
    </div>
  );
};

const LotusPath: React.FC<{ opacity: number }> = ({ opacity }) => (
  <g opacity={opacity}>
    {/* Center circle */}
    <circle cx="70" cy="70" r="12" fill="url(#lotusGradient)" />

    {/* Inner petals (4 petals) */}
    <path
      d="M 70 58 Q 62 50 58 42 Q 62 50 70 52 Z"
      fill="url(#petalGradient1)"
      opacity="0.9"
    />
    <path
      d="M 82 70 Q 90 62 98 58 Q 90 62 88 70 Z"
      fill="url(#petalGradient1)"
      opacity="0.9"
    />
    <path
      d="M 70 82 Q 78 90 82 98 Q 78 90 70 88 Z"
      fill="url(#petalGradient1)"
      opacity="0.9"
    />
    <path
      d="M 58 70 Q 50 78 42 82 Q 50 78 52 70 Z"
      fill="url(#petalGradient1)"
      opacity="0.9"
    />

    {/* Outer petals (8 petals) */}
    <path
      d="M 70 52 Q 65 35 62 20 Q 68 35 70 45 Z"
      fill="url(#petalGradient2)"
      opacity="0.8"
    />
    <path
      d="M 78 58 Q 88 45 100 35 Q 88 48 82 58 Z"
      fill="url(#petalGradient2)"
      opacity="0.8"
    />
    <path
      d="M 88 70 Q 100 68 115 65 Q 100 70 90 70 Z"
      fill="url(#petalGradient2)"
      opacity="0.8"
    />
    <path
      d="M 82 82 Q 92 92 105 105 Q 90 92 82 82 Z"
      fill="url(#petalGradient2)"
      opacity="0.8"
    />
    <path
      d="M 70 88 Q 72 105 75 120 Q 70 105 70 95 Z"
      fill="url(#petalGradient2)"
      opacity="0.8"
    />
    <path
      d="M 58 82 Q 48 92 35 105 Q 50 90 58 82 Z"
      fill="url(#petalGradient2)"
      opacity="0.8"
    />
    <path
      d="M 52 70 Q 40 72 25 75 Q 40 70 50 70 Z"
      fill="url(#petalGradient2)"
      opacity="0.8"
    />
    <path
      d="M 58 58 Q 48 48 35 35 Q 52 50 58 58 Z"
      fill="url(#petalGradient2)"
      opacity="0.8"
    />

    {/* Gradients */}
    <defs>
      <radialGradient id="lotusGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
      </radialGradient>
      <linearGradient id="petalGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ec4899" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.7" />
      </linearGradient>
      <linearGradient id="petalGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.6" />
      </linearGradient>
    </defs>
  </g>
);
