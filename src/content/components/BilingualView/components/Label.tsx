/**
 * Label Component
 * Language label for content sections
 */

import React from 'react';

interface LabelProps {
  language: string;
  label: 'Original' | 'Translation';
}

export const Label: React.FC<LabelProps> = ({ language, label }) => (
  <div
    style={{
      fontSize: 11,
      color: 'rgba(226, 232, 240, 0.6)',
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }}
  >
    {label} ({language})
  </div>
);
