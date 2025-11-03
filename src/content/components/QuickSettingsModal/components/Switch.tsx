/**
 * Switch Component
 * Toggle switch for boolean settings
 */

import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
}) => {
  const onKey = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={disabled}
      onKeyDown={onKey}
      onClick={() => {
        if (disabled) return;
        onChange(!checked);
      }}
      className={`relative h-[26px] w-11 cursor-pointer rounded-full border border-slate-900/15 transition-[background] duration-150 ${
        checked ? 'bg-indigo-500/80' : 'bg-slate-900/6'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500`}
      tabIndex={disabled ? -1 : 0}
    >
      <span
        aria-hidden
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-[left] duration-150 ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  );
};
