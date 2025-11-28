/**
 * ErrorService Implementation
 *
 * Provides centralized error handling for the Reflexa AI Chrome Extension.
 * Creates standardized errors, formats them for users, and logs with appropriate severity.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { devLog, devWarn, devError } from '../../utils/logger';
import {
  type ErrorCode,
  type ErrorContext,
  type StandardError,
  type IErrorService,
  ERROR_CODE_MESSAGES,
  ERROR_CODE_RECOVERABLE,
  ERROR_CODE_SEVERITY,
  ERROR_CODE_SUGGESTIONS,
} from './interfaces';

/**
 * Centralized error handling service for consistent error management.
 *
 * Features:
 * - Creates standardized error objects with codes, messages, and context
 * - Provides user-friendly error formatting without technical details
 * - Logs errors with appropriate severity levels
 * - Determines error recoverability and provides recovery suggestions
 *
 * @example
 * ```typescript
 * const errorService = new ErrorService();
 *
 * // Create an error
 * const error = errorService.createError(
 *   'AI_UNAVAILABLE',
 *   'Chrome AI is not available',
 *   { manager: 'WriterManager', operation: 'generateText' }
 * );
 *
 * // Log the error
 * errorService.log(error);
 *
 * // Get user-friendly message
 * const userMessage = errorService.formatForUser(error);
 * ```
 */
export class ErrorService implements IErrorService {
  /**
   * Creates a standardized error object from an error code and message.
   *
   * The created error includes:
   * - Error code for categorization
   * - Human-readable message
   * - Recoverability status based on error code
   * - Recovery suggestions for recoverable errors
   * - Timestamp for tracking
   * - Severity level for logging
   *
   * @param code - The error code categorizing this error
   * @param message - Human-readable error message
   * @param context - Optional context information for debugging
   * @returns A standardized error object
   *
   * **Validates: Requirements 4.1, 4.2**
   */
  createError(
    code: ErrorCode,
    message: string,
    context?: ErrorContext
  ): StandardError {
    const recoverable = ERROR_CODE_RECOVERABLE[code];
    const severity = ERROR_CODE_SEVERITY[code];
    const suggestions = recoverable ? ERROR_CODE_SUGGESTIONS[code] : [];

    return {
      code,
      message,
      context,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      recoverable,
      timestamp: Date.now(),
      severity,
    };
  }

  /**
   * Formats an error for display to the user.
   *
   * Returns a user-friendly message that:
   * - Does not expose technical details like stack traces
   * - Does not expose internal error codes
   * - Does not expose implementation details
   * - Provides actionable information when possible
   *
   * @param error - The standardized error to format
   * @returns A user-friendly error message
   *
   * **Validates: Requirements 4.4**
   */
  formatForUser(error: StandardError): string {
    // Use the default user-friendly message for the error code
    // This ensures we never expose technical details
    return ERROR_CODE_MESSAGES[error.code];
  }

  /**
   * Logs an error with the appropriate severity level.
   *
   * Severity levels:
   * - info: Informational messages
   * - warning: Recoverable issues that should be noted
   * - error: Errors that need attention
   * - critical: Severe errors requiring immediate attention
   *
   * @param error - The standardized error to log
   *
   * **Validates: Requirements 4.3**
   */
  log(error: StandardError): void {
    const logPrefix = `[${error.code}]`;
    const logMessage = `${logPrefix} ${error.message}`;
    const logContext = error.context
      ? { context: error.context, timestamp: error.timestamp }
      : { timestamp: error.timestamp };

    switch (error.severity) {
      case 'info':
        devLog(logMessage, logContext);
        break;
      case 'warning':
        devWarn(logMessage, logContext);
        break;
      case 'error':
      case 'critical':
        devError(logMessage, logContext);
        break;
      default:
        devError(logMessage, logContext);
    }
  }

  /**
   * Determines if an error is recoverable.
   *
   * Recoverable errors are those where the user can take action to resolve
   * the issue, such as retrying the operation or checking their connection.
   *
   * @param error - The standardized error to check
   * @returns True if the error can be recovered from
   *
   * **Validates: Requirements 4.2**
   */
  isRecoverable(error: StandardError): boolean {
    return error.recoverable;
  }

  /**
   * Gets recovery suggestions for an error.
   *
   * @param error - The standardized error
   * @returns Array of recovery suggestions, or empty array if not recoverable
   */
  getSuggestions(error: StandardError): string[] {
    return error.suggestions ?? [];
  }

  /**
   * Creates an error from an unknown error value.
   *
   * Useful for wrapping caught exceptions into standardized errors.
   *
   * @param unknownError - The caught error value
   * @param context - Optional context information
   * @returns A standardized error object
   */
  fromUnknown(unknownError: unknown, context?: ErrorContext): StandardError {
    const message =
      unknownError instanceof Error
        ? unknownError.message
        : 'An unexpected error occurred';

    const errorContext: ErrorContext = {
      ...context,
      originalError:
        unknownError instanceof Error
          ? unknownError
          : new Error(String(unknownError)),
    };

    return this.createError('UNKNOWN_ERROR', message, errorContext);
  }
}

/**
 * Singleton instance of ErrorService for convenience.
 * Use this for simple cases where dependency injection is not needed.
 */
export const errorService = new ErrorService();
