/**
 * Menu Trigger Component
 * The button that opens/closes the More Tools menu
 */

import React from 'react';

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
    className="reflexa-more-tools__trigger"
    onClick={(e) => {
      console.log('[MoreToolsMenu] Trigger clicked, isOpen:', isOpen);
      e.stopPropagation();
      onClick(e);
    }}
    aria-label="More tools"
    aria-expanded={isOpen}
    aria-haspopup="true"
    data-testid="more-tools-trigger"
  >
    <svg
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
