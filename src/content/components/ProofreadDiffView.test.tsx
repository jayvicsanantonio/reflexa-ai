import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProofreadDiffView } from './ProofreadDiffView';
import type { ProofreadResult } from '../../types';

describe('ProofreadDiffView', () => {
  const mockResult: ProofreadResult = {
    correctedText: 'This is a corrected sentence with better grammar.',
    corrections: [
      {
        startIndex: 10,
        endIndex: 19,
        original: 'corrected',
      },
      {
        startIndex: 35,
        endIndex: 41,
        original: 'better',
      },
    ],
  };

  const mockOriginal = 'This is a original sentence with good grammar.';

  it('renders the component with header', () => {
    const onAccept = vi.fn();
    const onDiscard = vi.fn();

    render(
      <ProofreadDiffView
        original={mockOriginal}
        result={mockResult}
        onAccept={onAccept}
        onDiscard={onDiscard}
      />
    );

    expect(screen.getByText('Proofreading Results')).toBeInTheDocument();
    expect(screen.getByText('2 corrections suggested')).toBeInTheDocument();
  });

  it('displays original and corrected text', () => {
    const onAccept = vi.fn();
    const onDiscard = vi.fn();

    render(
      <ProofreadDiffView
        original={mockOriginal}
        result={mockResult}
        onAccept={onAccept}
        onDiscard={onDiscard}
      />
    );

    expect(screen.getByTestId('original-text')).toBeInTheDocument();
    expect(screen.getByTestId('corrected-text')).toBeInTheDocument();
  });

  it('shows no corrections message when there are no corrections', () => {
    const onAccept = vi.fn();
    const onDiscard = vi.fn();
    const emptyResult: ProofreadResult = {
      correctedText: mockOriginal,
      corrections: [],
    };

    render(
      <ProofreadDiffView
        original={mockOriginal}
        result={emptyResult}
        onAccept={onAccept}
        onDiscard={onDiscard}
      />
    );

    expect(screen.getByText('No corrections needed')).toBeInTheDocument();
  });

  it('calls onAccept when Accept button is clicked', () => {
    const onAccept = vi.fn();
    const onDiscard = vi.fn();

    render(
      <ProofreadDiffView
        original={mockOriginal}
        result={mockResult}
        onAccept={onAccept}
        onDiscard={onDiscard}
      />
    );

    const acceptButton = screen.getByTestId('accept-button');
    fireEvent.click(acceptButton);

    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('calls onDiscard when Discard button is clicked', () => {
    const onAccept = vi.fn();
    const onDiscard = vi.fn();

    render(
      <ProofreadDiffView
        original={mockOriginal}
        result={mockResult}
        onAccept={onAccept}
        onDiscard={onDiscard}
      />
    );

    const discardButton = screen.getByTestId('discard-button');
    fireEvent.click(discardButton);

    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('renders highlights for corrections', () => {
    const onAccept = vi.fn();
    const onDiscard = vi.fn();

    render(
      <ProofreadDiffView
        original={mockOriginal}
        result={mockResult}
        onAccept={onAccept}
        onDiscard={onDiscard}
      />
    );

    expect(screen.getByTestId('highlight-original-0')).toBeInTheDocument();
    expect(screen.getByTestId('highlight-corrected-0')).toBeInTheDocument();
  });

  it('shows tooltip on hover', () => {
    const onAccept = vi.fn();
    const onDiscard = vi.fn();

    render(
      <ProofreadDiffView
        original={mockOriginal}
        result={mockResult}
        onAccept={onAccept}
        onDiscard={onDiscard}
      />
    );

    const highlight = screen.getByTestId('highlight-original-0');
    fireEvent.mouseEnter(highlight);

    expect(screen.getByTestId('tooltip-0')).toBeInTheDocument();

    fireEvent.mouseLeave(highlight);
  });

  it('has proper accessibility attributes', () => {
    const onAccept = vi.fn();
    const onDiscard = vi.fn();

    render(
      <ProofreadDiffView
        original={mockOriginal}
        result={mockResult}
        onAccept={onAccept}
        onDiscard={onDiscard}
      />
    );

    const region = screen.getByRole('region', { name: 'Proofreading results' });
    expect(region).toBeInTheDocument();

    const acceptButton = screen.getByLabelText('Apply corrections');
    expect(acceptButton).toBeInTheDocument();

    const discardButton = screen.getByLabelText('Keep original text');
    expect(discardButton).toBeInTheDocument();
  });
});
