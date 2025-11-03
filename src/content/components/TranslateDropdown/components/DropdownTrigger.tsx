/**
 * Dropdown Trigger Component
 * Button that opens/closes the translation language dropdown
 */

import React from 'react';

interface DropdownTriggerProps {
  isOpen: boolean;
  loading: boolean;
  disabled: boolean;
  onToggle: () => void;
}

export const DropdownTrigger: React.FC<DropdownTriggerProps> = ({
  isOpen,
  loading,
  disabled,
  onToggle,
}) => {
  const baseClasses =
    'flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-(--color-zen-100) font-sans text-sm font-medium cursor-pointer transition-all duration-200 whitespace-nowrap';
  const disabledClasses =
    disabled || loading
      ? 'opacity-50 cursor-not-allowed'
      : 'hover:bg-white/8 hover:border-sky-400/30 hover:-translate-y-0.5 active:translate-y-0';
  const openClasses = isOpen ? 'bg-white/8 border-sky-400/40' : '';
  const focusClasses =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-(--color-zen-400) focus-visible:outline-offset-2';
  const motionClasses =
    'motion-reduce:hover:translate-y-0 motion-reduce:transition-none';

  return (
    <button
      type="button"
      className={`${baseClasses} ${disabledClasses} ${openClasses} ${focusClasses} ${motionClasses}`}
      onClick={onToggle}
      disabled={disabled || loading}
      aria-label="Select translation language"
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      data-testid="translate-trigger"
    >
      <span className="flex items-center justify-center text-base leading-none">
        🌐
      </span>
      <span className="text-sm leading-none font-medium">
        {loading ? 'Translating...' : 'Translate'}
      </span>
      {loading && (
        <span
          className="animate-[spin_1s_linear_infinite] text-base leading-none motion-reduce:animate-none"
          aria-label="Loading"
        >
          ⟳
        </span>
      )}
      {!loading && (
        <span
          className={`text-[10px] leading-none text-(--color-calm-400) transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          } motion-reduce:transition-none`}
        >
          ▼
        </span>
      )}
    </button>
  );
};
