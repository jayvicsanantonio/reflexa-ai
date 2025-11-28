/**
 * ErrorService Implementation
 *
 * Provides centralized error handling for the Reflexa AI Chrome Extension.
 * Creates standardized errors, formats them for users, and logs with appropriate severity.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { devLog, devWarn, devError } from '../../../utils/logger';
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
 */
export class ErrorService implements IErrorService {
  /**
   * Creates a standardized error object from an error code and message.
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
   */
  formatForUser(error: StandardError): string {
    return ERROR_CODE_MESSAGES[error.code];
  }

  /**
   * Logs an error with the appropriate severity level.
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
   */
  isRecoverable(error: StandardError): boolean {
    return error.recoverable;
  }

  /**
   * Gets recovery suggestions for an error.
   */
  getSuggestions(error: StandardError): string[] {
    return error.suggestions ?? [];
  }

  /**
   * Creates an error from an unknown error value.
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
 */
export const errorService = new ErrorService();
