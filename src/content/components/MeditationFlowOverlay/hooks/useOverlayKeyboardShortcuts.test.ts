/**
 * Property-based tests for useOverlayKeyboardShortcuts hook
 *
 * **Feature: react-component-refactoring, Property 3: Keyboard shortcut event mapping**
 * **Validates: Requirements 1.6**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getKeyboardAction } from './useOverlayKeyboardShortcuts';
import type { KeyboardShortcutResult } from './useOverlayKeyboardShortcuts';

// Generator for keyboard events
const keyboardEventArb = fc.record({
  key: fc.constantFrom(
    'ArrowRight',
    'ArrowLeft',
    'Escape',
    'Enter',
    'g',
    'a',
    'Tab',
    ' '
  ),
  metaKey: fc.boolean(),
  ctrlKey: fc.boolean(),
});

// Generator for overlay config state
const overlayConfigArb = fc.record({
  step: fc.integer({ min: 0, max: 3 }),
  isLoadingSummary: fc.boolean(),
  isProcessing: fc.boolean(),
  writerAvailable: fc.boolean(),
  answers: fc.tuple(fc.string(), fc.string()),
});

describe('useOverlayKeyboardShortcuts', () => {
  /**
   * **Feature: react-component-refactoring, Property 3: Keyboard shortcut event mapping**
   * **Validates: Requirements 1.6**
   *
   * For any Escape key event, the action should always be 'cancel'.
   */
  it('Property 3: Escape key always triggers cancel action', () => {
    fc.assert(
      fc.property(
        overlayConfigArb,
        fc.boolean(),
        fc.boolean(),
        (config, metaKey, ctrlKey) => {
          const event = { key: 'Escape', metaKey, ctrlKey };
          const result = getKeyboardAction(event, config);

          expect(result).toEqual({ action: 'cancel' });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: react-component-refactoring, Property 3: Keyboard shortcut event mapping**
   * **Validates: Requirements 1.6**
   *
   * For ArrowLeft key, the action should be 'prev' only when step > 0 and not processing.
   */
  it('Property 3: ArrowLeft triggers prev action when valid', () => {
    fc.assert(
      fc.property(
        overlayConfigArb,
        fc.boolean(),
        fc.boolean(),
        (config, metaKey, ctrlKey) => {
          const event = { key: 'ArrowLeft', metaKey, ctrlKey };
          const result = getKeyboardAction(event, config);

          if (config.step > 0 && !config.isProcessing) {
            expect(result).toEqual({ action: 'prev' });
          } else {
            expect(result).toEqual({ action: 'none' });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: react-component-refactoring, Property 3: Keyboard shortcut event mapping**
   * **Validates: Requirements 1.6**
   *
   * For ArrowRight key, the action should be 'next' only when:
   * - step < 3
   * - not loading summary (if step === 0)
   * - not processing
   */
  it('Property 3: ArrowRight triggers next action when valid', () => {
    fc.assert(
      fc.property(
        overlayConfigArb,
        fc.boolean(),
        fc.boolean(),
        (config, metaKey, ctrlKey) => {
          const event = { key: 'ArrowRight', metaKey, ctrlKey };
          const result = getKeyboardAction(event, config);

          const canAdvance =
            config.step < 3 &&
            !config.isProcessing &&
            !(config.step === 0 && config.isLoadingSummary);

          if (canAdvance) {
            expect(result).toEqual({ action: 'next' });
          } else {
            expect(result).toEqual({ action: 'none' });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: react-component-refactoring, Property 3: Keyboard shortcut event mapping**
   * **Validates: Requirements 1.6**
   *
   * For Enter key, the action should be 'next' only when:
   * - step < 3
   * - not loading summary (if step === 0)
   * - not processing
   */
  it('Property 3: Enter triggers next action when valid', () => {
    fc.assert(
      fc.property(
        overlayConfigArb,
        fc.boolean(),
        fc.boolean(),
        (config, metaKey, ctrlKey) => {
          const event = { key: 'Enter', metaKey, ctrlKey };
          const result = getKeyboardAction(event, config);

          const canAdvance =
            config.step < 3 &&
            !config.isProcessing &&
            !(config.step === 0 && config.isLoadingSummary);

          if (canAdvance) {
            expect(result).toEqual({ action: 'next' });
          } else {
            expect(result).toEqual({ action: 'none' });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: react-component-refactoring, Property 3: Keyboard shortcut event mapping**
   * **Validates: Requirements 1.6**
   *
   * For Cmd/Ctrl+G, the action should be 'generateDraft' only when:
   * - step is 2 or 3
   * - writerAvailable is true
   * - the corresponding answer is empty
   */
  it('Property 3: Cmd+G triggers generateDraft action when valid', () => {
    fc.assert(
      fc.property(overlayConfigArb, (config) => {
        // Test with metaKey (Cmd on Mac)
        const eventMeta = { key: 'g', metaKey: true, ctrlKey: false };
        const resultMeta = getKeyboardAction(eventMeta, config);

        // Test with ctrlKey (Ctrl on Windows/Linux)
        const eventCtrl = { key: 'g', metaKey: false, ctrlKey: true };
        const resultCtrl = getKeyboardAction(eventCtrl, config);

        const isValidStep = config.step === 2 || config.step === 3;
        const index: 0 | 1 = config.step === 2 ? 0 : 1;
        const answerIsEmpty = !config.answers[index]?.trim();
        const canGenerate =
          isValidStep && config.writerAvailable && answerIsEmpty;

        if (canGenerate) {
          expect(resultMeta).toEqual({ action: 'generateDraft', index });
          expect(resultCtrl).toEqual({ action: 'generateDraft', index });
        } else {
          expect(resultMeta).toEqual({ action: 'none' });
          expect(resultCtrl).toEqual({ action: 'none' });
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: react-component-refactoring, Property 3: Keyboard shortcut event mapping**
   * **Validates: Requirements 1.6**
   *
   * For any unrecognized key, the action should be 'none'.
   */
  it('Property 3: Unrecognized keys return none action', () => {
    fc.assert(
      fc.property(
        overlayConfigArb,
        fc.boolean(),
        fc.boolean(),
        fc.constantFrom('a', 'b', 'Tab', ' ', 'Shift', 'Alt'),
        (config, metaKey, ctrlKey, key) => {
          const event = { key, metaKey, ctrlKey };
          const result = getKeyboardAction(event, config);

          expect(result).toEqual({ action: 'none' });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: react-component-refactoring, Property 3: Keyboard shortcut event mapping**
   * **Validates: Requirements 1.6**
   *
   * For any keyboard event, exactly one action type should be returned.
   */
  it('Property 3: Every keyboard event returns exactly one action', () => {
    fc.assert(
      fc.property(keyboardEventArb, overlayConfigArb, (event, config) => {
        const result = getKeyboardAction(event, config);

        // Result should be one of the valid action types
        const validActions: KeyboardShortcutResult['action'][] = [
          'next',
          'prev',
          'cancel',
          'generateDraft',
          'none',
        ];

        expect(validActions).toContain(result.action);

        // If generateDraft, should have valid index
        if (result.action === 'generateDraft') {
          expect([0, 1]).toContain(result.index);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: react-component-refactoring, Property 3: Keyboard shortcut event mapping**
   * **Validates: Requirements 1.6**
   *
   * Disabled states should be respected - no navigation when processing.
   */
  it('Property 3: Processing state blocks navigation actions', () => {
    fc.assert(
      fc.property(
        fc.record({
          step: fc.integer({ min: 1, max: 2 }), // Valid range for both prev and next
          isLoadingSummary: fc.constant(false),
          isProcessing: fc.constant(true), // Always processing
          writerAvailable: fc.boolean(),
          answers: fc.tuple(fc.string(), fc.string()),
        }),
        fc.constantFrom('ArrowRight', 'ArrowLeft', 'Enter'),
        (config, key) => {
          const event = { key, metaKey: false, ctrlKey: false };
          const result = getKeyboardAction(event, config);

          // When processing, navigation should be blocked
          if (key === 'ArrowLeft') {
            expect(result).toEqual({ action: 'none' });
          } else {
            // ArrowRight and Enter should also be blocked
            expect(result).toEqual({ action: 'none' });
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
