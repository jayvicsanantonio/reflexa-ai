import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TranslateDropdown } from './TranslateDropdown';

describe('TranslateDropdown', () => {
  const mockOnTranslate = vi.fn();

  beforeEach(() => {
    mockOnTranslate.mockClear();
  });

  it('renders the dropdown trigger button', () => {
    render(<TranslateDropdown onTranslate={mockOnTranslate} />);

    const trigger = screen.getByTestId('translate-trigger');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('Translate');
  });

  it('opens dropdown menu when trigger is clicked', async () => {
    render(<TranslateDropdown onTranslate={mockOnTranslate} />);

    const trigger = screen.getByTestId('translate-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('translate-menu')).toBeInTheDocument();
    });
  });

  it('displays all 10 language options', async () => {
    render(<TranslateDropdown onTranslate={mockOnTranslate} />);

    const trigger = screen.getByTestId('translate-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('translate-option-en')).toBeInTheDocument();
      expect(screen.getByTestId('translate-option-es')).toBeInTheDocument();
      expect(screen.getByTestId('translate-option-fr')).toBeInTheDocument();
      expect(screen.getByTestId('translate-option-de')).toBeInTheDocument();
      expect(screen.getByTestId('translate-option-it')).toBeInTheDocument();
      expect(screen.getByTestId('translate-option-pt')).toBeInTheDocument();
      expect(screen.getByTestId('translate-option-zh')).toBeInTheDocument();
      expect(screen.getByTestId('translate-option-ja')).toBeInTheDocument();
      expect(screen.getByTestId('translate-option-ko')).toBeInTheDocument();
      expect(screen.getByTestId('translate-option-ar')).toBeInTheDocument();
    });
  });

  it('calls onTranslate when a language is selected', async () => {
    render(<TranslateDropdown onTranslate={mockOnTranslate} />);

    const trigger = screen.getByTestId('translate-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      const spanishOption = screen.getByTestId('translate-option-es');
      fireEvent.click(spanishOption);
    });

    expect(mockOnTranslate).toHaveBeenCalledWith('es');
  });

  it('filters languages based on search query', async () => {
    render(<TranslateDropdown onTranslate={mockOnTranslate} />);

    const trigger = screen.getByTestId('translate-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      const searchInput = screen.getByTestId('translate-search');
      fireEvent.change(searchInput, { target: { value: 'span' } });
    });

    await waitFor(() => {
      expect(screen.getByTestId('translate-option-es')).toBeInTheDocument();
      expect(
        screen.queryByTestId('translate-option-fr')
      ).not.toBeInTheDocument();
    });
  });

  it('shows "No languages found" when search has no results', async () => {
    render(<TranslateDropdown onTranslate={mockOnTranslate} />);

    const trigger = screen.getByTestId('translate-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      const searchInput = screen.getByTestId('translate-search');
      fireEvent.change(searchInput, { target: { value: 'xyz123' } });
    });

    await waitFor(() => {
      expect(screen.getByTestId('translate-no-results')).toBeInTheDocument();
      expect(screen.getByText('No languages found')).toBeInTheDocument();
    });
  });

  it('disables trigger when disabled prop is true', () => {
    render(<TranslateDropdown onTranslate={mockOnTranslate} disabled={true} />);

    const trigger = screen.getByTestId('translate-trigger');
    expect(trigger).toBeDisabled();
  });

  it('shows loading state when loading prop is true', () => {
    render(<TranslateDropdown onTranslate={mockOnTranslate} loading={true} />);

    const trigger = screen.getByTestId('translate-trigger');
    expect(trigger).toHaveTextContent('Translating...');
    expect(trigger).toBeDisabled();
  });

  it('marks current language option with badge', async () => {
    render(
      <TranslateDropdown onTranslate={mockOnTranslate} currentLanguage="en" />
    );

    const trigger = screen.getByTestId('translate-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      const englishOption = screen.getByTestId('translate-option-en');
      expect(englishOption).toHaveTextContent('Current');
    });
  });

  it('disables current language option', async () => {
    render(
      <TranslateDropdown onTranslate={mockOnTranslate} currentLanguage="en" />
    );

    const trigger = screen.getByTestId('translate-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      const englishOption = screen.getByTestId('translate-option-en');
      expect(englishOption).toBeDisabled();
    });
  });

  it('marks unsupported languages with badge', async () => {
    render(
      <TranslateDropdown
        onTranslate={mockOnTranslate}
        unsupportedLanguages={['zh', 'ja']}
      />
    );

    const trigger = screen.getByTestId('translate-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      const chineseOption = screen.getByTestId('translate-option-zh');
      expect(chineseOption).toHaveTextContent('Unavailable');
      expect(chineseOption).toBeDisabled();
    });
  });

  it('does not call onTranslate for unsupported languages', async () => {
    render(
      <TranslateDropdown
        onTranslate={mockOnTranslate}
        unsupportedLanguages={['es']}
      />
    );

    const trigger = screen.getByTestId('translate-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      const spanishOption = screen.getByTestId('translate-option-es');
      fireEvent.click(spanishOption);
    });

    expect(mockOnTranslate).not.toHaveBeenCalled();
  });

  it('closes dropdown when clicking outside', async () => {
    render(
      <div>
        <TranslateDropdown onTranslate={mockOnTranslate} />
        <div data-testid="outside">Outside</div>
      </div>
    );

    const trigger = screen.getByTestId('translate-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('translate-menu')).toBeInTheDocument();
    });

    const outside = screen.getByTestId('outside');
    fireEvent.mouseDown(outside);

    await waitFor(() => {
      expect(screen.queryByTestId('translate-menu')).not.toBeInTheDocument();
    });
  });

  it('closes dropdown when Escape key is pressed', async () => {
    render(<TranslateDropdown onTranslate={mockOnTranslate} />);

    const trigger = screen.getByTestId('translate-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('translate-menu')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByTestId('translate-menu')).not.toBeInTheDocument();
    });
  });

  it('displays flag icons for each language', async () => {
    render(<TranslateDropdown onTranslate={mockOnTranslate} />);

    const trigger = screen.getByTestId('translate-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      const spanishOption = screen.getByTestId('translate-option-es');
      expect(spanishOption).toHaveTextContent('🇪🇸');
    });
  });

  it('displays both English and native language names', async () => {
    render(<TranslateDropdown onTranslate={mockOnTranslate} />);

    const trigger = screen.getByTestId('translate-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      const spanishOption = screen.getByTestId('translate-option-es');
      expect(spanishOption).toHaveTextContent('Spanish');
      expect(spanishOption).toHaveTextContent('Español');
    });
  });

  it('focuses search input when dropdown opens', async () => {
    render(<TranslateDropdown onTranslate={mockOnTranslate} />);

    const trigger = screen.getByTestId('translate-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      const searchInput = screen.getByTestId('translate-search');
      expect(searchInput).toHaveFocus();
    });
  });

  it('clears search query when dropdown closes', async () => {
    render(<TranslateDropdown onTranslate={mockOnTranslate} />);

    const trigger = screen.getByTestId('translate-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      const searchInput = screen.getByTestId('translate-search');
      fireEvent.change(searchInput, { target: { value: 'test' } });
    });

    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.queryByTestId('translate-menu')).not.toBeInTheDocument();
    });

    fireEvent.click(trigger);

    await waitFor(() => {
      const searchInput = screen.getByTestId('translate-search');
      expect(searchInput).toHaveValue('');
    });
  });
});
