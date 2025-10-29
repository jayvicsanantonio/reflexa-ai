import React from 'react';
import type { LanguageDetection } from '../../types';
import '../styles.css';

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
      className={`reflexa-language-pill ${className}`}
      role="status"
      aria-label={`Detected language: ${languageName} with ${confidencePercent}% confidence`}
      data-testid="language-pill"
      title={`${languageName} (${detectedLanguage.toUpperCase()}) - ${confidencePercent}% confidence`}
    >
      <span className="reflexa-language-pill__icon" aria-hidden="true">
        🌐
      </span>
      <span className="reflexa-language-pill__text">{languageName}</span>
      <span
        className="reflexa-language-pill__confidence"
        aria-label={`${confidencePercent}% confidence`}
      >
        {confidencePercent}%
      </span>
    </div>
  );
};
