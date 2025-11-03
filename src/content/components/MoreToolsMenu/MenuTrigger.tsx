/**
 * Menu Trigger Component
 * The button that opens/closes the More Tools menu
 */

import React from 'react';
import { devLog } from '../../../utils/logger';

interface MenuTriggerProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isOpen: boolean;
}

export const MenuTrigger: React.FC<MenuTriggerProps> = ({
  onClick,
  isOpen,
}) => (
  <button
    type="button"
    className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200/25 bg-transparent px-3 py-2 font-sans text-sm font-normal text-slate-200 transition-all duration-200 hover:border-sky-400/40 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
    onClick={(e) => {
      devLog('[MoreToolsMenu] Trigger clicked, isOpen:', isOpen);
      e.stopPropagation();
      onClick(e);
    }}
    aria-label="More tools"
    aria-expanded={isOpen}
    aria-haspopup="true"
    data-testid="more-tools-trigger"
  >
    <svg
      className="h-4 w-4"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
    <span>More</span>
  </button>
);
