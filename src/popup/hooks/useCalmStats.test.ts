/**
 * Property-based tests for useCalmStats hook
 *
 * **Feature: react-component-refactoring, Property 4: Calm stats derivation correctness**
 * **Validates: Requirements 2.3**
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import * as fc from 'fast-check';
import { useCalmStats } from './useCalmStats';
import type { Reflection } from '../../types';

// Generator for valid Reflection objects
const reflectionArb: fc.Arbitrary<Reflection> = fc.record({
  id: fc.uuid(),
  url: fc.webUrl(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  createdAt: fc.integer({
    min: Date.now() - 365 * 24 * 60 * 60 * 1000,
    max: Date.now(),
  }),
  summary: fc.array(fc.string({ minLength: 1, maxLength: 200 }), {
    minLength: 0,
    maxLength: 3,
  }),
  reflection: fc.array(fc.string({ minLength: 1, maxLength: 500 }), {
    minLength: 0,
    maxLength: 3,
  }),
});

// Generator for non-empty arrays of reflections
const nonEmptyReflectionsArb = fc.array(reflectionArb, {
  minLength: 1,
  maxLength: 50,
});

describe('useCalmStats', () => {
  /**
   * **Feature: react-component-refactoring, Property 4: Calm stats derivation correctness**
   * **Validates: Requirements 2.3**
   *
   * For any non-empty list of reflections, useCalmStats should return stats where
   * totalReflections equals the list length.
   */
  it('Property 4: totalReflections equals the list length', () => {
    fc.assert(
      fc.property(nonEmptyReflectionsArb, (reflections) => {
        const { result } = renderHook(() => useCalmStats(reflections));

        expect(result.current.totalReflections).toBe(reflections.length);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: react-component-refactoring, Property 4: Calm stats derivation correctness**
   * **Validates: Requirements 2.3**
   *
   * For any non-empty list of reflections, averagePerDay should be positive.
   */
  it('Property 4: averagePerDay is positive for non-empty reflections', () => {
    fc.assert(
      fc.property(nonEmptyReflectionsArb, (reflections) => {
        const { result } = renderHook(() => useCalmStats(reflections));

        expect(result.current.averagePerDay).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: react-component-refactoring, Property 4: Calm stats derivation correctness**
   * **Validates: Requirements 2.3**
   *
   * For any non-empty list of reflections, reflectionRatio should be between 0 and 1.
   */
  it('Property 4: reflectionRatio is between 0 and 1', () => {
    fc.assert(
      fc.property(nonEmptyReflectionsArb, (reflections) => {
        const { result } = renderHook(() => useCalmStats(reflections));

        expect(result.current.reflectionRatio).toBeGreaterThanOrEqual(0);
        expect(result.current.reflectionRatio).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: react-component-refactoring, Property 4: Calm stats derivation correctness**
   * **Validates: Requirements 2.3**
   *
   * For any non-empty list of reflections, totalReadingTime and totalReflectionTime
   * should be positive and proportional to the number of reflections.
   */
  it('Property 4: time values are positive and proportional to reflection count', () => {
    fc.assert(
      fc.property(nonEmptyReflectionsArb, (reflections) => {
        const { result } = renderHook(() => useCalmStats(reflections));

        expect(result.current.totalReadingTime).toBeGreaterThan(0);
        expect(result.current.totalReflectionTime).toBeGreaterThan(0);

        // Reading time should be 5 minutes (300 seconds) per reflection
        expect(result.current.totalReadingTime).toBe(
          reflections.length * 5 * 60
        );

        // Reflection time should be 3 minutes (180 seconds) per reflection
        expect(result.current.totalReflectionTime).toBe(
          reflections.length * 3 * 60
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: react-component-refactoring, Property 4: Calm stats derivation correctness**
   * **Validates: Requirements 2.3**
   *
   * For an empty list of reflections, all stats should be zero.
   */
  it('Property 4: empty reflections returns zero stats', () => {
    const { result } = renderHook(() => useCalmStats([]));

    expect(result.current.totalReflections).toBe(0);
    expect(result.current.averagePerDay).toBe(0);
    expect(result.current.totalReadingTime).toBe(0);
    expect(result.current.totalReflectionTime).toBe(0);
    expect(result.current.reflectionRatio).toBe(0);
  });

  /**
   * **Feature: react-component-refactoring, Property 4: Calm stats derivation correctness**
   * **Validates: Requirements 2.3**
   *
   * The reflectionRatio should equal totalReflectionTime / (totalReadingTime + totalReflectionTime)
   */
  it('Property 4: reflectionRatio is correctly calculated', () => {
    fc.assert(
      fc.property(nonEmptyReflectionsArb, (reflections) => {
        const { result } = renderHook(() => useCalmStats(reflections));

        const expectedRatio =
          result.current.totalReflectionTime /
          (result.current.totalReadingTime +
            result.current.totalReflectionTime);

        expect(result.current.reflectionRatio).toBeCloseTo(expectedRatio, 10);
      }),
      { numRuns: 100 }
    );
  });
});
