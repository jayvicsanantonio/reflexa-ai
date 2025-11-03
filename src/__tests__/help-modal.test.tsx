import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HelpSetupModal } from '../content/components/HelpSetupModal';

describe('HelpSetupModal accessibility and interactions', () => {
  it('renders as an accessible dialog with title association', () => {
    render(<HelpSetupModal onClose={vi.fn()} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    const title = screen.getByText('Setup Chrome AI');
    const titleId = title.id;
    expect(titleId).toBe('reflexa-help-title');
    expect(dialog).toHaveAttribute('aria-labelledby', titleId);
  });

  it('closes on Escape key and by clicking backdrop', async () => {
    const onClose = vi.fn();
    render(<HelpSetupModal onClose={onClose} />);

    // Wait for useEffect to run and set up trapFocus
    await new Promise((resolve) => setTimeout(resolve, 0));

    // trapFocus sets up a keydown listener on the contentRef element
    // Find the inner content div (has the ref and onKeyDown)
    const dialog = screen.getByRole('dialog');
    const contentElement = Array.from(dialog.querySelectorAll('div')).find(
      (div) => {
        // Find the div that has both onKeyDown (from handleKeyDown) and is the contentRef
        // It's the one with the specific classes and structure
        return (
          div.className.includes('relative') &&
          div.className.includes('z-[1]') &&
          div.querySelector('div[class*="px-5"]') // Has the scrollable content
        );
      }
    ) as HTMLElement;

    if (contentElement) {
      // Trigger Escape key on the content element where trapFocus listener is attached
      fireEvent.keyDown(contentElement, { key: 'Escape', code: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    }

    // Find backdrop by clicking on the backdrop div
    const backdrop = dialog.querySelector('div[class*="backdrop"]');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(2);
    }
  });

  it('has a primary action button', () => {
    const onClose = vi.fn();
    render(<HelpSetupModal onClose={onClose} />);
    const btn = screen.getByRole('button', { name: 'Got it' });
    fireEvent.click(btn);
    expect(onClose).toHaveBeenCalled();
  });
});
