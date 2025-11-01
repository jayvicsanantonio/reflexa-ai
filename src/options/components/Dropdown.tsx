import React, { useState, useRef, useEffect } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
}

export interface DropdownProps {
  label: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  description?: string;
  disabled?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  value,
  onChange,
  description,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue: string) => {
    if (!disabled && optionValue !== value) {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, optionValue: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(optionValue);
    }
  };

  const selectedOption = options.find((opt) => opt.value === value);
  const dropdownId = `dropdown-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const descriptionId = description ? `${dropdownId}-description` : undefined;

  return (
    <div className="space-y-2">
      <div>
        <label
          htmlFor={dropdownId}
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
      <div ref={dropdownRef} className="relative">
        <button
          id={dropdownId}
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-describedby={descriptionId}
          className={`focus:ring-accent-500 border-calm-300 text-calm-900 focus:border-accent-500 relative w-full cursor-pointer rounded-lg border bg-white py-2 pr-10 pl-3 text-left shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none sm:text-sm ${
            disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-calm-400'
          }`}
        >
          <span className="block truncate">{selectedOption?.label}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <svg
              className={`text-calm-400 h-5 w-5 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </button>

        {isOpen && (
          <div
            className="border-calm-200 shadow-soft absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-white py-1"
            role="listbox"
            aria-labelledby={dropdownId}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  onKeyDown={(e) => handleKeyDown(e, option.value)}
                  role="option"
                  aria-selected={isSelected}
                  className={`text-calm-900 hover:bg-accent-50 focus:bg-accent-50 relative w-full cursor-pointer py-2 pr-9 pl-3 text-left transition-colors select-none focus:outline-none ${
                    isSelected ? 'bg-accent-50' : ''
                  }`}
                >
                  <div>
                    <span
                      className={`block truncate ${
                        isSelected ? 'font-semibold' : 'font-normal'
                      }`}
                    >
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="text-calm-600 block truncate text-sm">
                        {option.description}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <span className="text-accent-500 absolute inset-y-0 right-0 flex items-center pr-4">
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
