/**
 * Tone Preset Section Component
 * Displays tone preset options for rewriting (calm, concise, empathetic, academic)
 */

import React from 'react';
import type { TonePreset } from '../../../types';
import { toneOptions } from './constants';
import { devLog } from '../../../utils/logger';
import {
  CalmIcon,
  ConciseIcon,
  EmpatheticIcon,
  AcademicIcon,
  LoadingIcon,
} from './icons';

interface TonePresetSectionProps {
  selectedTone?: TonePreset;
  onToneSelect: (tone: TonePreset) => void;
  tonesDisabled: boolean;
  isRewriting: boolean;
  onClose: () => void;
}

export const TonePresetSection: React.FC<TonePresetSectionProps> = ({
  selectedTone,
  onToneSelect,
  tonesDisabled,
  isRewriting,
  onClose,
}) => {
  const handleToneSelect = (tone: TonePreset) => {
    devLog('[MoreToolsMenu] Tone selected:', tone);
    devLog('[MoreToolsMenu] onToneSelect exists:', !!onToneSelect);
    if (onToneSelect && !tonesDisabled && !isRewriting) {
      devLog('[MoreToolsMenu] Calling onToneSelect...');
      onToneSelect(tone);
    } else {
      devLog('[MoreToolsMenu] Skipping - disabled or no handler');
    }
  };

  return (
    <div className="flex flex-col gap-1 [&+*]:mt-4 [&+*]:border-t [&+*]:border-t-white/8 [&+*]:pt-4">
      <div className="px-2 pb-2 font-sans text-[10px] font-bold tracking-wider text-slate-400 uppercase">
        Rewrite Tone
      </div>
      <div className="grid grid-cols-2 gap-2">
        {toneOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`pointer-events-auto relative flex cursor-pointer flex-row items-center justify-start gap-2.5 rounded-xl border px-3.5 py-3 text-left font-sans text-xs font-medium text-slate-200 transition-all duration-150 ${
              selectedTone === option.value
                ? 'border-sky-500/60 bg-sky-500/20 text-white'
                : 'border-white/20 bg-white/8 hover:-translate-y-0.5 hover:border-sky-500/50 hover:bg-white/12 hover:text-white active:translate-y-0'
            } ${tonesDisabled || isRewriting ? 'cursor-not-allowed opacity-50' : ''} motion-reduce:hover:translate-y-0`}
            onClick={(e) => {
              e.stopPropagation();
              devLog('[MoreToolsMenu] Tone tile clicked:', option.value);
              handleToneSelect(option.value);
              onClose();
            }}
            disabled={tonesDisabled || isRewriting}
            role="menuitem"
            data-testid={`tone-option-${option.value}`}
          >
            <span className="flex h-5 w-5 items-center justify-center leading-none [&_svg]:h-4 [&_svg]:w-4">
              {option.value === 'calm' ? (
                <CalmIcon />
              ) : option.value === 'concise' ? (
                <ConciseIcon />
              ) : option.value === 'empathetic' ? (
                <EmpatheticIcon />
              ) : (
                <AcademicIcon />
              )}
            </span>
            <span className="leading-tight font-semibold">{option.label}</span>
            {selectedTone === option.value && isRewriting && (
              <span className="absolute top-2 right-2 flex h-3 w-3 items-center justify-center [&_svg]:h-3 [&_svg]:w-3 [&_svg]:animate-[spin_1s_linear_infinite]">
                <LoadingIcon />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
