/**
 * Property-based tests for useSettings hook
 *
 * **Feature: react-component-refactoring, Property 5: Settings debounce behavior**
 * **Validates: Requirements 3.1**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as fc from 'fast-check';
import { useSettings } from './useSettings';
import { TIMING } from '../../constants';

// Mock chrome.runtime.sendMessage
const mockSendMessage = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();

  // Setup chrome mock
  (globalThis as unknown as { chrome: typeof chrome }).chrome = {
    runtime: {
      sendMessage: mockSendMessage,
    },
  } as unknown as typeof chrome;

  // Default mock implementation for getSettings
  mockSendMessage.mockImplementation(async (message: { type: string }) => {
    if (message.type === 'getSettings') {
      return {
        success: true,
        data: {
          dwellThreshold: 10,
          enableSound: true,
          reduceMotion: false,
          proofreadEnabled: true,
          privacyMode: 'local',
          useNativeSummarizer: false,
          useNativeProofreader: false,
          translationEnabled: true,
          targetLanguage: 'en',
          defaultSummaryFormat: 'bullets',
          enableProofreading: true,
          enableTranslation: true,
          preferredTranslationLanguage: 'en',
          experimentalMode: true,
          autoDetectLanguage: true,
          voiceInputEnabled: true,
          voiceLanguage: undefined,
          voiceAutoStopDelay: 10000,
        },
      };
    }
    if (message.type === 'updateSettings') {
      return { success: true };
    }
    return { success: false };
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('useSettings', () => {
  /**
   * **Feature: react-component-refactoring, Property 5: Settings debounce behavior**
   * **Validates: Requirements 3.1**
   *
   * For any sequence of rapid updateSetting calls within the debounce window,
   * only one save operation should be triggered after the debounce delay.
   */
  it('Property 5: rapid updates within debounce window trigger only one save', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a random number of rapid updates (2-10)
        fc.integer({ min: 2, max: 10 }),
        // Generate random dwell threshold values
        fc.array(fc.integer({ min: 0, max: 60 }), {
          minLength: 2,
          maxLength: 10,
        }),
        async (updateCount, thresholdValues) => {
          mockSendMessage.mockClear();

          const { result } = renderHook(() => useSettings());

          // Wait for initial load
          await act(async () => {
            await vi.advanceTimersByTimeAsync(0);
          });

          // Clear the getSettings call from initialization
          mockSendMessage.mockClear();

          // Perform rapid updates within the debounce window
          const actualUpdateCount = Math.min(
            updateCount,
            thresholdValues.length
          );
          for (let i = 0; i < actualUpdateCount; i++) {
            act(() => {
              result.current.updateSetting(
                'dwellThreshold',
                thresholdValues[i]
              );
            });
            // Small delay between updates, but less than debounce time
            await act(async () => {
              await vi.advanceTimersByTimeAsync(TIMING.SETTINGS_DEBOUNCE / 4);
            });
          }

          // At this point, no save should have been triggered yet
          const saveCallsBeforeDebounce = mockSendMessage.mock.calls.filter(
            (call) => call[0]?.type === 'updateSettings'
          ).length;
          expect(saveCallsBeforeDebounce).toBe(0);

          // Wait for debounce to complete
          await act(async () => {
            await vi.advanceTimersByTimeAsync(TIMING.SETTINGS_DEBOUNCE + 100);
          });

          // Exactly one save should have been triggered
          const saveCallsAfterDebounce = mockSendMessage.mock.calls.filter(
            (call) => call[0]?.type === 'updateSettings'
          ).length;
          expect(saveCallsAfterDebounce).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: react-component-refactoring, Property 5: Settings debounce behavior**
   * **Validates: Requirements 3.1**
   *
   * The final saved value should be the last value set during rapid updates.
   */
  it('Property 5: final saved value is the last value set', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 0, max: 60 }), {
          minLength: 2,
          maxLength: 5,
        }),
        async (thresholdValues) => {
          mockSendMessage.mockClear();

          const { result } = renderHook(() => useSettings());

          // Wait for initial load
          await act(async () => {
            await vi.advanceTimersByTimeAsync(0);
          });

          mockSendMessage.mockClear();

          // Perform rapid updates
          for (const value of thresholdValues) {
            act(() => {
              result.current.updateSetting('dwellThreshold', value);
            });
            await act(async () => {
              await vi.advanceTimersByTimeAsync(50);
            });
          }

          // Wait for debounce to complete
          await act(async () => {
            await vi.advanceTimersByTimeAsync(TIMING.SETTINGS_DEBOUNCE + 100);
          });

          // Check that the saved value is the last one
          const saveCalls = mockSendMessage.mock.calls.filter(
            (call) => call[0]?.type === 'updateSettings'
          );
          expect(saveCalls.length).toBe(1);

          const savedSettings = saveCalls[0][0].payload;
          const lastValue = thresholdValues[thresholdValues.length - 1];
          expect(savedSettings.dwellThreshold).toBe(lastValue);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: react-component-refactoring, Property 5: Settings debounce behavior**
   * **Validates: Requirements 3.1**
   *
   * Updates separated by more than the debounce window should trigger separate saves.
   */
  it('Property 5: updates separated by debounce window trigger separate saves', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 5 }),
        fc.array(fc.integer({ min: 0, max: 60 }), {
          minLength: 2,
          maxLength: 5,
        }),
        async (updateCount, thresholdValues) => {
          mockSendMessage.mockClear();

          const { result } = renderHook(() => useSettings());

          // Wait for initial load
          await act(async () => {
            await vi.advanceTimersByTimeAsync(0);
          });

          mockSendMessage.mockClear();

          const actualUpdateCount = Math.min(
            updateCount,
            thresholdValues.length
          );

          // Perform updates with full debounce delay between each
          for (let i = 0; i < actualUpdateCount; i++) {
            act(() => {
              result.current.updateSetting(
                'dwellThreshold',
                thresholdValues[i]
              );
            });

            // Wait for full debounce + extra time
            await act(async () => {
              await vi.advanceTimersByTimeAsync(TIMING.SETTINGS_DEBOUNCE + 100);
            });
          }

          // Each update should have triggered a separate save
          const saveCalls = mockSendMessage.mock.calls.filter(
            (call) => call[0]?.type === 'updateSettings'
          );
          expect(saveCalls.length).toBe(actualUpdateCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: react-component-refactoring, Property 5: Settings debounce behavior**
   * **Validates: Requirements 3.1**
   *
   * Local state should update immediately regardless of debounce.
   */
  it('Property 5: local state updates immediately', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 60 }),
        async (newThreshold) => {
          mockSendMessage.mockClear();

          const { result } = renderHook(() => useSettings());

          // Wait for initial load
          await act(async () => {
            await vi.advanceTimersByTimeAsync(0);
          });

          // Update setting
          act(() => {
            result.current.updateSetting('dwellThreshold', newThreshold);
          });

          // Local state should be updated immediately
          expect(result.current.settings.dwellThreshold).toBe(newThreshold);
        }
      ),
      { numRuns: 100 }
    );
  });
});
