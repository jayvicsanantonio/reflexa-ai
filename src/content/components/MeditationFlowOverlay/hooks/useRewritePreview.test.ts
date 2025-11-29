/**
 * Property-based tests for useRewritePreview hook
 *
 * **Feature: react-component-refactoring, Property 1: Rewrite preview state consistency**
 * **Validates: Requirements 1.4**
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as fc from 'fast-check';
import { useRewritePreview } from './useRewritePreview';
import type { RewritePreviewState } from './useRewritePreview';

// Generator for valid RewritePreviewState
const rewritePreviewStateArb = fc.record({
  index: fc.integer({ min: 0, max: 1 }),
  original: fc.string({ minLength: 1 }),
  rewritten: fc.string({ minLength: 1 }),
});

// Generator for operations on the hook
type Operation =
  | { type: 'setPreview'; preview: RewritePreviewState | null }
  | { type: 'acceptRewrite' }
  | { type: 'discardRewrite' };

const operationArb: fc.Arbitrary<Operation> = fc.oneof(
  fc.record({
    type: fc.constant('setPreview' as const),
    preview: fc.oneof(rewritePreviewStateArb, fc.constant(null)),
  }),
  fc.record({ type: fc.constant('acceptRewrite' as const) }),
  fc.record({ type: fc.constant('discardRewrite' as const) })
);

describe('useRewritePreview', () => {
  /**
   * **Feature: react-component-refactoring, Property 1: Rewrite preview state consistency**
   * **Validates: Requirements 1.4**
   *
   * For any sequence of setPreview, acceptRewrite, and discardRewrite operations,
   * the preview state should be null after either accept or discard,
   * and acceptRewrite should return the rewritten text only when a preview exists.
   */
  it('Property 1: preview state is null after accept or discard operations', () => {
    fc.assert(
      fc.property(
        fc.array(operationArb, { minLength: 1, maxLength: 20 }),
        (operations) => {
          const { result } = renderHook(() => useRewritePreview());

          for (const op of operations) {
            switch (op.type) {
              case 'setPreview':
                act(() => {
                  result.current.setPreview(op.preview);
                });
                // After setPreview, preview should match what was set
                expect(result.current.preview).toEqual(op.preview);
                break;
              case 'acceptRewrite': {
                const previewBeforeAccept = result.current.preview;
                let returnedText: string | null = null;
                act(() => {
                  returnedText = result.current.acceptRewrite();
                });

                // acceptRewrite should return rewritten text only when preview exists
                if (previewBeforeAccept) {
                  expect(returnedText).toBe(previewBeforeAccept.rewritten);
                } else {
                  expect(returnedText).toBeNull();
                }
                // After accept, preview should be null
                expect(result.current.preview).toBeNull();
                break;
              }
              case 'discardRewrite':
                act(() => {
                  result.current.discardRewrite();
                });
                // After discard, preview should be null
                expect(result.current.preview).toBeNull();
                break;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: react-component-refactoring, Property 1: Rewrite preview state consistency**
   * **Validates: Requirements 1.4**
   *
   * For any valid preview state, setPreview followed by acceptRewrite
   * should return the exact rewritten text that was set.
   */
  it('Property 1: acceptRewrite returns exact rewritten text from preview', () => {
    fc.assert(
      fc.property(rewritePreviewStateArb, (previewState) => {
        const { result } = renderHook(() => useRewritePreview());

        act(() => {
          result.current.setPreview(previewState);
        });

        expect(result.current.preview).toEqual(previewState);

        let returnedText: string | null = null;
        act(() => {
          returnedText = result.current.acceptRewrite();
        });

        expect(returnedText).toBe(previewState.rewritten);
        expect(result.current.preview).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: react-component-refactoring, Property 1: Rewrite preview state consistency**
   * **Validates: Requirements 1.4**
   *
   * For any valid preview state, setPreview followed by discardRewrite
   * should clear the preview without returning any text.
   */
  it('Property 1: discardRewrite clears preview state', () => {
    fc.assert(
      fc.property(rewritePreviewStateArb, (previewState) => {
        const { result } = renderHook(() => useRewritePreview());

        act(() => {
          result.current.setPreview(previewState);
        });

        expect(result.current.preview).toEqual(previewState);

        act(() => {
          result.current.discardRewrite();
        });

        expect(result.current.preview).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: react-component-refactoring, Property 1: Rewrite preview state consistency**
   * **Validates: Requirements 1.4**
   *
   * acceptRewrite on empty state should return null and keep state null.
   */
  it('Property 1: acceptRewrite on empty state returns null', () => {
    const { result } = renderHook(() => useRewritePreview());

    expect(result.current.preview).toBeNull();

    let returnedText: string | null = null;
    act(() => {
      returnedText = result.current.acceptRewrite();
    });

    expect(returnedText).toBeNull();
    expect(result.current.preview).toBeNull();
  });
});
