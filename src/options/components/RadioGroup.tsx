import React from 'react';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioGroupProps {
  label: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  description?: string;
  disabled?: boolean;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  options,
  value,
  onChange,
  description,
  disabled = false,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent, optionValue: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) {
        onChange(optionValue);
      }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (!disabled) {
        const currentIndex = options.findIndex((opt) => opt.value === value);
        const nextIndex = (currentIndex + 1) % options.length;
        onChange(options[nextIndex].value);
      }
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      if (!disabled) {
        const currentIndex = options.findIndex((opt) => opt.value === value);
        const prevIndex = (currentIndex - 1 + options.length) % options.length;
        onChange(options[prevIndex].value);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-calm-900 block text-sm font-medium">
          {label}
        </label>
        {description && (
          <p className="text-calm-600 mt-1 text-sm">{description}</p>
        )}
      </div>
      <div className="space-y-2">
        {options.map((option) => (
          <div
            key={option.value}
            className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
              value === option.value
                ? 'border-accent-500 bg-accent-50'
                : 'border-calm-200 hover:border-calm-300 bg-white'
            } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            onClick={() => !disabled && onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, option.value)}
            role="radio"
            aria-checked={value === option.value}
            tabIndex={0}
          >
            <div className="flex h-5 items-center">
              <input
                type="radio"
                name={label}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                disabled={disabled}
                className="border-calm-300 text-accent-500 focus:ring-accent-500 h-4 w-4 cursor-pointer focus:ring-2 focus:ring-offset-2"
                aria-label={option.label}
              />
            </div>
            <div className="flex-1">
              <div className="text-calm-900 text-sm font-medium">
                {option.label}
              </div>
              {option.description && (
                <div className="text-calm-600 mt-1 text-sm">
                  {option.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
