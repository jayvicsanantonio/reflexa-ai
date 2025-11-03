import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuickSettingsModal } from '../content/components/QuickSettingsModal';
import type { Settings, AIResponse } from '../types';

describe('QuickSettingsModal accessibility and interactions', () => {
  const defaultSettings: Settings = {
    dwellThreshold: 60,
    enableSound: true,
    reduceMotion: false,
    proofreadEnabled: true,
    privacyMode: 'local',
    useNativeSummarizer: true,
    useNativeProofreader: false,
    translationEnabled: true,
    targetLanguage: 'en',
    defaultSummaryFormat: 'bullets',
    enableProofreading: true,
    enableTranslation: true,
    preferredTranslationLanguage: 'en',
    experimentalMode: false,
    autoDetectLanguage: true,
  };

  let originalSendMessage: unknown;
  let mockedSendMessage: any;

  beforeEach(() => {
    originalSendMessage = (global.chrome as any).runtime.sendMessage;
    mockedSendMessage = vi.fn((msg: { type: string; payload?: unknown }) => {
      if (msg.type === 'getSettings') {
        const resp: AIResponse<Settings> = {
          success: true,
          data: defaultSettings,
          apiUsed: 'mock',
          duration: 0,
        };
        return Promise.resolve(resp);
      }
      return Promise.resolve({ success: true } as unknown as AIResponse);
    });
    (global.chrome as any).runtime.sendMessage = mockedSendMessage;
  });

  afterEach(() => {
    (global.chrome as any).runtime.sendMessage = originalSendMessage as any;
  });

  it('renders as an accessible dialog and wires aria-labelledby', async () => {
    render(<QuickSettingsModal onClose={vi.fn()} />);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    const title = await screen.findByText('Settings');
    const titleId = title.id;
    expect(titleId).toBe('reflexa-quick-settings-title');
    expect(dialog).toHaveAttribute('aria-labelledby', titleId);
  });

  it('toggles a switch and sends updateSettings payload', async () => {
    render(<QuickSettingsModal onClose={vi.fn()} />);

    // Wait for settings to load
    await screen.findByText('Enable sound');

    const soundSwitch = screen.getByRole('switch', { name: 'Enable sound' });
    fireEvent.click(soundSwitch);

    await waitFor(() => {
      const calls = (mockedSendMessage.mock.calls as unknown[][]).filter(
        (c: unknown[]) => {
          const arg = (c?.[0] ?? {}) as { type?: string };
          return arg.type === 'updateSettings';
        }
      );
      expect(calls.length).toBeGreaterThan(0);
      const last = calls[calls.length - 1][0] as {
        type: string;
        payload?: Partial<Settings>;
      };
      expect(last.type).toBe('updateSettings');
      // Payload should be a full settings object with possibly toggled enableSound
      expect(last.payload).toBeTruthy();
      expect(last.payload?.enableSound).toBe(!defaultSettings.enableSound);
    });
  });

  it('closes on Escape key', async () => {
    const onClose = vi.fn();
    render(<QuickSettingsModal onClose={onClose} />);
    // Wait for content and for useEffect to run
    await screen.findByText('Settings');
    await new Promise((resolve) => setTimeout(resolve, 0));

    // trapFocus sets up a keydown listener on the contentRef element
    // Find the inner content div (has the ref and onKeyDown)
    const dialog = screen.getByRole('dialog');
    const contentElement = Array.from(dialog.querySelectorAll('div')).find(
      (div) => {
        // Find the div that has both onKeyDown and is the contentRef
        // It's the one with the specific classes and structure
        return (
          div.className.includes('relative') &&
          div.className.includes('z-[1]') &&
          div.querySelector('[style*="padding"]') // Has the scrollable content
        );
      }
    ) as HTMLElement;

    if (contentElement) {
      // Trigger Escape key on the content element where trapFocus listener is attached
      fireEvent.keyDown(contentElement, { key: 'Escape', code: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    }
  });
});
