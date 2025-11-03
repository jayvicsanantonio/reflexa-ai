import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startAIStream } from './messageBus';

describe('content/runtime/messageBus startAIStream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('wires chunk and complete events from port', async () => {
    let savedListener: ((msg: unknown) => void) | null = null;
    const connectMock = chrome.runtime.connect as unknown as {
      mockReturnValueOnce: (v: unknown) => unknown;
    };
    connectMock.mockReturnValueOnce({
      name: 'ai-stream',
      onDisconnect: { addListener: vi.fn() },
      onMessage: {
        addListener: (fn: (msg: unknown) => void) => (savedListener = fn),
      },
      postMessage: vi.fn(),
      disconnect: vi.fn(),
    });

    const chunks: string[] = [];
    let completed = false;

    const { requestId } = startAIStream(
      'summarize-stream',
      { content: 'hi', format: 'bullets' },
      {
        onChunk: (c) => chunks.push(c),
        onComplete: () => {
          completed = true;
        },
        onError: () => undefined,
      }
    );

    // Simulate chunk and complete
    if (typeof savedListener === 'function')
      (savedListener as (msg: unknown) => void)({
        requestId,
        event: 'chunk',
        data: 'abc',
      });
    if (typeof savedListener === 'function')
      (savedListener as (msg: unknown) => void)({
        requestId,
        event: 'complete',
        data: 'abcd',
      });

    expect(chunks).toEqual(['abc']);
    expect(completed).toBe(true);
  });
});
