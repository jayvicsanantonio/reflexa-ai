/**
 * Get Wrapper Padding Utility
 * Calculates padding for wrapper to keep hover stable
 */

import type { LotusNudgePosition } from '../types';

export const getWrapperPadding = (
  position: LotusNudgePosition,
  quickActionsCount: number
): React.CSSProperties => {
  const quickSize = 44; // px
  const quickGap = 12; // px
  const hoverPad = Math.max(
    0,
    quickActionsCount * quickSize + (quickActionsCount - 1) * quickGap
  );
  return position.startsWith('top')
    ? { paddingBottom: `${hoverPad}px` }
    : { paddingTop: `${hoverPad}px` };
};
