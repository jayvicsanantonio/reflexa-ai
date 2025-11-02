/**
 * Select Component
 * Dropdown select for settings
 */

import React from 'react';

interface SelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  options,
  onChange,
  disabled = false,
}) => (
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
    <span className="sr-only">{label}</span>
    <select
      aria-label={label}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: '#f1f5f9',
        border: '1px solid rgba(15,23,42,0.15)',
        color: '#0f172a',
        padding: '8px 10px',
        borderRadius: 10,
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </label>
);
