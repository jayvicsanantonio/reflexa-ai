/**
 * Custom error classes for Reflexa AI Chrome Extension
 */

/**
 * Base error class for all Reflexa AI errors
 */
class ReflexaError extends Error {
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
