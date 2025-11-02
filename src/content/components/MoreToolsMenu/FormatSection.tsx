/**
 * Format Section Component
 * Displays summary format options (bullets, paragraph, headline)
 */

import React from 'react';
import type { SummaryFormat } from '../../../types';
import { formatOptions } from './constants';
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
    console.log(
      '[MoreToolsMenu] Format selected:',
      format,
      'Current:',
      currentFormat
    );
    console.log('[MoreToolsMenu] onFormatChange exists:', !!onFormatChange);
    if (format !== currentFormat && onFormatChange) {
      console.log('[MoreToolsMenu] Calling onFormatChange...');
      await onFormatChange(format);
      console.log('[MoreToolsMenu] onFormatChange completed');
    } else {
      console.log('[MoreToolsMenu] Skipping - same format or no handler');
    }
  };

  return (
    <div className="reflexa-more-tools__section">
      <div className="reflexa-more-tools__section-title">Format</div>
      <div className="reflexa-more-tools__grid">
        {formatOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`reflexa-more-tools__tile ${
              currentFormat === option.value
                ? 'reflexa-more-tools__tile--selected'
                : ''
            }`}
            onClick={async (e) => {
              e.stopPropagation();
              console.log('[MoreToolsMenu] Format tile clicked:', option.value);
              await handleFormatSelect(option.value);
              onClose();
            }}
            disabled={isLoadingSummary}
            role="menuitem"
            data-testid={`format-option-${option.value}`}
          >
            <span className="reflexa-more-tools__tile-icon">
              {option.value === 'bullets' ? (
                <BulletIcon />
              ) : option.value === 'paragraph' ? (
                <ParagraphIcon />
              ) : (
                <HeadlineIcon />
              )}
            </span>
            <span className="reflexa-more-tools__tile-label">
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
