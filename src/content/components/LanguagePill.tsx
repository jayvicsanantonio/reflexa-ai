import React from 'react';
import type { LanguageDetection } from '../../types';

interface LanguagePillProps {
  languageDetection: LanguageDetection;
  className?: string;
}

/**
 * Language Pill Component
 * Displays detected language with confidence score in a small pill format
 * Includes globe icon, fade-in animation, and tooltip showing confidence
 */
export const LanguagePill: React.FC<LanguagePillProps> = ({
  languageDetection,
  className = '',
}) => {
  const { languageName, detectedLanguage, confidence } = languageDetection;

  // Format confidence as percentage
  const confidencePercent = Math.round(confidence * 100);

  return (
    <div
      className={`inline-flex animate-[languagePillFadeIn_0.5s_ease-in-out] cursor-help items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 font-sans text-[13px] font-medium whitespace-nowrap text-(--color-calm-100) transition-[background-color,border-color,transform] duration-200 select-none hover:-translate-y-0.5 hover:border-sky-400/30 hover:bg-white/8 motion-reduce:animate-[fadeIn_0.15s_ease-in-out] motion-reduce:hover:translate-y-0 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs ${className}`}
      role="status"
      aria-label={`Detected language: ${languageName} with ${confidencePercent}% confidence`}
      data-testid="language-pill"
      title={`${languageName} (${detectedLanguage.toUpperCase()}) - ${confidencePercent}% confidence`}
    >
      <span
        className="flex items-center justify-center text-base leading-none grayscale-[0.2] sm:text-sm"
        aria-hidden="true"
      >
        🌐
      </span>
      <span className="text-[13px] leading-none font-medium text-(--color-zen-100) sm:text-xs">
        {languageName}
      </span>
      <span
        className="rounded-sm bg-white/5 px-1.5 py-0.5 text-[11px] leading-none font-semibold text-(--color-calm-400) sm:px-1.5 sm:py-0.5 sm:text-[10px]"
        aria-label={`${confidencePercent}% confidence`}
      >
        {confidencePercent}%
      </span>
    </div>
  );
};
