import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguagePill } from './LanguagePill';
import type { LanguageDetection } from '../../types';

describe('LanguagePill', () => {
  const mockLanguageDetection: LanguageDetection = {
    detectedLanguage: 'es',
    languageName: 'Spanish',
    confidence: 0.95,
  };

  it('renders language name correctly', () => {
    render(<LanguagePill languageDetection={mockLanguageDetection} />);

    expect(screen.getByText('Spanish')).toBeInTheDocument();
  });

  it('displays confidence percentage', () => {
    render(<LanguagePill languageDetection={mockLanguageDetection} />);

    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('includes globe icon', () => {
    render(<LanguagePill languageDetection={mockLanguageDetection} />);

    const icon = screen.getByText('🌐');
    expect(icon).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(<LanguagePill languageDetection={mockLanguageDetection} />);

    const pill = screen.getByRole('status');
    expect(pill).toHaveAttribute(
      'aria-label',
      'Detected language: Spanish with 95% confidence'
    );
  });

  it('displays tooltip with language code and confidence', () => {
    render(<LanguagePill languageDetection={mockLanguageDetection} />);

    const pill = screen.getByTestId('language-pill');
    expect(pill).toHaveAttribute('title', 'Spanish (ES) - 95% confidence');
  });

  it('rounds confidence to nearest integer', () => {
    const detectionWithDecimal: LanguageDetection = {
      detectedLanguage: 'fr',
      languageName: 'French',
      confidence: 0.876,
    };

    render(<LanguagePill languageDetection={detectionWithDecimal} />);

    expect(screen.getByText('88%')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    render(
      <LanguagePill
        languageDetection={mockLanguageDetection}
        className="custom-class"
      />
    );

    const pill = screen.getByTestId('language-pill');
    expect(pill).toHaveClass('reflexa-language-pill');
    expect(pill).toHaveClass('custom-class');
  });

  it('handles low confidence values', () => {
    const lowConfidence: LanguageDetection = {
      detectedLanguage: 'de',
      languageName: 'German',
      confidence: 0.42,
    };

    render(<LanguagePill languageDetection={lowConfidence} />);

    expect(screen.getByText('42%')).toBeInTheDocument();
  });

  it('handles high confidence values', () => {
    const highConfidence: LanguageDetection = {
      detectedLanguage: 'en',
      languageName: 'English',
      confidence: 0.99,
    };

    render(<LanguagePill languageDetection={highConfidence} />);

    expect(screen.getByText('99%')).toBeInTheDocument();
  });
});
