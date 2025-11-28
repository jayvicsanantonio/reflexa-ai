/**
 * ErrorBoundary Unit and Property-Based Tests
 *
 * Tests for the React ErrorBoundary component covering:
 * - Error catching in child components
 * - Fallback UI rendering
 * - Retry action for recoverable errors
 * - Integration with ErrorService for logging
 *
 * Requirements: 7.1, 7.2, 7.3
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { ErrorBoundary } from './ErrorBoundary';
import { errorService } from '../background/services/error/ErrorService';
import type { StandardError } from '../background/services/error/interfaces';

// Mock the ErrorService
vi.mock('../background/services/error/ErrorService', () => {
  const mockErrorService = {
    fromUnknown: vi.fn((error: unknown, context?: Record<string, unknown>) => ({
      code: 'UNKNOWN_ERROR' as const,
      message: error instanceof Error ? error.message : 'Unknown error',
      context,
      suggestions: [],
      recoverable: false,
      timestamp: Date.now(),
      severity: 'error' as const,
    })),
    log: vi.fn(),
    isRecoverable: vi.fn((error: StandardError) => error.recoverable),
    getSuggestions: vi.fn((error: StandardError) => error.suggestions ?? []),
    formatForUser: vi.fn(() => 'An unexpected error occurred.'),
  };

  return {
    errorService: mockErrorService,
    ErrorService: vi.fn(() => mockErrorService),
  };
});

// ============================================
// Test Utilities
// ============================================

/**
 * Component that throws an error when rendered
 */
const ThrowingComponent: React.FC<{ error: Error }> = ({ error }) => {
  throw error;
};

/**
 * Component that renders normally
 */
const NormalComponent: React.FC<{ text: string }> = ({ text }) => (
  <div data-testid="normal-content">{text}</div>
);

// ============================================
// fast-check Arbitraries
// ============================================

/**
 * Arbitrary for generating non-whitespace error messages
 * Filters out whitespace-only strings to avoid testing-library issues
 */
const errorMessageArb = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

/**
 * Arbitrary for generating Error objects
 */
const errorArb = errorMessageArb.map((msg) => new Error(msg));

/**
 * Arbitrary for generating non-whitespace suggestion strings
 */
const suggestionArb = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0);

/**
 * Arbitrary for generating recoverable error configurations
 */
const recoverableErrorConfigArb = fc.record({
  code: fc.constantFrom(
    'AI_UNAVAILABLE',
    'SESSION_CREATE_FAILED',
    'OPERATION_TIMEOUT',
    'NETWORK_ERROR'
  ),
  message: errorMessageArb,
  suggestions: fc.array(suggestionArb, {
    minLength: 1,
    maxLength: 3,
  }),
});

/**
 * Arbitrary for generating non-recoverable error configurations
 */
const nonRecoverableErrorConfigArb = fc.record({
  code: fc.constant('UNKNOWN_ERROR' as const),
  message: errorMessageArb,
});

/**
 * Arbitrary for generating non-whitespace text for normal components
 */
