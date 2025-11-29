import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SharedModalFooter } from './ModalFooter';

describe('SharedModalFooter', () => {
  it('renders primary button when label and handler provided', () => {
    const onPrimary = vi.fn();
    render(<SharedModalFooter primaryLabel="Done" onPrimary={onPrimary} />);

    const button = screen.getByRole('button', { name: 'Done' });
    expect(button).toBeInTheDocument();
  });

  it('calls onPrimary when primary button is clicked', () => {
    const onPrimary = vi.fn();
    render(<SharedModalFooter primaryLabel="Done" onPrimary={onPrimary} />);

    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });

  it('renders secondary button when label and handler provided', () => {
    const onSecondary = vi.fn();
    render(
      <SharedModalFooter
        primaryLabel="Save"
        onPrimary={vi.fn()}
        secondaryLabel="Cancel"
        onSecondary={onSecondary}
      />
    );

    const button = screen.getByRole('button', { name: 'Cancel' });
    expect(button).toBeInTheDocument();
  });

  it('calls onSecondary when secondary button is clicked', () => {
    const onSecondary = vi.fn();
    render(
      <SharedModalFooter
        primaryLabel="Save"
        onPrimary={vi.fn()}
        secondaryLabel="Cancel"
        onSecondary={onSecondary}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it('disables primary button when primaryDisabled is true', () => {
    render(
      <SharedModalFooter
        primaryLabel="Done"
        onPrimary={vi.fn()}
        primaryDisabled={true}
      />
    );

    const button = screen.getByRole('button', { name: 'Done' });
    expect(button).toBeDisabled();
  });

  it('does not render buttons when no labels provided', () => {
    const { container } = render(<SharedModalFooter />);
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});
