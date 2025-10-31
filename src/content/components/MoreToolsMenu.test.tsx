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

  it('should show universal tools section', () => {
    const onToggleAmbient = vi.fn();
    const onTranslateSummary = vi.fn();
    render(
      <MoreToolsMenu
        currentScreen="summary"
        currentFormat="bullets"
        onToggleAmbient={onToggleAmbient}
        onTranslateSummary={onTranslateSummary}
      />
    );

    const trigger = screen.getByTestId('more-tools-trigger');
    fireEvent.click(trigger);

    expect(screen.getByText('Tools')).toBeTruthy();
    expect(screen.getByTestId('ambient-sound-toggle')).toBeTruthy();
    expect(screen.getByTestId('language-select')).toBeTruthy();
    expect(screen.getByTestId('translate-apply-button')).toBeTruthy();
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

    expect(screen.getByText('Format')).toBeTruthy();
    expect(screen.getByTestId('format-option-bullets')).toBeTruthy();
    expect(screen.getByTestId('format-option-paragraph')).toBeTruthy();
    expect(screen.getByTestId('format-option-headline-bullets')).toBeTruthy();
  });

  it('should show generate draft option in reflection screen when no content', () => {
    const onGenerateDraft = vi.fn();
    render(
      <MoreToolsMenu
        currentScreen="reflection"
        onGenerateDraft={onGenerateDraft}
        hasReflectionContent={false}
        summary={['Summary 1', 'Summary 2', 'Summary 3']}
      />
    );

    const trigger = screen.getByTestId('more-tools-trigger');
    fireEvent.click(trigger);

    expect(screen.getByText('Get Started')).toBeTruthy();
    expect(screen.getByTestId('generate-draft-option')).toBeTruthy();
  });

  it('should show tone options in reflection screen when there is content', () => {
    const onToneSelect = vi.fn();
    render(
      <MoreToolsMenu
        currentScreen="reflection"
        onToneSelect={onToneSelect}
        hasReflectionContent={true}
      />
    );

    const trigger = screen.getByTestId('more-tools-trigger');
    fireEvent.click(trigger);

    expect(screen.getByText('Rewrite Tone')).toBeTruthy();
    expect(screen.getByTestId('tone-option-calm')).toBeTruthy();
    expect(screen.getByTestId('tone-option-concise')).toBeTruthy();
    expect(screen.getByTestId('tone-option-empathetic')).toBeTruthy();
    expect(screen.getByTestId('tone-option-academic')).toBeTruthy();
  });

  it('should not show tone options when there is no content', () => {
    const onToneSelect = vi.fn();
    render(
      <MoreToolsMenu
        currentScreen="reflection"
        onToneSelect={onToneSelect}
        hasReflectionContent={false}
      />
    );

    const trigger = screen.getByTestId('more-tools-trigger');
    fireEvent.click(trigger);

    expect(screen.queryByText('Rewrite Tone')).toBeNull();
  });

  it('should show proofread option in reflection screen when available and has content', () => {
    const onProofread = vi.fn();
    render(
      <MoreToolsMenu
        currentScreen="reflection"
        onProofread={onProofread}
        proofreaderAvailable={true}
        hasReflectionContent={true}
      />
    );

    const trigger = screen.getByTestId('more-tools-trigger');
    fireEvent.click(trigger);

    expect(screen.getByText('Polish')).toBeTruthy();
    expect(screen.getByTestId('proofread-option')).toBeTruthy();
  });

  it('should not show proofread option when there is no content', () => {
    const onProofread = vi.fn();
    render(
      <MoreToolsMenu
        currentScreen="reflection"
        onProofread={onProofread}
        proofreaderAvailable={true}
        hasReflectionContent={false}
      />
    );

    const trigger = screen.getByTestId('more-tools-trigger');
    fireEvent.click(trigger);

    expect(screen.queryByTestId('proofread-option')).toBeNull();
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

    expect(screen.queryByText('Format')).toBeNull();
  });

  it('should call onToggleAmbient when ambient sound is toggled', () => {
    const onToggleAmbient = vi.fn();
    render(
      <MoreToolsMenu
        currentScreen="summary"
        ambientMuted={false}
        onToggleAmbient={onToggleAmbient}
      />
    );

    const trigger = screen.getByTestId('more-tools-trigger');
    fireEvent.click(trigger);

    const ambientToggle = screen.getByTestId('ambient-sound-toggle');
    fireEvent.click(ambientToggle);

    expect(onToggleAmbient).toHaveBeenCalledWith(true);
  });

  it('should call onTranslateSummary when translate language is selected', () => {
    const onTranslateSummary = vi.fn();
    render(
      <MoreToolsMenu
        currentScreen="summary"
        onTranslateSummary={onTranslateSummary}
        currentLanguage="en"
      />
    );

    const trigger = screen.getByTestId('more-tools-trigger');
    fireEvent.click(trigger);

    const select = screen.getByTestId('language-select');
    fireEvent.change(select, { target: { value: 'es' } });
    const apply = screen.getByTestId('translate-apply-button');
    fireEvent.click(apply);

    expect(onTranslateSummary).toHaveBeenCalledWith('es');
  });

  it('should show correct ambient sound icon based on muted state', () => {
    const { rerender } = render(
      <MoreToolsMenu
        currentScreen="summary"
        ambientMuted={false}
        onToggleAmbient={vi.fn()}
      />
    );

    let trigger = screen.getByTestId('more-tools-trigger');
    fireEvent.click(trigger);

    expect(screen.getByText('Mute')).toBeTruthy();

    // Close menu
    fireEvent.click(trigger);

    // Rerender with muted state
    rerender(
      <MoreToolsMenu
        currentScreen="summary"
        ambientMuted={true}
        onToggleAmbient={vi.fn()}
      />
    );

    trigger = screen.getByTestId('more-tools-trigger');
    fireEvent.click(trigger);

    expect(screen.getByText('Unmute')).toBeTruthy();
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

  it('should call onGenerateDraft when generate draft is clicked', () => {
    const onGenerateDraft = vi.fn();
    render(
      <MoreToolsMenu
        currentScreen="reflection"
        onGenerateDraft={onGenerateDraft}
        hasReflectionContent={false}
        summary={['Summary 1', 'Summary 2', 'Summary 3']}
      />
    );

    const trigger = screen.getByTestId('more-tools-trigger');
    fireEvent.click(trigger);

    const generateOption = screen.getByTestId('generate-draft-option');
    fireEvent.click(generateOption);

    expect(onGenerateDraft).toHaveBeenCalled();
  });

  it('should call onToneSelect when tone is selected', () => {
    const onToneSelect = vi.fn();
    render(
      <MoreToolsMenu
        currentScreen="reflection"
        onToneSelect={onToneSelect}
        hasReflectionContent={true}
      />
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
        hasReflectionContent={true}
        activeReflectionIndex={0}
      />
    );

    const trigger = screen.getByTestId('more-tools-trigger');
    fireEvent.click(trigger);

    const proofreadOption = screen.getByTestId('proofread-option');
    fireEvent.click(proofreadOption);

    expect(onProofread).toHaveBeenCalledWith(0);
  });

  it('should keep menu open after selecting an option', async () => {
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

    // Menu should stay open
    await vi.waitFor(() => {
      expect(screen.getByTestId('more-tools-dropdown')).toBeTruthy();
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
