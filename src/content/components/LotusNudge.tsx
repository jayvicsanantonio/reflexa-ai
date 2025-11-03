import React, { useState } from 'react';
import { createKeyboardHandler } from '../../utils/accessibility';
import { QuickActions, LotusButton } from './LotusNudge/components';
import { useActionHandlers } from './LotusNudge/hooks';
import { getWrapperPadding } from './LotusNudge/utils/getWrapperPadding';
import type { LotusNudgePosition } from './LotusNudge/types';

export type { LotusNudgePosition } from './LotusNudge/types';

interface LotusNudgeProps {
  onClick: () => void;
  visible: boolean;
  position?: LotusNudgePosition;
  onAnimationComplete?: () => void;
  onHelp?: () => void;
  onSettings?: () => void;
  onDashboard?: () => void;
  quickActionsCount?: number;
}

/**
 * Floating lotus icon that appears when dwell threshold is reached
 * Provides a gentle nudge to encourage reflection
 */
export const LotusNudge: React.FC<LotusNudgeProps> = ({
  onClick,
  visible,
  position = 'bottom-left',
  onAnimationComplete,
  onHelp,
  onSettings,
  onDashboard,
  quickActionsCount = 3,
}) => {
  const [open, setOpen] = useState(false);

  const handleAnimationEnd = (e: React.AnimationEvent) => {
    if (e.animationName === 'fadeIn' && onAnimationComplete) {
      onAnimationComplete();
    }
  };

  const handleKeyDown = createKeyboardHandler(onClick);

  const handleMouseEnter = () => setOpen(true);
  const handleMouseLeave = () => setOpen(false);
  const handleFocus = () => setOpen(true);
  const handleBlur = () => setOpen(false);

  const { openSettings, openDashboard, openHelp } = useActionHandlers({
    onSettings,
    onDashboard,
    onHelp,
  });

  if (!visible) return null;

  const wrapperPadStyle = getWrapperPadding(position, quickActionsCount);

  return (
    <div
      className={`fixed z-[999999] transition-all duration-300 ${
        position === 'bottom-right'
          ? 'right-8 bottom-8'
          : position === 'bottom-left'
            ? 'bottom-8 left-8'
            : position === 'top-right'
              ? 'top-8 right-8'
              : 'top-8 left-8'
      } ${open ? '[&_svg]:h-12 [&_svg]:w-12' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      data-open={open ? 'true' : 'false'}
      style={wrapperPadStyle}
    >
      <QuickActions
        open={open}
        position={position}
        onOpenDashboard={openDashboard}
        onOpenHelp={openHelp}
        onOpenSettings={openSettings}
      />
      <LotusButton
        position={position}
        open={open}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        onAnimationEnd={handleAnimationEnd}
      />
    </div>
  );
};
