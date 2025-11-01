import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TonePresetChips } from './TonePresetChips';

describe('TonePresetChips', () => {
  it('should render all four tone chips', () => {
    const onToneSelect = vi.fn();
    render(<TonePresetChips onToneSelect={onToneSelect} />);

    expect(screen.getByTestId('tone-preset-chips')).toBeTruthy();
    expect(screen.getByTestId('tone-chip-calm')).toBeTruthy();
    expect(screen.getByTestId('tone-chip-concise')).toBeTruthy();
    expect(screen.getByTestId('tone-chip-empathetic')).toBeTruthy();
    expect(screen.getByTestId('tone-chip-academic')).toBeTruthy();
  });

  it('should display correct labels for each tone', () => {
    const onToneSelect = vi.fn();
    render(<TonePresetChips onToneSelect={onToneSelect} />);

    expect(screen.getByText('Calm')).toBeTruthy();
    expect(screen.getByText('Concise')).toBeTruthy();
    expect(screen.getByText('Empathetic')).toBeTruthy();
    expect(screen.getByText('Academic')).toBeTruthy();
  });

  it('should call onToneSelect when a chip is clicked', () => {
    const onToneSelect = vi.fn();
    render(<TonePresetChips onToneSelect={onToneSelect} />);

    const calmChip = screen.getByTestId('tone-chip-calm');
    fireEvent.click(calmChip);

    expect(onToneSelect).toHaveBeenCalledWith('calm');
  });

  it('should highlight selected tone chip', () => {
    const onToneSelect = vi.fn();
    render(
      <TonePresetChips selectedTone="empathetic" onToneSelect={onToneSelect} />
    );

    const empatheticChip = screen.getByTestId('tone-chip-empathetic');
    expect(empatheticChip.className).toContain(
      'reflexa-tone-preset-chip--selected'
    );
  });

  it('should not highlight unselected chips', () => {
    const onToneSelect = vi.fn();
    render(<TonePresetChips selectedTone="calm" onToneSelect={onToneSelect} />);

    const conciseChip = screen.getByTestId('tone-chip-concise');
    expect(conciseChip.className).not.toContain(
      'reflexa-tone-preset-chip--selected'
    );
  });

  it('should be disabled when disabled prop is true', () => {
    const onToneSelect = vi.fn();
    render(<TonePresetChips onToneSelect={onToneSelect} disabled={true} />);

    const calmChip = screen.getByTestId('tone-chip-calm');
    expect(calmChip.hasAttribute('disabled')).toBe(true);

    // Try to click
    fireEvent.click(calmChip);

    // Should not call handler
    expect(onToneSelect).not.toHaveBeenCalled();
  });

  it('should show loading spinner when isLoading is true and tone is selected', () => {
    const onToneSelect = vi.fn();
    render(
      <TonePresetChips
        selectedTone="academic"
        onToneSelect={onToneSelect}
        isLoading={true}
      />
    );

    const academicChip = screen.getByTestId('tone-chip-academic');
    const spinner = academicChip.querySelector(
      '.reflexa-tone-preset-chip__spinner'
    );

    expect(spinner).toBeTruthy();
  });

  it('should not show loading spinner on unselected chips', () => {
    const onToneSelect = vi.fn();
    render(
      <TonePresetChips
        selectedTone="calm"
        onToneSelect={onToneSelect}
        isLoading={true}
      />
    );

    const conciseChip = screen.getByTestId('tone-chip-concise');
    const spinner = conciseChip.querySelector(
      '.reflexa-tone-preset-chip__spinner'
    );

    expect(spinner).toBeNull();
  });

  it('should not call onToneSelect when loading', () => {
    const onToneSelect = vi.fn();
    render(
      <TonePresetChips
        selectedTone="calm"
        onToneSelect={onToneSelect}
        isLoading={true}
      />
    );

    const conciseChip = screen.getByTestId('tone-chip-concise');
    fireEvent.click(conciseChip);

    expect(onToneSelect).not.toHaveBeenCalled();
  });

  it('should have correct aria attributes', () => {
    const onToneSelect = vi.fn();
    render(<TonePresetChips selectedTone="calm" onToneSelect={onToneSelect} />);

    const calmChip = screen.getByTestId('tone-chip-calm');
    expect(calmChip.getAttribute('aria-pressed')).toBe('true');

    const conciseChip = screen.getByTestId('tone-chip-concise');
    expect(conciseChip.getAttribute('aria-pressed')).toBe('false');
  });

  it('should have descriptive aria-label for each chip', () => {
    const onToneSelect = vi.fn();
    render(<TonePresetChips onToneSelect={onToneSelect} />);

    const calmChip = screen.getByTestId('tone-chip-calm');
    expect(calmChip.getAttribute('aria-label')).toContain('Calm tone');
    expect(calmChip.getAttribute('aria-label')).toContain(
      'Peaceful and centered'
    );
  });

  it('should allow selecting different tones', () => {
    const onToneSelect = vi.fn();
    render(<TonePresetChips onToneSelect={onToneSelect} />);

    // Click calm
    fireEvent.click(screen.getByTestId('tone-chip-calm'));
    expect(onToneSelect).toHaveBeenCalledWith('calm');

    // Click academic
    fireEvent.click(screen.getByTestId('tone-chip-academic'));
    expect(onToneSelect).toHaveBeenCalledWith('academic');

    expect(onToneSelect).toHaveBeenCalledTimes(2);
  });

  it('should display disabled class when disabled', () => {
    const onToneSelect = vi.fn();
    render(<TonePresetChips onToneSelect={onToneSelect} disabled={true} />);

    const calmChip = screen.getByTestId('tone-chip-calm');
    expect(calmChip.className).toContain('reflexa-tone-preset-chip--disabled');
  });

  it('should display disabled class when loading', () => {
    const onToneSelect = vi.fn();
    render(
      <TonePresetChips
        selectedTone="calm"
        onToneSelect={onToneSelect}
        isLoading={true}
      />
    );

    const conciseChip = screen.getByTestId('tone-chip-concise');
    expect(conciseChip.className).toContain(
      'reflexa-tone-preset-chip--disabled'
    );
  });
});
