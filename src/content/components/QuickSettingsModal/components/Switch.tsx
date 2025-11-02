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
      className="reflexa-switch"
      style={{
        background: checked ? 'rgba(59,130,246,0.8)' : 'rgba(15,23,42,0.06)',
        border: '1px solid rgba(15,23,42,0.15)',
      }}
      tabIndex={disabled ? -1 : 0}
    >
      <span aria-hidden className="reflexa-switch__thumb" />
    </button>
  );
};
