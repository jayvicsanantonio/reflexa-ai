/**
 * Lotus Button Component
 * The main lotus nudge button
 */

import React from 'react';
import type { LotusNudgePosition } from '../types';
import { LotusIcon } from './LotusIcon';

interface LotusButtonProps {
  position: LotusNudgePosition;
  open: boolean;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onAnimationEnd: (e: React.AnimationEvent) => void;
}

export const LotusButton: React.FC<LotusButtonProps> = ({
  open,
  onClick,
  onKeyDown,
  onAnimationEnd,
}) => (
  <button
    onClick={onClick}
    onKeyDown={onKeyDown}
    onAnimationEnd={onAnimationEnd}
    className="flex h-16 w-16 animate-[fadeIn_1s_ease-in-out,pulseGentle_2s_ease-in-out_infinite_1s] cursor-pointer items-center justify-center rounded-full border-none bg-gradient-to-br from-sky-500 to-sky-700 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-[transform,box-shadow] duration-200 hover:scale-110 hover:shadow-[0_6px_20px_rgba(14,165,233,0.4)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-sky-500 active:scale-95 motion-reduce:animate-[fadeIn_0.3s_ease-in-out] motion-reduce:hover:scale-100 [&_svg]:h-[60px] [&_svg]:w-[60px] [&_svg]:transition-[width,height] [&_svg]:duration-200 [&[data-open='true']_svg]:h-12 [&[data-open='true']_svg]:w-12"
    role="button"
    aria-haspopup="menu"
    aria-expanded={open}
    aria-label="Start reflection session. Press Enter or Space to begin."
    data-testid="lotus-nudge"
    data-open={open ? 'true' : 'false'}
    tabIndex={0}
  >
    <LotusIcon />
    <span className="absolute text-sm font-medium text-white">Reflect</span>
  </button>
);
