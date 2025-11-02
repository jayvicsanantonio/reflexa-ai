/**
 * Quick Actions Component
 * Quick action buttons (Dashboard, Help, Settings)
 */

import React from 'react';
import type { LotusNudgePosition } from '../types';
import { IconScreen, IconBrain, IconGear } from '../icons';

interface QuickActionsProps {
  open: boolean;
  position: LotusNudgePosition;
  onOpenDashboard: () => void;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  open,
  onOpenDashboard,
  onOpenHelp,
  onOpenSettings,
}) => (
  <div
    className="reflexa-nudge-quick"
    aria-label="Quick actions"
    role="group"
    aria-hidden={!open}
  >
    <button
      type="button"
      className="reflexa-nudge-quick__btn"
      title="Open dashboard"
      aria-label="Open dashboard"
      aria-hidden={!open}
      tabIndex={open ? 0 : -1}
      onClick={(event) => {
        event.stopPropagation();
        onOpenDashboard();
      }}
    >
      {IconScreen}
      <span className="reflexa-nudge-quick__tooltip" role="tooltip">
        Open dashboard
      </span>
    </button>
    <button
      type="button"
      className="reflexa-nudge-quick__btn"
      title="AI Status"
      aria-label="AI Status"
      aria-hidden={!open}
      tabIndex={open ? 0 : -1}
      onClick={(event) => {
        event.stopPropagation();
        onOpenHelp();
      }}
    >
      {IconBrain}
      <span className="reflexa-nudge-quick__tooltip" role="tooltip">
        AI Status
      </span>
    </button>
    <button
      type="button"
      className="reflexa-nudge-quick__btn"
      title="Settings"
      aria-label="Open settings"
      aria-hidden={!open}
      tabIndex={open ? 0 : -1}
      onClick={(event) => {
        event.stopPropagation();
        onOpenSettings();
      }}
    >
      {IconGear}
      <span className="reflexa-nudge-quick__tooltip" role="tooltip">
        Settings
      </span>
    </button>
  </div>
);
