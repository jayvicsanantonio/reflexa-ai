/**
 * Shared AI Service Interfaces
 * Following Interface Segregation Principle (ISP) - small, focused interfaces
 */

/**
 * Interface for availability checking
 */
export interface IAvailabilityChecker {
  checkAvailability(): Promise<boolean>;
  isAvailable(): boolean;
}

/**
 * Interface for session lifecycle management
 */
export interface ISessionManager<TSession> {
  getOrCreate(
    key: string,
    factory: () => Promise<TSession | null>
  ): Promise<TSession | null>;
  destroy(key: string): void;
  destroyAll(): void;
}

/**
 * Interface for retry operations
 */
export interface IRetryHandler {
  executeWithRetry<T>(
    operation: () => Promise<T>,
    initialTimeout: number,
    retryTimeout: number
  ): Promise<T>;
}

/**
 * Interface for destroyable resources
 */
export interface IDestroyable {
  destroy(): void;
}

/**
 * Base interface for all AI managers
 */
export interface IAIManager extends IAvailabilityChecker, IDestroyable {}