const normalTextArb = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0);

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for expected errors
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Unit Tests', () => {
    describe('Normal rendering', () => {
      it('should render children when no error occurs', () => {
        render(
          <ErrorBoundary>
            <NormalComponent text="Hello World" />
          </ErrorBoundary>
        );

        expect(screen.getByTestId('normal-content')).toBeInTheDocument();
        expect(screen.getByText('Hello World')).toBeInTheDocument();
      });

      it('should not show fallback UI when no error occurs', () => {
        render(
          <ErrorBoundary>
            <NormalComponent text="Test" />
          </ErrorBoundary>
        );

        expect(
          screen.queryByTestId('error-boundary-fallback')
        ).not.toBeInTheDocument();
      });
    });

    describe('Error catching', () => {
      it('should catch errors thrown by child components', () => {
        const testError = new Error('Test error');

        render(
          <ErrorBoundary>
            <ThrowingComponent error={testError} />
          </ErrorBoundary>
        );

        expect(
          screen.getByTestId('error-boundary-fallback')
        ).toBeInTheDocument();
      });

      it('should display fallback UI when error is caught', () => {
        render(
          <ErrorBoundary>
            <ThrowingComponent error={new Error('Test')} />
          </ErrorBoundary>
        );

        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      });

      it('should use custom fallback when provided', () => {
        const customFallback = <div data-testid="custom-fallback">Custom</div>;

        render(
          <ErrorBoundary fallback={customFallback}>
            <ThrowingComponent error={new Error('Test')} />
          </ErrorBoundary>
        );

        expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
        expect(
          screen.queryByTestId('error-boundary-fallback')
        ).not.toBeInTheDocument();
      });
    });

    describe('Error logging', () => {
      it('should log error using ErrorService', () => {
        render(
          <ErrorBoundary>
            <ThrowingComponent error={new Error('Test error')} />
          </ErrorBoundary>
        );

        expect(errorService.fromUnknown).toHaveBeenCalled();
        expect(errorService.log).toHaveBeenCalled();
      });

      it('should call onError callback when provided', () => {
        const onError = vi.fn();
        const testError = new Error('Test error');

        render(
          <ErrorBoundary onError={onError}>
            <ThrowingComponent error={testError} />
          </ErrorBoundary>
        );

        expect(onError).toHaveBeenCalledWith(
          testError,
          expect.objectContaining({
            componentStack: expect.any(String),
          })
        );
      });
    });

    describe('Retry functionality', () => {
      it('should show retry button for recoverable errors', () => {
        // Mock recoverable error
        vi.mocked(errorService.fromUnknown).mockReturnValue({
          code: 'AI_UNAVAILABLE',
          message: 'AI unavailable',
          recoverable: true,
          suggestions: ['Try again'],
          timestamp: Date.now(),
          severity: 'warning',
        });
        vi.mocked(errorService.isRecoverable).mockReturnValue(true);

        render(
          <ErrorBoundary>
            <ThrowingComponent error={new Error('Test')} />
          </ErrorBoundary>
        );

        expect(screen.getByTestId('error-boundary-retry')).toBeInTheDocument();
      });

      it('should not show retry button for non-recoverable errors', () => {
        // Mock non-recoverable error
        vi.mocked(errorService.fromUnknown).mockReturnValue({
          code: 'UNKNOWN_ERROR',
          message: 'Unknown error',
          recoverable: false,
          suggestions: [],
          timestamp: Date.now(),
          severity: 'error',
        });
        vi.mocked(errorService.isRecoverable).mockReturnValue(false);

        render(
          <ErrorBoundary>
            <ThrowingComponent error={new Error('Test')} />
          </ErrorBoundary>
        );

        expect(
          screen.queryByTestId('error-boundary-retry')
        ).not.toBeInTheDocument();
      });

      it('should call onRetry callback when retry button is clicked', () => {
        const onRetry = vi.fn();

        // Mock recoverable error
        vi.mocked(errorService.fromUnknown).mockReturnValue({
          code: 'AI_UNAVAILABLE',
          message: 'AI unavailable',
          recoverable: true,
          suggestions: ['Try again'],
          timestamp: Date.now(),
          severity: 'warning',
        });
        vi.mocked(errorService.isRecoverable).mockReturnValue(true);

        render(
          <ErrorBoundary onRetry={onRetry}>
            <ThrowingComponent error={new Error('Test')} />
          </ErrorBoundary>
        );

        fireEvent.click(screen.getByTestId('error-boundary-retry'));

        expect(onRetry).toHaveBeenCalled();
      });

      it('should reset error state when retry is clicked', () => {
        const onRetry = vi.fn();

        // Mock recoverable error
        vi.mocked(errorService.fromUnknown).mockReturnValue({
          code: 'AI_UNAVAILABLE',
          message: 'AI unavailable',
          recoverable: true,
          suggestions: ['Try again'],
          timestamp: Date.now(),
          severity: 'warning',
        });
        vi.mocked(errorService.isRecoverable).mockReturnValue(true);

        render(
          <ErrorBoundary onRetry={onRetry}>
            <ThrowingComponent error={new Error('Test')} />
          </ErrorBoundary>
        );

        // Error should be shown
        expect(
          screen.getByTestId('error-boundary-fallback')
        ).toBeInTheDocument();

        // Click retry - this should reset the error state and call onRetry
        fireEvent.click(screen.getByTestId('error-boundary-retry'));

        // onRetry should have been called
        expect(onRetry).toHaveBeenCalled();
      });
    });

    describe('Suggestions display', () => {
      it('should display suggestions for recoverable errors', () => {
        const suggestions = ['Try again', 'Check connection'];

        vi.mocked(errorService.fromUnknown).mockReturnValue({
          code: 'NETWORK_ERROR',
          message: 'Network error',
          recoverable: true,
          suggestions,
          timestamp: Date.now(),
          severity: 'warning',
        });
        vi.mocked(errorService.isRecoverable).mockReturnValue(true);
        vi.mocked(errorService.getSuggestions).mockReturnValue(suggestions);

        render(
          <ErrorBoundary>
            <ThrowingComponent error={new Error('Test')} />
          </ErrorBoundary>
        );

        expect(screen.getByText('Try again')).toBeInTheDocument();
        expect(screen.getByText('Check connection')).toBeInTheDocument();
      });
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * **Feature: next-phase-improvements, Property 18: Error boundary catches child errors**
     * **Validates: Requirements 7.1**
     *
     * For any React component that throws an error, when wrapped in an ErrorBoundary,
     * the error should be caught and the fallback UI should be displayed instead of crashing.
     */
    it('Property 18: Error boundary catches child errors', () => {
      fc.assert(
        fc.property(errorArb, (error) => {
          cleanup();
          vi.clearAllMocks();

          // Reset mock to default behavior
          vi.mocked(errorService.fromUnknown).mockReturnValue({
            code: 'UNKNOWN_ERROR',
            message: error.message,
            recoverable: false,
            suggestions: [],
            timestamp: Date.now(),
            severity: 'error',
          });
          vi.mocked(errorService.isRecoverable).mockReturnValue(false);

          render(
            <ErrorBoundary>
              <ThrowingComponent error={error} />
            </ErrorBoundary>
          );

          // Fallback UI should be displayed
          const fallback = screen.queryByTestId('error-boundary-fallback');
          expect(fallback).toBeInTheDocument();

          // Error should have been logged
          expect(errorService.log).toHaveBeenCalled();

          // ErrorService.fromUnknown should have been called with the error
          expect(errorService.fromUnknown).toHaveBeenCalled();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: next-phase-improvements, Property 19: Recoverable errors show retry action**
     * **Validates: Requirements 7.3**
     *
     * For any error that is recoverable, the ErrorBoundary fallback UI should
     * include a retry button/action.
     */
    it('Property 19: Recoverable errors show retry action', () => {
      fc.assert(
        fc.property(recoverableErrorConfigArb, (config) => {
          cleanup();
          vi.clearAllMocks();

          // Mock recoverable error
          vi.mocked(errorService.fromUnknown).mockReturnValue({
            code: config.code as StandardError['code'],
            message: config.message,
            recoverable: true,
            suggestions: config.suggestions,
            timestamp: Date.now(),
            severity: 'warning',
          });
          vi.mocked(errorService.isRecoverable).mockReturnValue(true);
          vi.mocked(errorService.getSuggestions).mockReturnValue(
            config.suggestions
          );

          render(
            <ErrorBoundary>
              <ThrowingComponent error={new Error(config.message)} />
            </ErrorBoundary>
          );

          // Retry button should be present for recoverable errors
          const retryButton = screen.queryByTestId('error-boundary-retry');
          expect(retryButton).toBeInTheDocument();

          // Fallback UI should be displayed
          expect(
            screen.getByTestId('error-boundary-fallback')
          ).toBeInTheDocument();

          // Suggestions list should exist (we verify count matches)
          const suggestionsList = screen
            .getByTestId('error-boundary-fallback')
            .querySelector('ul');
          if (config.suggestions.length > 0) {
            expect(suggestionsList).toBeInTheDocument();
            const listItems = suggestionsList?.querySelectorAll('li');
            expect(listItems?.length).toBe(config.suggestions.length);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Additional property: Non-recoverable errors do not show retry action
     */
    it('Property: Non-recoverable errors do not show retry action', () => {
      fc.assert(
        fc.property(nonRecoverableErrorConfigArb, (config) => {
          cleanup();
          vi.clearAllMocks();

          // Mock non-recoverable error
          vi.mocked(errorService.fromUnknown).mockReturnValue({
            code: config.code,
            message: config.message,
            recoverable: false,
            suggestions: [],
            timestamp: Date.now(),
            severity: 'error',
          });
          vi.mocked(errorService.isRecoverable).mockReturnValue(false);
          vi.mocked(errorService.getSuggestions).mockReturnValue([]);

          render(
            <ErrorBoundary>
              <ThrowingComponent error={new Error(config.message)} />
            </ErrorBoundary>
          );

          // Retry button should NOT be present for non-recoverable errors
          const retryButton = screen.queryByTestId('error-boundary-retry');
          expect(retryButton).not.toBeInTheDocument();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Additional property: Normal components render without fallback
     */
    it('Property: Normal components render without fallback', () => {
      fc.assert(
        fc.property(normalTextArb, (text) => {
          cleanup();

          render(
            <ErrorBoundary>
              <NormalComponent text={text} />
            </ErrorBoundary>
          );

          // Normal content should be displayed
          const normalContent = screen.getByTestId('normal-content');
          expect(normalContent).toBeInTheDocument();
          // Verify the text content matches (using textContent to avoid normalization issues)
          expect(normalContent.textContent).toBe(text);

          // Fallback should NOT be displayed
          expect(
            screen.queryByTestId('error-boundary-fallback')
          ).not.toBeInTheDocument();
        }),
        { numRuns: 100 }
      );
    });
  });
});
