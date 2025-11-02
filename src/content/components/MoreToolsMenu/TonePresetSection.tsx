/**
 * Tone Preset Section Component
 * Displays tone preset options for rewriting (calm, concise, empathetic, academic)
 */

import React from 'react';
import type { TonePreset } from '../../../types';
import { toneOptions } from './constants';
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
    console.log('[MoreToolsMenu] Tone selected:', tone);
    console.log('[MoreToolsMenu] onToneSelect exists:', !!onToneSelect);
    if (onToneSelect && !tonesDisabled && !isRewriting) {
      console.log('[MoreToolsMenu] Calling onToneSelect...');
      onToneSelect(tone);
    } else {
      console.log('[MoreToolsMenu] Skipping - disabled or no handler');
    }
  };

  return (
    <div className="reflexa-more-tools__section">
      <div className="reflexa-more-tools__section-title">Rewrite Tone</div>
      <div className="reflexa-more-tools__grid">
        {toneOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`reflexa-more-tools__tile ${
              selectedTone === option.value
                ? 'reflexa-more-tools__tile--selected'
                : ''
            }`}
            onClick={(e) => {
              e.stopPropagation();
              console.log('[MoreToolsMenu] Tone tile clicked:', option.value);
              handleToneSelect(option.value);
              onClose();
            }}
            disabled={tonesDisabled || isRewriting}
            role="menuitem"
            data-testid={`tone-option-${option.value}`}
          >
            <span className="reflexa-more-tools__tile-icon">
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
            <span className="reflexa-more-tools__tile-label">
              {option.label}
            </span>
            {selectedTone === option.value && isRewriting && (
              <span className="reflexa-more-tools__tile-spinner">
                <LoadingIcon />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
