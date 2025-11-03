/**
 * Format Section Component
 * Displays summary format options (bullets, paragraph, headline)
 */

import React from 'react';
import type { SummaryFormat } from '../../../types';
import { formatOptions } from './constants';
import { devLog } from '../../../utils/logger';
import { BulletIcon, ParagraphIcon, HeadlineIcon } from './icons';

interface FormatSectionProps {
  currentFormat: SummaryFormat;
  onFormatChange: (format: SummaryFormat) => Promise<void>;
  isLoadingSummary: boolean;
  onClose: () => void;
}

export const FormatSection: React.FC<FormatSectionProps> = ({
  currentFormat,
  onFormatChange,
  isLoadingSummary,
  onClose,
}) => {
  const handleFormatSelect = async (format: SummaryFormat) => {
    devLog(
      '[MoreToolsMenu] Format selected:',
      format,
      'Current:',
      currentFormat
    );
    devLog('[MoreToolsMenu] onFormatChange exists:', !!onFormatChange);
    if (format !== currentFormat && onFormatChange) {
      devLog('[MoreToolsMenu] Calling onFormatChange...');
      await onFormatChange(format);
      devLog('[MoreToolsMenu] onFormatChange completed');
    } else {
      devLog('[MoreToolsMenu] Skipping - same format or no handler');
    }
  };

  return (
    <div className="flex flex-col gap-1 [&+*]:mt-4 [&+*]:border-t [&+*]:border-t-white/8 [&+*]:pt-4">
      <div className="px-2 pb-2 font-sans text-[10px] font-bold tracking-wider text-slate-400 uppercase">
        Format
      </div>
      <div className="grid grid-cols-2 gap-2">
        {formatOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`pointer-events-auto relative flex cursor-pointer flex-row items-center justify-start gap-2.5 rounded-xl border px-3.5 py-3 text-left font-sans text-xs font-medium text-slate-200 transition-all duration-150 ${
              currentFormat === option.value
                ? 'border-sky-500/60 bg-sky-500/20 text-white'
                : 'border-white/20 bg-white/8 hover:-translate-y-0.5 hover:border-sky-500/50 hover:bg-white/12 hover:text-white active:translate-y-0'
            } ${isLoadingSummary ? 'cursor-not-allowed opacity-50' : ''} motion-reduce:hover:translate-y-0`}
            onClick={async (e) => {
              e.stopPropagation();
              devLog('[MoreToolsMenu] Format tile clicked:', option.value);
              await handleFormatSelect(option.value);
              onClose();
            }}
            disabled={isLoadingSummary}
            role="menuitem"
            data-testid={`format-option-${option.value}`}
          >
            <span className="flex h-5 w-5 items-center justify-center leading-none [&_svg]:h-4 [&_svg]:w-4">
              {option.value === 'bullets' ? (
                <BulletIcon />
              ) : option.value === 'paragraph' ? (
                <ParagraphIcon />
              ) : (
                <HeadlineIcon />
              )}
            </span>
            <span className="leading-tight font-semibold">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
