/**
 * Property-based tests for useProofreadResult hook
 *
 * **Feature: react-component-refactoring, Property 2: Proofread result state consistency**
 * **Validates: Requirements 1.5**
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as fc from 'fast-check';
import { useProofreadResult } from './useProofreadResult';
import type { ProofreadResultState } from './useProofreadResult';
import type { ProofreadResult } from '../../../../types';

// Generator for valid ProofreadResult
const proofreadResultArb: fc.Arbitrary<ProofreadResult> = fc.record({
  correctedText: fc.string({ minLength: 1 }),
  corrections: fc.array(
    fc.record({
      startIndex: fc.nat(),
      endIndex: fc.nat(),
      original: fc.string(),
    })
  ),
});

// Generator for valid ProofreadResultState
const proofreadResultStateArb: fc.Arbitrary<ProofreadResultState> = fc.record({
  index: fc.integer({ min: 0, max: 1 }),
  result: proofreadResultArb,
});

// Generator for operations on the hook
type Operation =
  | { type: 'setResult'; result: ProofreadResultState | null }
  | { type: 'acceptProofread'; index: 0 | 1 }
  | { type: 'discardProofread' };

const operationArb: fc.Arbitrary<Operation> = fc.oneof(
  fc.record({
    type: fc.constant('setResult' as const),
    result: fc.oneof(proofreadResultStateArb, fc.constant(null)),
  }),
  fc.record({
    type: fc.constant('acceptProofread' as const),
    index: fc.constantFrom(0 as const, 1 as const),
  }),
  fc.record({ type: fc.constant('discardProofread' as const) })
);

describe('useProofreadResult', () => {
  /**
   * **Feature: react-component-refactoring, Property 2: Proofread result state consistency**
   * **Validates: Requirements 1.5**
   *
   * For any sequence of setResult, acceptProofread, and discardProofread operations,
   * the result state should be null after either accept or discard,
   * and acceptProofread should return the corrected text only when a result exists for the given index.
   */
  it('Property 2: result state is null after accept or discard operations', () => {
    fc.assert(
      fc.property(
        fc.array(operationArb, { minLength: 1, maxLength: 20 }),
        (operations) => {
          const { result } = renderHook(() => useProofreadResult());

          for (const op of operations) {
            switch (op.type) {
              case 'setResult':
                act(() => {
                  result.current.setResult(op.result);
                });
                // After setResult, result should match what was set
                expect(result.current.result).toEqual(op.result);
                break;
              case 'acceptProofread': {
                const resultBeforeAccept = result.current.result;
                let returnedText: string | null = null;
                act(() => {
                  returnedText = result.current.acceptProofread(op.index);
                });

                // acceptProofread should return corrected text only when result exists for that index
                if (
                  resultBeforeAccept &&
                  resultBeforeAccept.index === op.index
                ) {
                  expect(returnedText).toBe(
                    resultBeforeAccept.result.correctedText
                  );
                  // After accept with matching index, result should be null
                  expect(result.current.result).toBeNull();
                } else {
                  expect(returnedText).toBeNull();
                  // After accept with non-matching index, result should remain unchanged
                  expect(result.current.result).toEqual(resultBeforeAccept);
                }
                break;
              }
              case 'discardProofread':
                act(() => {
                  result.current.discardProofread();
                });
                // After discard, result should be null
                expect(result.current.result).toBeNull();
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
   * **Feature: react-component-refactoring, Property 2: Proofread result state consistency**
   * **Validates: Requirements 1.5**
   *
   * For any valid result state, setResult followed by acceptProofread with matching index
   * should return the exact corrected text that was set.
   */
  it('Property 2: acceptProofread returns exact corrected text from result', () => {
    fc.assert(
      fc.property(proofreadResultStateArb, (resultState) => {
        const { result } = renderHook(() => useProofreadResult());

        act(() => {
          result.current.setResult(resultState);
        });

        expect(result.current.result).toEqual(resultState);

        let returnedText: string | null = null;
        act(() => {
          returnedText = result.current.acceptProofread(
            resultState.index as 0 | 1
          );
        });

        expect(returnedText).toBe(resultState.result.correctedText);
        expect(result.current.result).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: react-component-refactoring, Property 2: Proofread result state consistency**
   * **Validates: Requirements 1.5**
   *
   * For any valid result state, acceptProofread with non-matching index
   * should return null and keep the result unchanged.
   */
  it('Property 2: acceptProofread with non-matching index returns null', () => {
    fc.assert(
      fc.property(proofreadResultStateArb, (resultState) => {
        const { result } = renderHook(() => useProofreadResult());

        act(() => {
          result.current.setResult(resultState);
        });

        const nonMatchingIndex: 0 | 1 = resultState.index === 0 ? 1 : 0;
        let returnedText: string | null = null;
        act(() => {
          returnedText = result.current.acceptProofread(nonMatchingIndex);
        });

        expect(returnedText).toBeNull();
        // Result should remain unchanged
        expect(result.current.result).toEqual(resultState);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: react-component-refactoring, Property 2: Proofread result state consistency**
   * **Validates: Requirements 1.5**
   *
   * For any valid result state, setResult followed by discardProofread
   * should clear the result without returning any text.
   */
  it('Property 2: discardProofread clears result state', () => {
    fc.assert(
      fc.property(proofreadResultStateArb, (resultState) => {
        const { result } = renderHook(() => useProofreadResult());

        act(() => {
          result.current.setResult(resultState);
        });

        expect(result.current.result).toEqual(resultState);

        act(() => {
          result.current.discardProofread();
        });

        expect(result.current.result).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: react-component-refactoring, Property 2: Proofread result state consistency**
   * **Validates: Requirements 1.5**
   *
   * acceptProofread on empty state should return null and keep state null.
   */
  it('Property 2: acceptProofread on empty state returns null', () => {
    fc.assert(
      fc.property(fc.constantFrom(0 as const, 1 as const), (index) => {
        const { result } = renderHook(() => useProofreadResult());

        expect(result.current.result).toBeNull();

        let returnedText: string | null = null;
        act(() => {
          returnedText = result.current.acceptProofread(index);
        });

        expect(returnedText).toBeNull();
        expect(result.current.result).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});
