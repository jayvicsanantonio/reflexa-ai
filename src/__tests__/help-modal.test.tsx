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

  it('closes on Escape key and by clicking backdrop', () => {
    const onClose = vi.fn();
    const { container } = render(<HelpSetupModal onClose={onClose} />);

    const content = container.querySelector('.reflexa-modal');
    expect(content).toBeTruthy();
    if (content) {
      fireEvent.keyDown(content, { key: 'Escape' });
    }
    expect(onClose).toHaveBeenCalled();

    const backdrop = container.querySelector('.reflexa-error-modal__backdrop');
    expect(backdrop).toBeTruthy();
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('has a primary action button', () => {
    const onClose = vi.fn();
    render(<HelpSetupModal onClose={onClose} />);
    const btn = screen.getByRole('button', { name: 'Got it' });
    fireEvent.click(btn);
    expect(onClose).toHaveBeenCalled();
  });
});
