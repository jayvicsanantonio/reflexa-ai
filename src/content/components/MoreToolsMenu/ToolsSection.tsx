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
    <div className="flex flex-col gap-1 [&+*]:mt-4 [&+*]:border-t [&+*]:border-t-white/8 [&+*]:pt-4">
      <div className="px-2 pb-2 font-sans text-[10px] font-bold tracking-wider text-slate-400 uppercase">
        Tools
      </div>
      <div className="grid grid-cols-2 gap-2">
        {onToggleAmbient && (
          <button
            type="button"
            className="pointer-events-auto relative flex cursor-pointer flex-row items-center justify-start gap-2.5 rounded-xl border border-white/20 bg-white/8 px-3.5 py-3 text-left font-sans text-xs font-medium text-slate-200 transition-all duration-150 hover:-translate-y-0.5 hover:border-sky-500/50 hover:bg-white/12 hover:text-white active:translate-y-0 motion-reduce:hover:translate-y-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleAmbient(!ambientMuted);
              onClose();
            }}
            role="menuitem"
            data-testid="ambient-sound-toggle"
          >
            <span className="flex h-5 w-5 items-center justify-center leading-none [&_svg]:h-4 [&_svg]:w-4">
              {ambientMuted ? <VolumeMuteIcon /> : <VolumeIcon />}
            </span>
            <span className="leading-tight font-semibold">
              {ambientMuted ? 'Unmute' : 'Mute'}
            </span>
          </button>
        )}
        {onToggleReduceMotion && (
          <button
            type="button"
            className="pointer-events-auto relative flex cursor-pointer flex-row items-center justify-start gap-2.5 rounded-xl border border-white/20 bg-white/8 px-3.5 py-3 text-left font-sans text-xs font-medium text-slate-200 transition-all duration-150 hover:-translate-y-0.5 hover:border-sky-500/50 hover:bg-white/12 hover:text-white active:translate-y-0 motion-reduce:hover:translate-y-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleReduceMotion(!reduceMotion);
              onClose();
            }}
            role="menuitem"
            data-testid="reduce-motion-toggle"
          >
            <span className="flex h-5 w-5 items-center justify-center leading-none [&_svg]:h-4 [&_svg]:w-4">
              <ReduceMotionIcon />
            </span>
            <span className="leading-tight font-semibold">
              {reduceMotion ? 'Enable Motion' : 'Reduce Motion'}
            </span>
          </button>
        )}
      </div>

      {onTranslateSummary && (
        <div
          className="mt-2 flex w-full items-center gap-2"
          role="group"
          aria-label="Select language"
        >
          <select
            className="flex-[1_1_auto] rounded-lg border border-white/10 bg-white/4 px-2.5 py-2 text-xs text-slate-200 focus:ring-2 focus:ring-sky-500/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
            className="flex-[0_0_auto] cursor-pointer rounded-lg border border-sky-500/35 bg-sky-500/15 px-3 py-2 text-xs font-semibold text-sky-200 transition-all duration-150 hover:border-sky-500/50 hover:bg-sky-500/22 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
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
