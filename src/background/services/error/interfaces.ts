/**
 * ErrorService Types and Interfaces
 *
 * Defines standardized error handling types for the Reflexa AI Chrome Extension.
 * These types enable consistent error creation, formatting, and recovery across
 * all AI managers and components.
 *
 * Requirements: 4.1, 4.2
 */

/**
 * Standardized error codes for categorizing errors across the application.
 * Each code maps to a specific error category with defined recoverability.
 */
export type ErrorCode =
  | 'AI_UNAVAILABLE'
  | 'SESSION_CREATE_FAILED'
  | 'OPERATION_TIMEOUT'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Severity levels for error logging.
 * Used to determine how errors should be logged and reported.
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Context information attached to errors for debugging and recovery.
 */
export interface ErrorContext {
  /** The operation that was being performed when the error occurred */
  operation?: string;
  /** The AI manager that encountered the error */
  manager?: string;
  /** The session key if applicable */
  sessionKey?: string;
  /** The attempt number for retry operations */
  attemptNumber?: number;
  /** The original error that caused this error */
  originalError?: Error;
  /** Additional metadata for debugging */
  metadata?: Record<string, unknown>;
}

/**
 * Standardized error object structure.
 * All errors created by ErrorService conform to this interface.
 */
export interface StandardError {
  /** The error code categorizing this error */
  code: ErrorCode;
  /** Human-readable error message */
  message: string;
  /** Additional context for debugging */
  context?: ErrorContext;
  /** Recovery suggestions for the user (only for recoverable errors) */
  suggestions?: string[];
  /** Whether this error can be recovered from */
  recoverable: boolean;
  /** Timestamp when the error was created */
  timestamp: number;
  /** Severity level for logging */
  severity: ErrorSeverity;
}

/**
 * Interface for the ErrorService.
 * Provides methods for creating, formatting, logging, and analyzing errors.
 */
export interface IErrorService {
  /**
   * Creates a standardized error object from an error code and message.
   * @param code - The error code categorizing this error
   * @param message - Human-readable error message
   * @param context - Optional context information for debugging
   * @returns A standardized error object
   */
  createError(
    code: ErrorCode,
    message: string,
    context?: ErrorContext
  ): StandardError;

  /**
   * Formats an error for display to the user.
   * Returns a user-friendly message without technical details.
   * @param error - The standardized error to format
   * @returns A user-friendly error message
   */
  formatForUser(error: StandardError): string;

  /**
   * Logs an error with the appropriate severity level.
   * @param error - The standardized error to log
   */
  log(error: StandardError): void;

  /**
   * Determines if an error is recoverable.
   * @param error - The standardized error to check
   * @returns True if the error can be recovered from
   */
  isRecoverable(error: StandardError): boolean;
}

/**
 * Mapping of error codes to their default user-friendly messages.
 */
export const ERROR_CODE_MESSAGES: Record<ErrorCode, string> = {
  AI_UNAVAILABLE: 'AI features are temporarily unavailable. Please try again.',
  SESSION_CREATE_FAILED: 'Unable to start AI session. Please retry.',
  OPERATION_TIMEOUT: 'The operation took too long. Please try again.',
  NETWORK_ERROR: 'Network connection issue. Please check your connection.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};

/**
 * Mapping of error codes to their recoverability status.
 */
export const ERROR_CODE_RECOVERABLE: Record<ErrorCode, boolean> = {
  AI_UNAVAILABLE: true,
  SESSION_CREATE_FAILED: true,
  OPERATION_TIMEOUT: true,
  NETWORK_ERROR: true,
  UNKNOWN_ERROR: false,
};

/**
 * Mapping of error codes to their default severity levels.
 */
export const ERROR_CODE_SEVERITY: Record<ErrorCode, ErrorSeverity> = {
  AI_UNAVAILABLE: 'warning',
  SESSION_CREATE_FAILED: 'error',
  OPERATION_TIMEOUT: 'warning',
  NETWORK_ERROR: 'warning',
  UNKNOWN_ERROR: 'error',
};

/**
 * Recovery suggestions for each recoverable error code.
 */
export const ERROR_CODE_SUGGESTIONS: Record<ErrorCode, string[]> = {
  AI_UNAVAILABLE: [
    'Wait a moment and try again',
    'Check if Chrome AI features are enabled',
    'Restart your browser if the issue persists',
  ],
  SESSION_CREATE_FAILED: [
    'Try the operation again',
    'Close other tabs using AI features',
    'Restart the extension',
  ],
  OPERATION_TIMEOUT: [
    'Try again with a shorter text',
    'Check your internet connection',
    'Wait a moment and retry',
  ],
  NETWORK_ERROR: [
    'Check your internet connection',
    'Try again in a few moments',
    'Disable VPN if you are using one',
  ],
  UNKNOWN_ERROR: [],
};
