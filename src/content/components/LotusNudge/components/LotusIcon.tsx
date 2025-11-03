/**
 * Lotus Icon Component
 * The lotus flower SVG icon
 */

import React from 'react';

export const LotusIcon: React.FC = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Lotus flower icon with zen aesthetic */}
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
