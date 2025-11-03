/**
 * Language Option Component
 * Individual language option button in the dropdown
 */

import React from 'react';
import type { LanguageOption as LanguageOptionType } from '../constants';

interface LanguageOptionProps {
  option: LanguageOptionType;
  isCurrent: boolean;
  isUnsupported: boolean;
  onSelect: (code: string) => void;
}

export const LanguageOption: React.FC<LanguageOptionProps> = ({
  option,
  isCurrent,
  isUnsupported,
  onSelect,
}) => {
  const handleClick = () => {
    if (!isUnsupported && !isCurrent) {
      onSelect(option.code);
    }
  };

  const baseClasses =
    'flex items-center gap-3 px-4 py-3 bg-transparent border-none border-b border-b-white/5 text-(--color-zen-100) font-sans cursor-pointer transition-all duration-150 w-full text-left last:border-b-0';
  const currentClasses = isCurrent ? 'bg-sky-500/10 border-b-sky-500/20' : '';
  const unsupportedClasses = isUnsupported
    ? 'opacity-40 cursor-not-allowed'
    : '';
  const hoverClasses =
    !isUnsupported && !isCurrent ? 'hover:bg-white/5 active:bg-white/8' : '';
  const focusClasses =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-(--color-zen-400) focus-visible:outline-offset-[-2px]';

  return (
    <button
      type="button"
      className={`${baseClasses} ${currentClasses} ${unsupportedClasses} ${hoverClasses} ${focusClasses}`}
      onClick={handleClick}
      disabled={isUnsupported || isCurrent}
      role="option"
      aria-selected={isCurrent}
      aria-disabled={isUnsupported}
      title={
        isUnsupported
          ? `Translation to ${option.name} is not available`
          : isCurrent
            ? `Currently in ${option.name}`
            : `Translate to ${option.name}`
      }
      data-testid={`translate-option-${option.code}`}
    >
      <span
        className="flex flex-shrink-0 items-center justify-center text-2xl leading-none sm:text-xl"
        aria-hidden="true"
      >
        {option.flag}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm leading-tight font-medium text-(--color-zen-100)">
          {option.name}
        </span>
        <span className="text-xs leading-tight font-normal text-(--color-calm-400)">
          {option.nativeName}
        </span>
      </div>
      {isCurrent && (
        <span className="rounded-sm border border-sky-500/30 bg-sky-500/20 px-2 py-1 text-[11px] leading-none font-semibold whitespace-nowrap text-(--color-zen-200)">
          Current
        </span>
      )}
      {isUnsupported && !isCurrent && (
        <span className="rounded-sm border border-white/10 bg-white/5 px-2 py-1 text-[11px] leading-none font-semibold whitespace-nowrap text-(--color-calm-500)">
          Unavailable
        </span>
      )}
    </button>
  );
};
