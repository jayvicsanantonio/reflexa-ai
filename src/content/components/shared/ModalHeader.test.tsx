import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SharedModalHeader } from './ModalHeader';

describe('SharedModalHeader', () => {
  it('renders title correctly', () => {
    render(<SharedModalHeader title="Test Title" onClose={vi.fn()} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(
      <SharedModalHeader
        title="Test Title"
        subtitle="Test Subtitle"
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(<SharedModalHeader title="Test Title" onClose={vi.fn()} />);
    expect(screen.queryByText('Test Subtitle')).not.toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <SharedModalHeader
        title="Test Title"
        icon={<span data-testid="test-icon">🔧</span>}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<SharedModalHeader title="Test Title" onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('applies titleId to the title element', () => {
    render(
      <SharedModalHeader
        title="Test Title"
        titleId="custom-title-id"
        onClose={vi.fn()}
      />
    );

    const title = screen.getByText('Test Title');
    expect(title).toHaveAttribute('id', 'custom-title-id');
  });
});
