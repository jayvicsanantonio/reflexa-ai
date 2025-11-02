/**
 * Range Component
 * Slider input for numeric settings
 */

import React from 'react';

interface RangeProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  unit?: string;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export const Range: React.FC<RangeProps> = ({
  label,
  min,
  max,
  step = 1,
  value,
  unit = '',
  onChange,
  disabled = false,
}) => (
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
    <span className="sr-only">{label}</span>
    <input
      type="range"
      aria-label={label}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
    <span style={{ color: '#64748b', fontSize: 12 }}>
      {value}
      {unit}
    </span>
  </label>
);
