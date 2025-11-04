/**
 * Tone Icon Component
 * SVG icons for different tone presets
 */

import React from 'react';
import { Smile, ArrowRight, Heart, GraduationCap } from 'lucide-react';

interface ToneIconProps {
  type: string;
}

export const ToneIcon: React.FC<ToneIconProps> = ({ type }) => {
  switch (type) {
    case 'calm':
      return <Smile size={16} strokeWidth={2} />;
    case 'concise':
      return <ArrowRight size={16} strokeWidth={2} />;
    case 'empathetic':
      return <Heart size={16} strokeWidth={2} />;
    case 'academic':
      return <GraduationCap size={16} strokeWidth={2} />;
    default:
      return null;
  }
};
