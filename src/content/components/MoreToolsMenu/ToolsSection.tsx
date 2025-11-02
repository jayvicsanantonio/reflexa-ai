/**
 * Tools Section Component
 * Displays universal tools: ambient sound toggle, reduce motion toggle, and translation
 */

import React, { useState, useEffect } from 'react';
import { VolumeIcon, VolumeMuteIcon, ReduceMotionIcon } from './icons';
import { languageOptions } from './constants';

interface ToolsSectionProps {
  ambientMuted?: boolean;
  onToggleAmbient?: (mute: boolean) => void;
  reduceMotion?: boolean;
  onToggleReduceMotion?: (enabled: boolean) => void;
  onTranslateSummary?: (targetLanguage: string) => void;
  isTranslating?: boolean;
  unsupportedLanguages?: string[];
  defaultTargetLanguage?: string;
  onClose: () => void;
}

export const ToolsSection: React.FC<ToolsSectionProps> = ({
  ambientMuted = false,
  onToggleAmbient,
  reduceMotion = false,
  onToggleReduceMotion,
  onTranslateSummary,
  isTranslating = false,
  unsupportedLanguages = [],
  defaultTargetLanguage,
  onClose,
}) => {
  // Default selection uses provided preferred language or English
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    defaultTargetLanguage ?? 'en'
  );

  // Keep internal selection in sync if parent preference changes
  useEffect(() => {
    if (defaultTargetLanguage && defaultTargetLanguage !== selectedLanguage) {
      setSelectedLanguage(defaultTargetLanguage);
    }
    // We intentionally omit selectedLanguage from deps to avoid loops when user changes it locally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultTargetLanguage]);

  return (
    <div className="reflexa-more-tools__section">
      <div className="reflexa-more-tools__section-title">Tools</div>
      <div className="reflexa-more-tools__grid">
        {onToggleAmbient && (
          <button
            type="button"
            className="reflexa-more-tools__tile"
            onClick={(e) => {
              e.stopPropagation();
              onToggleAmbient(!ambientMuted);
              onClose();
            }}
            role="menuitem"
            data-testid="ambient-sound-toggle"
          >
            <span className="reflexa-more-tools__tile-icon">
              {ambientMuted ? <VolumeMuteIcon /> : <VolumeIcon />}
            </span>
            <span className="reflexa-more-tools__tile-label">
              {ambientMuted ? 'Unmute' : 'Mute'}
            </span>
          </button>
        )}
        {onToggleReduceMotion && (
          <button
            type="button"
            className="reflexa-more-tools__tile"
            onClick={(e) => {
              e.stopPropagation();
              onToggleReduceMotion(!reduceMotion);
              onClose();
            }}
            role="menuitem"
            data-testid="reduce-motion-toggle"
          >
            <span className="reflexa-more-tools__tile-icon">
              <ReduceMotionIcon />
            </span>
            <span className="reflexa-more-tools__tile-label">
              {reduceMotion ? 'Enable Motion' : 'Reduce Motion'}
            </span>
          </button>
        )}
      </div>

      {onTranslateSummary && (
        <div
          className="reflexa-more-tools__inline-row"
          role="group"
          aria-label="Select language"
        >
          <select
            className="reflexa-more-tools__language-select"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            disabled={isTranslating}
            data-testid="language-select"
          >
            {languageOptions.map((lang) => {
              const isUnsupported = unsupportedLanguages.includes(lang.code);
              return (
                <option
                  key={lang.code}
                  value={lang.code}
                  disabled={isUnsupported}
                >
                  {`${lang.name}${
                    lang.nativeName && lang.nativeName !== lang.name
                      ? ` (${lang.nativeName})`
                      : ''
                  }`}
                </option>
              );
            })}
          </select>
          <button
            type="button"
            className="reflexa-more-tools__inline-button"
            onClick={() => {
              onTranslateSummary(selectedLanguage);
              onClose();
            }}
            disabled={isTranslating}
            data-testid="translate-apply-button"
          >
            {isTranslating ? 'Translating…' : 'Translate'}
          </button>
        </div>
      )}
    </div>
  );
};
