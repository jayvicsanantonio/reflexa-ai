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
    className="flex flex-col gap-3"
    aria-label="Quick actions"
    role="group"
    aria-hidden={!open}
  >
    <button
      type="button"
      className="-webkit-backdrop-blur-[12px] relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-[12px] transition-all duration-200 hover:scale-110 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 active:scale-95 [&_.reflexa-nudge-quick-tooltip]:opacity-0 [&_svg]:h-6 [&_svg]:w-6 [&:hover_.reflexa-nudge-quick-tooltip]:opacity-100"
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
      <span
        className="reflexa-nudge-quick-tooltip pointer-events-none absolute left-full ml-3 rounded-lg border border-white/10 bg-slate-900/95 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-opacity duration-200"
        role="tooltip"
      >
        Open dashboard
      </span>
    </button>
    <button
      type="button"
      className="-webkit-backdrop-blur-[12px] relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-[12px] transition-all duration-200 hover:scale-110 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 active:scale-95 [&_.reflexa-nudge-quick-tooltip]:opacity-0 [&_svg]:h-6 [&_svg]:w-6 [&:hover_.reflexa-nudge-quick-tooltip]:opacity-100"
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
      <span
        className="reflexa-nudge-quick-tooltip pointer-events-none absolute left-full ml-3 rounded-lg border border-white/10 bg-slate-900/95 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-opacity duration-200"
        role="tooltip"
      >
        AI Status
      </span>
    </button>
    <button
      type="button"
      className="-webkit-backdrop-blur-[12px] relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-[12px] transition-all duration-200 hover:scale-110 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 active:scale-95 [&_.reflexa-nudge-quick-tooltip]:opacity-0 [&_svg]:h-6 [&_svg]:w-6 [&:hover_.reflexa-nudge-quick-tooltip]:opacity-100"
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
      <span
        className="reflexa-nudge-quick-tooltip pointer-events-none absolute left-full ml-3 rounded-lg border border-white/10 bg-slate-900/95 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-opacity duration-200"
        role="tooltip"
      >
        Settings
      </span>
    </button>
  </div>
);
