import type { AIResponse, Message } from '../types';

export function sendMessage<T>(message: Message): Promise<AIResponse<T>> {
  return new Promise((resolve) => {
    chrome.runtime
      .sendMessage(message)
      .then((response: unknown) => {
        resolve(response as AIResponse<T>);
      })
      .catch((error) => {
        console.error('Failed to send message:', error);
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: 0,
        } as AIResponse<T>);
      });
  });
}
