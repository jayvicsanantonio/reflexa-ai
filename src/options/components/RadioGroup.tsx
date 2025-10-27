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

  const groupId = `radio-group-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const descriptionId = description ? `${groupId}-description` : undefined;

  return (
    <div className="space-y-3">
      <div>
        <label
          id={`${groupId}-label`}
          className="text-calm-900 block text-sm font-medium"
        >
          {label}
        </label>
        {description && (
          <p id={descriptionId} className="text-calm-600 mt-1 text-sm">
            {description}
          </p>
        )}
      </div>
      <div
        className="space-y-2"
        role="radiogroup"
        aria-labelledby={`${groupId}-label`}
        aria-describedby={descriptionId}
      >
        {options.map((option, index) => {
          const isSelected = value === option.value;
          const optionId = `${groupId}-option-${index}`;

          return (
            <div
              key={option.value}
              className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                isSelected
                  ? 'border-accent-500 bg-accent-50'
                  : 'border-calm-200 hover:border-calm-300 bg-white'
              } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              onClick={() => !disabled && onChange(option.value)}
              onKeyDown={(e) => handleKeyDown(e, option.value)}
              role="radio"
              aria-checked={isSelected}
              aria-labelledby={`${optionId}-label`}
              aria-describedby={
                option.description ? `${optionId}-description` : undefined
              }
              tabIndex={isSelected ? 0 : -1}
            >
              <div className="flex h-5 items-center">
                <input
                  type="radio"
                  id={optionId}
                  name={groupId}
                  value={option.value}
                  checked={isSelected}
                  onChange={() => onChange(option.value)}
                  disabled={disabled}
                  tabIndex={-1}
                  className="border-calm-300 text-accent-500 focus:ring-accent-500 h-4 w-4 cursor-pointer focus:ring-2 focus:ring-offset-2"
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1">
                <div
                  id={`${optionId}-label`}
                  className="text-calm-900 text-sm font-medium"
                >
                  {option.label}
                </div>
                {option.description && (
                  <div
                    id={`${optionId}-description`}
                    className="text-calm-600 mt-1 text-sm"
                  >
                    {option.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
