/**
 * Custom error classes for Reflexa AI Chrome Extension
 */

/**
 * Base error class for all Reflexa AI errors
 */
export class ReflexaError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly recoverable = true
  ) {
    super(message);
    this.name = 'ReflexaError';
    Object.setPrototypeOf(this, ReflexaError.prototype);
  }
}

/**
 * Error thrown when AI service is unavailable
 */
export class AIUnavailableError extends ReflexaError {
  constructor(message = 'Local AI disabled — manual reflection available.') {
    super(message, 'AI_UNAVAILABLE', true);
    this.name = 'AIUnavailableError';
    Object.setPrototypeOf(this, AIUnavailableError.prototype);
  }
}

/**
 * Error thrown when AI request times out
 */
export class AITimeoutError extends ReflexaError {
  constructor(
    message = 'AI taking longer than expected. You can enter your summary manually.',
    public readonly duration: number
  ) {
    super(message, 'AI_TIMEOUT', true);
    this.name = 'AITimeoutError';
    Object.setPrototypeOf(this, AITimeoutError.prototype);
  }
}

/**
 * Error thrown when content exceeds size limits
 */
export class ContentTooLargeError extends ReflexaError {
  constructor(
    message = 'Long article detected. Summary based on first section.',
    public readonly actualSize: number,
    public readonly maxSize: number
  ) {
    super(message, 'CONTENT_TOO_LARGE', true);
    this.name = 'ContentTooLargeError';
    Object.setPrototypeOf(this, ContentTooLargeError.prototype);
  }
}

/**
 * Error thrown when storage quota is exceeded
 */
export class StorageFullError extends ReflexaError {
  constructor(
    message = 'Storage full. Export older reflections to free space.',
    public readonly usedBytes: number,
    public readonly quotaBytes: number
  ) {
    super(message, 'STORAGE_FULL', true);
    this.name = 'StorageFullError';
    Object.setPrototypeOf(this, StorageFullError.prototype);
  }
}

/**
 * Error thrown when network operation fails
 */
export class NetworkError extends ReflexaError {
  constructor(
    message = 'Network error. Changes will sync when online.',
    public readonly originalError?: Error
  ) {
    super(message, 'NETWORK_ERROR', true);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Error thrown for validation failures
 */
export class ValidationError extends ReflexaError {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message, 'VALIDATION_ERROR', false);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Type guard to check if error is a ReflexaError
 */
export function isReflexaError(error: unknown): error is ReflexaError {
  return error instanceof ReflexaError;
}

/**
 * Type guard to check if error is recoverable
 */
export function isRecoverableError(error: unknown): boolean {
  return isReflexaError(error) && error.recoverable;
}

/**
 * Get user-friendly error message from any error
 */
export function getErrorMessage(error: unknown): string {
  if (isReflexaError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

/**
 * Get error code from any error
 */
export function getErrorCode(error: unknown): string {
  if (isReflexaError(error)) {
    return error.code;
  }
  return 'UNKNOWN_ERROR';
}
