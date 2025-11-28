/**
 * ErrorService Unit and Property-Based Tests
 *
 * Tests for the centralized error handling service covering:
 * - Error creation with standardized structure
 * - User-friendly formatting without technical details
 * - Error logging with severity levels
 * - Recoverability determination and suggestions
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ErrorService } from './ErrorService';
import {
  type ErrorCode,
  type ErrorContext,
  ERROR_CODE_MESSAGES,
  ERROR_CODE_RECOVERABLE,
  ERROR_CODE_SUGGESTIONS,
} from './interfaces';

// Mock the logger module
vi.mock('../../../utils/logger', () => ({
  devLog: vi.fn(),
  devWarn: vi.fn(),
  devError: vi.fn(),
}));

import { devLog, devWarn, devError } from '../../../utils/logger';

// ============================================
// fast-check Arbitraries for Property Testing
// ============================================

const errorCodeArb = fc.constantFrom<ErrorCode>(
  'AI_UNAVAILABLE',
  'SESSION_CREATE_FAILED',
  'OPERATION_TIMEOUT',
  'NETWORK_ERROR',
  'UNKNOWN_ERROR'
);

const errorMessageArb = fc.string({ minLength: 1, maxLength: 200 });

const errorContextArb: fc.Arbitrary<ErrorContext> = fc.record(
  {
    operation: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
      nil: undefined,
    }),
    manager: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
      nil: undefined,
    }),
    sessionKey: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
      nil: undefined,
    }),
    attemptNumber: fc.option(fc.integer({ min: 1, max: 10 }), {
      nil: undefined,
    }),
  },
  { requiredKeys: [] }
);

const recoverableErrorCodeArb = fc.constantFrom<ErrorCode>(
  'AI_UNAVAILABLE',
  'SESSION_CREATE_FAILED',
  'OPERATION_TIMEOUT',
  'NETWORK_ERROR'
);

const nonRecoverableErrorCodeArb = fc.constantFrom<ErrorCode>('UNKNOWN_ERROR');

const technicalDetailsArb = fc.oneof(
  fc.constant('Error: '),
  fc.constant('at '),
  fc.constant('stack trace'),
  fc.constant('TypeError:'),
  fc.constant('ReferenceError:'),
  fc.constant('undefined'),
  fc.constant('null'),
  fc.constant('.ts:'),
  fc.constant('.js:'),
  fc.constant('line '),
  fc.constant('column ')
);

describe('ErrorService', () => {
  let errorService: ErrorService;

  beforeEach(() => {
    errorService = new ErrorService();
    vi.clearAllMocks();
  });

  describe('Unit Tests', () => {
    describe('createError', () => {
      it('should create error with all required fields', () => {
        const error = errorService.createError(
          'AI_UNAVAILABLE',
          'Test message'
        );

        expect(error.code).toBe('AI_UNAVAILABLE');
        expect(error.message).toBe('Test message');
        expect(error.recoverable).toBe(true);
        expect(error.timestamp).toBeTypeOf('number');
        expect(error.severity).toBe('warning');
      });

      it('should include context when provided', () => {
        const context: ErrorContext = {
          operation: 'generateText',
          manager: 'WriterManager',
        };

        const error = errorService.createError(
          'SESSION_CREATE_FAILED',
          'Session failed',
          context
        );

        expect(error.context).toEqual(context);
      });

      it('should include suggestions for recoverable errors', () => {
        const error = errorService.createError(
          'AI_UNAVAILABLE',
          'AI not available'
        );

        expect(error.suggestions).toBeDefined();
        expect(error.suggestions!.length).toBeGreaterThan(0);
      });

      it('should not include suggestions for non-recoverable errors', () => {
        const error = errorService.createError(
          'UNKNOWN_ERROR',
          'Unknown error'
        );

        expect(error.suggestions).toBeUndefined();
      });
    });

    describe('formatForUser', () => {
      it('should return user-friendly message for AI_UNAVAILABLE', () => {
        const error = errorService.createError(
          'AI_UNAVAILABLE',
          'Technical: Chrome AI API returned null'
        );

        const formatted = errorService.formatForUser(error);

        expect(formatted).toBe(ERROR_CODE_MESSAGES.AI_UNAVAILABLE);
        expect(formatted).not.toContain('Technical');
        expect(formatted).not.toContain('Chrome AI API');
      });

      it('should return user-friendly message for each error code', () => {
        const codes: ErrorCode[] = [
          'AI_UNAVAILABLE',
          'SESSION_CREATE_FAILED',
          'OPERATION_TIMEOUT',
          'NETWORK_ERROR',
          'UNKNOWN_ERROR',
        ];

        for (const code of codes) {
          const error = errorService.createError(code, 'Technical message');
          const formatted = errorService.formatForUser(error);
          expect(formatted).toBe(ERROR_CODE_MESSAGES[code]);
        }
      });
    });

    describe('log', () => {
      it('should log info severity with devLog', () => {
        const error = errorService.createError('AI_UNAVAILABLE', 'Test');
        error.severity = 'info';
        errorService.log(error);
        expect(devLog).toHaveBeenCalled();
      });

      it('should log warning severity with devWarn', () => {
        const error = errorService.createError('AI_UNAVAILABLE', 'Test');
        errorService.log(error);
        expect(devWarn).toHaveBeenCalled();
      });

      it('should log error severity with devError', () => {
        const error = errorService.createError('SESSION_CREATE_FAILED', 'Test');
        errorService.log(error);
        expect(devError).toHaveBeenCalled();
      });

      it('should log critical severity with devError', () => {
        const error = errorService.createError('UNKNOWN_ERROR', 'Test');
        error.severity = 'critical';
        errorService.log(error);
        expect(devError).toHaveBeenCalled();
      });
    });

    describe('isRecoverable', () => {
      it('should return true for recoverable errors', () => {
        const error = errorService.createError('AI_UNAVAILABLE', 'Test');
        expect(errorService.isRecoverable(error)).toBe(true);
      });

      it('should return false for non-recoverable errors', () => {
        const error = errorService.createError('UNKNOWN_ERROR', 'Test');
        expect(errorService.isRecoverable(error)).toBe(false);
      });
    });

    describe('getSuggestions', () => {
      it('should return suggestions for recoverable errors', () => {
        const error = errorService.createError('AI_UNAVAILABLE', 'Test');
        const suggestions = errorService.getSuggestions(error);

        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions).toEqual(ERROR_CODE_SUGGESTIONS.AI_UNAVAILABLE);
      });

      it('should return empty array for non-recoverable errors', () => {
        const error = errorService.createError('UNKNOWN_ERROR', 'Test');
        const suggestions = errorService.getSuggestions(error);
        expect(suggestions).toEqual([]);
      });
    });

    describe('fromUnknown', () => {
      it('should wrap Error instances', () => {
        const originalError = new Error('Original error message');
        const error = errorService.fromUnknown(originalError);

        expect(error.code).toBe('UNKNOWN_ERROR');
        expect(error.message).toBe('Original error message');
        expect(error.context?.originalError).toBe(originalError);
      });

      it('should wrap non-Error values', () => {
        const error = errorService.fromUnknown('string error');

        expect(error.code).toBe('UNKNOWN_ERROR');
        expect(error.message).toBe('An unexpected error occurred');
      });

      it('should include provided context', () => {
        const context: ErrorContext = { operation: 'test' };
        const error = errorService.fromUnknown(new Error('Test'), context);
        expect(error.context?.operation).toBe('test');
      });
    });
  });

  describe('Property-Based Tests', () => {
    it('Property 13: Error creation produces standardized object', () => {
      fc.assert(
        fc.property(
          errorCodeArb,
          errorMessageArb,
          fc.option(errorContextArb, { nil: undefined }),
          (code, message, context) => {
            const service = new ErrorService();
            const error = service.createError(code, message, context);

            expect(error.code).toBe(code);
            expect(error.message).toBe(message);
            expect(typeof error.recoverable).toBe('boolean');
            expect(typeof error.timestamp).toBe('number');
            expect(error.timestamp).toBeGreaterThan(0);
            expect(error.severity).toBeDefined();

            if (context !== undefined) {
              expect(error.context).toEqual(context);
            }

            expect(error.recoverable).toBe(ERROR_CODE_RECOVERABLE[code]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 14: Recoverable errors include suggestions', () => {
      fc.assert(
        fc.property(
          recoverableErrorCodeArb,
          errorMessageArb,
          (code, message) => {
            const service = new ErrorService();
            const error = service.createError(code, message);

            expect(error.recoverable).toBe(true);
            expect(error.suggestions).toBeDefined();
            expect(Array.isArray(error.suggestions)).toBe(true);
            expect(error.suggestions!.length).toBeGreaterThan(0);

            for (const suggestion of error.suggestions!) {
              expect(typeof suggestion).toBe('string');
              expect(suggestion.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 15: User-friendly formatting hides technical details', () => {
      fc.assert(
        fc.property(
          errorCodeArb,
          fc.oneof(
            errorMessageArb,
            fc
              .tuple(technicalDetailsArb, errorMessageArb)
              .map(([tech, msg]) => `${tech}${msg}`)
          ),
          errorContextArb,
          (code, message, context) => {
            const service = new ErrorService();
            const error = service.createError(code, message, context);
            const formatted = service.formatForUser(error);

            expect(formatted).toBe(ERROR_CODE_MESSAGES[code]);
            expect(formatted).not.toMatch(/Error:/i);
            expect(formatted).not.toMatch(/at\s+\w+/);
            expect(formatted).not.toMatch(/\.ts:/);
            expect(formatted).not.toMatch(/\.js:/);
            expect(formatted).not.toMatch(/line\s+\d+/i);
            expect(formatted).not.toMatch(/column\s+\d+/i);
            expect(formatted).not.toMatch(/TypeError/);
            expect(formatted).not.toMatch(/ReferenceError/);
            expect(formatted).not.toMatch(/undefined/);
            expect(formatted).not.toMatch(/null/);

            if (message !== ERROR_CODE_MESSAGES[code]) {
              if (message.includes('Error:') || message.includes('.ts:')) {
                expect(formatted).not.toBe(message);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property: Non-recoverable errors have no suggestions', () => {
      fc.assert(
        fc.property(
          nonRecoverableErrorCodeArb,
          errorMessageArb,
          (code, message) => {
            const service = new ErrorService();
            const error = service.createError(code, message);

            expect(error.recoverable).toBe(false);
            expect(error.suggestions).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property: Timestamp is always recent', () => {
      fc.assert(
        fc.property(errorCodeArb, errorMessageArb, (code, message) => {
          const before = Date.now();
          const service = new ErrorService();
          const error = service.createError(code, message);
          const after = Date.now();

          expect(error.timestamp).toBeGreaterThanOrEqual(before);
          expect(error.timestamp).toBeLessThanOrEqual(after);
        }),
        { numRuns: 100 }
      );
    });
  });
});
