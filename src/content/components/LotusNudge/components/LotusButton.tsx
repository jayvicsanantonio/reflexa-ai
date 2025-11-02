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
  position,
  open,
  onClick,
  onKeyDown,
  onAnimationEnd,
}) => (
  <button
    onClick={onClick}
    onKeyDown={onKeyDown}
    onAnimationEnd={onAnimationEnd}
    className={`reflexa-lotus-nudge reflexa-lotus-nudge--${position}`}
    role="button"
    aria-haspopup="menu"
    aria-expanded={open}
    aria-label="Start reflection session. Press Enter or Space to begin."
    data-testid="lotus-nudge"
    tabIndex={0}
  >
    <LotusIcon />
    <span className="reflexa-lotus-nudge__label">Reflect</span>
  </button>
);
