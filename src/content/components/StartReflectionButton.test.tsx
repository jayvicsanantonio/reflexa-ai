import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StartReflectionButton } from './StartReflectionButton';

// Mock chrome.runtime.sendMessage
const mockSendMessage = vi.fn();
global.chrome = {
  runtime: {
    sendMessage: mockSendMessage,
  },
} as any;

describe('StartReflectionButton', () => {
  const mockSummary = ['Summary point 1', 'Summary point 2', 'Summary point 3'];
  const mockPrompts = [
    'What insights resonate with you?',
    'How can you apply this?',
  ];
  const mockOnDraftGenerated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default state', () => {
    render(
      <StartReflectionButton
        summary={mockSummary}
        prompts={mockPrompts}
        onDraftGenerated={mockOnDraftGenerated}
      />
    );

    const button = screen.getByTestId('start-reflection-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Start Reflection');
    expect(button).not.toBeDisabled();
  });

  it('renders with disabled state', () => {
    render(
      <StartReflectionButton
        summary={mockSummary}
        prompts={mockPrompts}
        onDraftGenerated={mockOnDraftGenerated}
        disabled={true}
      />
    );

    const button = screen.getByTestId('start-reflection-button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('reflexa-start-reflection-button--disabled');
  });

  it('shows loading state when clicked', async () => {
    mockSendMessage.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              success: true,
              data: 'Generated draft text',
              apiUsed: 'writer',
              duration: 1000,
            });
          }, 100);
        })
    );

    render(
      <StartReflectionButton
        summary={mockSummary}
        prompts={mockPrompts}
        onDraftGenerated={mockOnDraftGenerated}
      />
    );

    const button = screen.getByTestId('start-reflection-button');
    fireEvent.click(button);

    // Should show loading state
    await waitFor(() => {
      expect(button).toHaveTextContent('Generating...');
      expect(button).toHaveClass('reflexa-start-reflection-button--loading');
      expect(button).toBeDisabled();
    });
  });

  it('calls Writer API with correct parameters', async () => {
    mockSendMessage.mockResolvedValue({
      success: true,
      data: 'Generated draft text',
      apiUsed: 'writer',
      duration: 1000,
    });

    render(
      <StartReflectionButton
        summary={mockSummary}
        prompts={mockPrompts}
        onDraftGenerated={mockOnDraftGenerated}
      />
    );

    const button = screen.getByTestId('start-reflection-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'write',
        payload: {
          prompt: expect.stringContaining('What insights resonate with you?'),
          options: {
            tone: 'neutral',
            format: 'plain-text',
            length: 'short',
          },
        },
      });
    });
  });

  it('shows success state and calls callback on successful generation', async () => {
    const mockDraft = 'This is a generated reflection draft.';
    mockSendMessage.mockResolvedValue({
      success: true,
      data: mockDraft,
      apiUsed: 'writer',
      duration: 1000,
    });

    render(
      <StartReflectionButton
        summary={mockSummary}
        prompts={mockPrompts}
        onDraftGenerated={mockOnDraftGenerated}
      />
    );

    const button = screen.getByTestId('start-reflection-button');
    fireEvent.click(button);

    // Wait for success state
    await waitFor(() => {
      expect(button).toHaveTextContent('Draft Inserted!');
      expect(button).toHaveClass('reflexa-start-reflection-button--success');
    });

    // Verify callback was called with draft
    expect(mockOnDraftGenerated).toHaveBeenCalledWith(mockDraft);
  });

  it('handles API errors gracefully', async () => {
    mockSendMessage.mockResolvedValue({
      success: false,
      error: 'Writer API unavailable',
      duration: 500,
    });

    render(
      <StartReflectionButton
        summary={mockSummary}
        prompts={mockPrompts}
        onDraftGenerated={mockOnDraftGenerated}
      />
    );

    const button = screen.getByTestId('start-reflection-button');
    fireEvent.click(button);

    // Should return to default state after error
    await waitFor(() => {
      expect(button).toHaveTextContent('Start Reflection');
      expect(button).not.toBeDisabled();
    });

    // Callback should not be called on error
    expect(mockOnDraftGenerated).not.toHaveBeenCalled();
  });

  it('does not trigger generation when disabled', () => {
    render(
      <StartReflectionButton
        summary={mockSummary}
        prompts={mockPrompts}
        onDraftGenerated={mockOnDraftGenerated}
        disabled={true}
      />
    );

    const button = screen.getByTestId('start-reflection-button');
    fireEvent.click(button);

    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('does not trigger generation when already loading', async () => {
    mockSendMessage.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              success: true,
              data: 'Generated draft',
              apiUsed: 'writer',
              duration: 1000,
            });
          }, 200);
        })
    );

    render(
      <StartReflectionButton
        summary={mockSummary}
        prompts={mockPrompts}
        onDraftGenerated={mockOnDraftGenerated}
      />
    );

    const button = screen.getByTestId('start-reflection-button');

    // Click once
    fireEvent.click(button);

    // Try to click again while loading
    fireEvent.click(button);

    // Should only be called once
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledTimes(1);
    });
  });

  it('has proper accessibility attributes', () => {
    render(
      <StartReflectionButton
        summary={mockSummary}
        prompts={mockPrompts}
        onDraftGenerated={mockOnDraftGenerated}
      />
    );

    const button = screen.getByTestId('start-reflection-button');
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute(
      'aria-label',
      'Start reflection with AI-generated draft'
    );
  });

  it('includes summary and reflection prompt in prompt', async () => {
    mockSendMessage.mockResolvedValue({
      success: true,
      data: 'Generated draft',
      apiUsed: 'writer',
      duration: 1000,
    });

    render(
      <StartReflectionButton
        summary={mockSummary}
        prompts={mockPrompts}
        onDraftGenerated={mockOnDraftGenerated}
      />
    );

    const button = screen.getByTestId('start-reflection-button');
    fireEvent.click(button);

    await waitFor(() => {
      const call = mockSendMessage.mock.calls[0][0];
      expect(call.payload.prompt).toContain('Summary point 1');
      expect(call.payload.prompt).toContain('Summary point 2');
      expect(call.payload.prompt).toContain('Summary point 3');
      expect(call.payload.prompt).toContain('What insights resonate with you?');
    });
  });
});
