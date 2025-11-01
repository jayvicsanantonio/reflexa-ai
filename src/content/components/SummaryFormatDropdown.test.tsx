import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SummaryFormatDropdown } from './SummaryFormatDropdown';

describe('SummaryFormatDropdown', () => {
  it('should render with selected format', () => {
    const onFormatChange = vi.fn();
    render(
      <SummaryFormatDropdown
        selectedFormat="bullets"
        onFormatChange={onFormatChange}
      />
    );

    expect(screen.getByTestId('summary-format-dropdown')).toBeTruthy();
    expect(screen.getByTestId('summary-format-trigger').textContent).toContain(
      'Bullets'
    );
  });

  it('should open dropdown menu when trigger is clicked', () => {
    const onFormatChange = vi.fn();
    render(
      <SummaryFormatDropdown
        selectedFormat="bullets"
        onFormatChange={onFormatChange}
      />
    );

    const trigger = screen.getByTestId('summary-format-trigger');
    fireEvent.click(trigger);

    expect(screen.getByTestId('summary-format-menu')).toBeTruthy();
    expect(screen.getByTestId('summary-format-option-bullets')).toBeTruthy();
    expect(screen.getByTestId('summary-format-option-paragraph')).toBeTruthy();
    expect(
      screen.getByTestId('summary-format-option-headline-bullets')
    ).toBeTruthy();
  });

  it('should call onFormatChange when a different format is selected', () => {
    const onFormatChange = vi.fn();
    render(
      <SummaryFormatDropdown
        selectedFormat="bullets"
        onFormatChange={onFormatChange}
      />
    );

    // Open dropdown
    const trigger = screen.getByTestId('summary-format-trigger');
    fireEvent.click(trigger);

    // Select paragraph format
    const paragraphOption = screen.getByTestId(
      'summary-format-option-paragraph'
    );
    fireEvent.click(paragraphOption);

    expect(onFormatChange).toHaveBeenCalledWith('paragraph');
  });

  it('should not call onFormatChange when same format is selected', () => {
    const onFormatChange = vi.fn();
    render(
      <SummaryFormatDropdown
        selectedFormat="bullets"
        onFormatChange={onFormatChange}
      />
    );

    // Open dropdown
    const trigger = screen.getByTestId('summary-format-trigger');
    fireEvent.click(trigger);

    // Select same format
    const bulletsOption = screen.getByTestId('summary-format-option-bullets');
    fireEvent.click(bulletsOption);

    expect(onFormatChange).not.toHaveBeenCalled();
  });

  it('should close dropdown after selecting a format', () => {
    const onFormatChange = vi.fn();
    render(
      <SummaryFormatDropdown
        selectedFormat="bullets"
        onFormatChange={onFormatChange}
      />
    );

    // Open dropdown
    const trigger = screen.getByTestId('summary-format-trigger');
    fireEvent.click(trigger);

    // Select format
    const paragraphOption = screen.getByTestId(
      'summary-format-option-paragraph'
    );
    fireEvent.click(paragraphOption);

    // Menu should be closed
    expect(screen.queryByTestId('summary-format-menu')).toBeNull();
  });

  it('should be disabled when disabled prop is true', () => {
    const onFormatChange = vi.fn();
    render(
      <SummaryFormatDropdown
        selectedFormat="bullets"
        onFormatChange={onFormatChange}
        disabled={true}
      />
    );

    const trigger = screen.getByTestId('summary-format-trigger');
    expect(trigger.hasAttribute('disabled')).toBe(true);

    // Try to click
    fireEvent.click(trigger);

    // Menu should not open
    expect(screen.queryByTestId('summary-format-menu')).toBeNull();
    expect(onFormatChange).not.toHaveBeenCalled();
  });

  it('should close dropdown when clicking outside', () => {
    const onFormatChange = vi.fn();
    render(
      <div>
        <SummaryFormatDropdown
          selectedFormat="bullets"
          onFormatChange={onFormatChange}
        />
        <div data-testid="outside-element">Outside</div>
      </div>
    );

    // Open dropdown
    const trigger = screen.getByTestId('summary-format-trigger');
    fireEvent.click(trigger);

    expect(screen.getByTestId('summary-format-menu')).toBeTruthy();

    // Click outside
    const outsideElement = screen.getByTestId('outside-element');
    fireEvent.mouseDown(outsideElement);

    // Menu should be closed
    expect(screen.queryByTestId('summary-format-menu')).toBeNull();
  });

  it('should close dropdown when Escape key is pressed', () => {
    const onFormatChange = vi.fn();
    render(
      <SummaryFormatDropdown
        selectedFormat="bullets"
        onFormatChange={onFormatChange}
      />
    );

    // Open dropdown
    const trigger = screen.getByTestId('summary-format-trigger');
    fireEvent.click(trigger);

    expect(screen.getByTestId('summary-format-menu')).toBeTruthy();

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });

    // Menu should be closed
    expect(screen.queryByTestId('summary-format-menu')).toBeNull();
  });

  it('should display correct descriptions for each format', () => {
    const onFormatChange = vi.fn();
    render(
      <SummaryFormatDropdown
        selectedFormat="bullets"
        onFormatChange={onFormatChange}
      />
    );

    // Open dropdown
    const trigger = screen.getByTestId('summary-format-trigger');
    fireEvent.click(trigger);

    // Check that all format options are present with descriptions
    expect(screen.getByText('3 concise bullet points')).toBeTruthy();
    expect(screen.getByText('Single flowing paragraph')).toBeTruthy();
    expect(screen.getByText('Headline with bullet points')).toBeTruthy();
  });

  it('should show selected class on selected option', () => {
    const onFormatChange = vi.fn();
    render(
      <SummaryFormatDropdown
        selectedFormat="paragraph"
        onFormatChange={onFormatChange}
      />
    );

    // Open dropdown
    const trigger = screen.getByTestId('summary-format-trigger');
    fireEvent.click(trigger);

    // Check that selected option has the selected class
    const paragraphOption = screen.getByTestId(
      'summary-format-option-paragraph'
    );
    expect(paragraphOption.className).toContain(
      'reflexa-summary-format-dropdown__option--selected'
    );
  });
});
