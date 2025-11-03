/**
 * Dropdown Trigger Component
 * Button that opens/closes the format dropdown
 */

import React from 'react';

interface DropdownTriggerProps {
  isOpen: boolean;
  disabled: boolean;
  icon: string;
  label: string;
  onToggle: () => void;
}

export const DropdownTrigger: React.FC<DropdownTriggerProps> = ({
  isOpen,
  disabled,
  icon,
  label,
  onToggle,
}) => {
  const baseClasses =
    'flex items-center gap-2 px-4 py-2.5 bg-white/8 border border-white/20 rounded-2xl text-(--color-zen-100) font-sans text-sm font-medium cursor-pointer transition-all duration-200 min-w-[180px]';
  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed'
    : 'hover:bg-white/12 hover:border-sky-400/40 hover:-translate-y-0.5 active:translate-y-0';
  const openClasses = isOpen ? 'bg-white/12 border-(--color-zen-400)' : '';
  const focusClasses =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-(--color-zen-400) focus-visible:outline-offset-2';
  const motionClasses =
    'motion-reduce:hover:translate-y-0 motion-reduce:transition-none';

  return (
    <button
      type="button"
      className={`${baseClasses} ${disabledClasses} ${openClasses} ${focusClasses} ${motionClasses}`}
      onClick={onToggle}
      disabled={disabled}
      aria-label="Select summary format"
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      data-testid="summary-format-trigger"
    >
      <span className="text-lg leading-none text-(--color-zen-400)">
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
      <span
        className={`text-[10px] text-(--color-calm-400) transition-transform duration-200 motion-reduce:transition-none ${
          isOpen ? 'rotate-180' : ''
        }`}
      >
        ▼
      </span>
    </button>
  );
};
