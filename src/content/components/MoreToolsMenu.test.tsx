import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MoreToolsMenu } from './MoreToolsMenu';

describe('MoreToolsMenu', () => {
  it('should render the More button', () => {
    render(<MoreToolsMenu currentScreen="summary" currentFormat="bullets" />);

    expect(screen.getByTestId('more-tools-trigger')).toBeTruthy();
    expect(screen.getByText('More')).toBeTruthy();
  });

  it('should open dropdown when trigger is clicked', () => {
    render(
      <MoreToolsMenu
        currentScreen="summary"
        currentFormat="bullets"
        onFormatChange={vi.fn()}
      />
    );

    const trigger = screen.getByTestId('more-tools-trigger');
    fireEvent.click(trigger);

    expect(screen.getByTestId('more-tools-dropdown')).toBeTruthy();
  });

  it('should show summary format options in summary screen', () => {
    const onFormatChange = vi.fn();
    render(
      <MoreToolsMenu
        currentScreen="summary"
        currentFormat="bullets"
        onFormatChange={onFormatChange}
      />
    );

    const trigger = screen.getByTestId('more-tools-trigger');
    fireEvent.click(trigger);

    expect(screen.getByText('Summary Format')).toBeTruthy();
    expect(screen.getByTestId('format-option-bullets')).toBeTruthy();
    expect(screen.getByTestId('format-option-paragraph')).toBeTruthy();
    expect(screen.getByTestId('format-option-headline-bullets')).toBeTruthy();
  });

  it('should show tone options in reflection screen', () => {
    const onToneSelect = vi.fn();
    render(
      <MoreToolsMenu currentScreen="reflection" onToneSelect={onToneSelect} />
    );

    const trigger = screen.getByTestId('more-tools-trigger');
    fireEvent.click(trigger);

    expect(screen.getByText('Rewrite Tone')).toBeTruthy();
    expect(screen.getByTestId('tone-option-calm')).toBeTruthy();
    expect(screen.getByTestId('tone-option-concise')).toBeTruthy();
    expect(screen.getByTestId('tone-option-empathetic')).toBeTruthy();
    expect(screen.getByTestId('tone-option-academic')).toBeTruthy();
  });

  it('should show proofread option in reflection screen when available', () => {
    const onProofread = vi.fn();
    render(
      <MoreToolsMenu
        currentScreen="reflection"
        onToneSelect={vi.fn()}
        onProofread={onProofread}
        proofreaderAvailable={true}
      />
    );

    const trigger = screen.getByTestId('more-tools-trigger');
    fireEvent.click(trigger);

    expect(screen.getByTestId('proofread-option')).toBeTruthy();
  });

  it('should not show summary format in reflection screen', () => {
    render(
      <MoreToolsMenu
        currentScreen="reflection"
        currentFormat="bullets"
        onFormatChange={vi.fn()}
        onToneSelect={vi.fn()}
      />
    );

    const trigger = screen.getByTestId('more-tools-trigger');
    fireEvent.click(trigger);

    expect(screen.queryByText('Summary Format')).toBeNull();
  });

  it('should not show tone options in summary screen', () => {
    render(
      <MoreToolsMenu
        currentScreen="summary"
        currentFormat="bullets"
        onFormatChange={vi.fn()}
        onToneSelect={vi.fn()}
      />
    );

    const trigger = screen.getByTestId('more-tools-trigger');
    fireEvent.click(trigger);

    expect(screen.queryByText('Rewrite Tone')).toBeNull();
  });

  it('should call onFormatChange when format is selected', async () => {
    const onFormatChange = vi.fn().mockResolvedValue(undefined);
    render(
      <MoreToolsMenu
        currentScreen="summary"
        currentFormat="bullets"
        onFormatChange={onFormatChange}
      />
    );

    const trigger = screen.getByTestId('more-tools-trigger');
    fireEvent.click(trigger);

    const paragraphOption = screen.getByTestId('format-option-paragraph');
    fireEvent.click(paragraphOption);

    expect(onFormatChange).toHaveBeenCalledWith('paragraph');
  });

  it('should call onToneSelect when tone is selected', () => {
    const onToneSelect = vi.fn();
    render(
      <MoreToolsMenu currentScreen="reflection" onToneSelect={onToneSelect} />
    );

    const trigger = screen.getByTestId('more-tools-trigger');
    fireEvent.click(trigger);

    const calmOption = screen.getByTestId('tone-option-calm');
    fireEvent.click(calmOption);

    expect(onToneSelect).toHaveBeenCalledWith('calm');
  });

  it('should call onProofread when proofread is clicked', () => {
    const onProofread = vi.fn();
    render(
      <MoreToolsMenu
        currentScreen="reflection"
        onProofread={onProofread}
        proofreaderAvailable={true}
        activeReflectionIndex={0}
      />
    );

    const trigger = screen.getByTestId('more-tools-trigger');
    fireEvent.click(trigger);

    const proofreadOption = screen.getByTestId('proofread-option');
    fireEvent.click(proofreadOption);

    expect(onProofread).toHaveBeenCalledWith(0);
  });

  it('should close menu after selecting an option', async () => {
    const onFormatChange = vi.fn().mockResolvedValue(undefined);
    render(
      <MoreToolsMenu
        currentScreen="summary"
        currentFormat="bullets"
        onFormatChange={onFormatChange}
      />
    );

    const trigger = screen.getByTestId('more-tools-trigger');
    fireEvent.click(trigger);

    const paragraphOption = screen.getByTestId('format-option-paragraph');
    fireEvent.click(paragraphOption);

    // Wait for async operation to complete
    await vi.waitFor(() => {
      expect(screen.queryByTestId('more-tools-dropdown')).toBeNull();
    });
  });

  it('should close menu when clicking outside', () => {
    render(
      <div>
        <MoreToolsMenu
          currentScreen="summary"
          currentFormat="bullets"
          onFormatChange={vi.fn()}
        />
        <div data-testid="outside-element">Outside</div>
      </div>
    );

    const trigger = screen.getByTestId('more-tools-trigger');
    fireEvent.click(trigger);

    expect(screen.getByTestId('more-tools-dropdown')).toBeTruthy();

    const outsideElement = screen.getByTestId('outside-element');
    fireEvent.mouseDown(outsideElement);

    expect(screen.queryByTestId('more-tools-dropdown')).toBeNull();
  });

  it('should close menu when Escape key is pressed', () => {
    render(
      <MoreToolsMenu
        currentScreen="summary"
        currentFormat="bullets"
        onFormatChange={vi.fn()}
      />
    );

    const trigger = screen.getByTestId('more-tools-trigger');
    fireEvent.click(trigger);

    expect(screen.getByTestId('more-tools-dropdown')).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByTestId('more-tools-dropdown')).toBeNull();
  });
});
