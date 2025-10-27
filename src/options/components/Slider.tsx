import React from 'react';
import { getAccessibleDuration } from '../../utils/accessibility';

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
  description?: string;
  disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit = '',
  description,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  // Get accessible description for screen readers
  const getAccessibleValue = (): string => {
    if (unit === ' seconds') {
      return getAccessibleDuration(value);
    }
    return `${value}${unit}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor={`slider-${label}`}
          className="text-calm-900 block text-sm font-medium"
        >
          {label}
        </label>
        <span
          className="text-calm-900 text-sm font-semibold"
          aria-hidden="true"
        >
          {value}
          {unit}
        </span>
      </div>
      {description && (
        <p id={`slider-${label}-description`} className="text-calm-600 text-sm">
          {description}
        </p>
      )}
      <input
        id={`slider-${label}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        aria-label={`${label}. ${description ?? ''}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={getAccessibleValue()}
        aria-describedby={
          description ? `slider-${label}-description` : undefined
        }
        className={`bg-calm-200 focus:ring-accent-500 h-2 w-full cursor-pointer appearance-none rounded-lg focus:ring-2 focus:ring-offset-2 focus:outline-none ${
          disabled ? 'cursor-not-allowed opacity-50' : ''
        }`}
        style={{
          background: `linear-gradient(to right, rgb(var(--color-accent-500)) 0%, rgb(var(--color-accent-500)) ${((value - min) / (max - min)) * 100}%, rgb(var(--color-calm-200)) ${((value - min) / (max - min)) * 100}%, rgb(var(--color-calm-200)) 100%)`,
        }}
      />
      <div className="text-calm-500 flex justify-between text-xs">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
};
