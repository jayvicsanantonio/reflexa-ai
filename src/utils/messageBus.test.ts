import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMessage } from './messageBus';

describe('utils/messageBus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sendMessage resolves with response on success', async () => {
    const reply = { success: true, data: 42, apiUsed: 'unified', duration: 5 };
    const sendMock = chrome.runtime.sendMessage as unknown as {
      mockResolvedValueOnce: (v: unknown) => unknown;
    };
    sendMock.mockResolvedValueOnce(reply);

    const msg = { type: 'checkAI' as const };
    const res = await sendMessage<number>(msg);
    expect(res).toEqual(reply);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(msg);
  });

  it('sendMessage returns error shape on rejection', async () => {
    const sendMock2 = chrome.runtime.sendMessage as unknown as {
      mockRejectedValueOnce: (v: unknown) => unknown;
    };
    sendMock2.mockRejectedValueOnce(new Error('boom'));

    const res = await sendMessage<number>({ type: 'checkAI' });
    expect(res.success).toBe(false);
  });
});
