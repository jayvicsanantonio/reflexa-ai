/**
 * Shared AI Service Interfaces
 *
 * This module defines the core interfaces for AI service components.
 * Following Interface Segregation Principle (ISP) - small, focused interfaces
 * that allow components to depend only on the methods they actually use.
 *
 * @module shared/interfaces
 */

/**
 * Interface for checking AI feature availability.
 *
 * Implemented by AI managers to provide availability status for their
 * respective AI capabilities. This allows the UI to show appropriate
 * states and messages based on whether features are available.
 *
 * @example
 * ```typescript
 * class WriterManager implements IAvailabilityChecker {
 *   private available = false;
 *
 *   async checkAvailability(): Promise<boolean> {
 *     this.available = await ai.writer.capabilities() !== null;
 *     return this.available;
 *   }
 *
 *   isAvailable(): boolean {
 *     return this.available;
 *   }
 * }
 * ```
 */
export interface IAvailabilityChecker {
  /**
   * Asynchronously checks if the AI feature is available.
   *
   * This method should query the underlying AI API to determine
   * current availability. The result should be cached for use
   * by `isAvailable()`.
   *
   * @returns A promise that resolves to `true` if the feature is available,
   *          `false` otherwise
   */
  checkAvailability(): Promise<boolean>;

  /**
   * Synchronously returns the cached availability status.
   *
   * Returns the result of the last `checkAvailability()` call.
   * Should be called after `checkAvailability()` has been invoked
   * at least once.
   *
   * @returns `true` if the feature is available, `false` otherwise
   */
  isAvailable(): boolean;
}

/**
 * Interface for managing the lifecycle of AI sessions.
 *
 * Provides methods for creating, caching, and destroying sessions.
 * Sessions are identified by unique string keys, allowing multiple
 * sessions with different configurations to coexist.
 *
 * @typeParam TSession - The type of session being managed
 *
 * @example
 * ```typescript
 * class MySessionManager implements ISessionManager<WriterSession> {
 *   async getOrCreate(key: string, factory: () => Promise<WriterSession | null>) {
 *     // Implementation
 *   }
 *
 *   destroy(key: string): void {
 *     // Implementation
 *   }
 *
 *   destroyAll(): void {
 *     // Implementation
 *   }
 * }
 * ```
 */
export interface ISessionManager<TSession> {
  /**
   * Gets an existing session or creates a new one using the factory function.
   *
   * If a session with the given key exists in the cache, it is returned
   * without calling the factory. Otherwise, the factory is called to create
   * a new session which is then cached.
   *
   * @param key - A unique identifier for the session
   * @param factory - An async function that creates a new session instance
   * @returns The cached or newly created session, or `null` if creation fails
   */
  getOrCreate(
    key: string,
    factory: () => Promise<TSession | null>
  ): Promise<TSession | null>;

  /**
   * Destroys a specific session and removes it from the cache.
   *
   * If no session exists with the given key, this method does nothing.
   *
   * @param key - The unique identifier of the session to destroy
   */
  destroy(key: string): void;

  /**
   * Destroys all cached sessions and clears the cache.
   *
   * Useful for cleanup during extension unload or state reset.
   */
  destroyAll(): void;
}

/**
 * Interface for executing operations with automatic retry logic.
 *
 * Provides a standardized way to handle transient failures by automatically
 * retrying failed operations with configurable timeouts.
 *
 * @example
 * ```typescript
 * class MyRetryHandler implements IRetryHandler {
 *   async executeWithRetry<T>(
 *     operation: () => Promise<T>,
 *     initialTimeout: number,
 *     retryTimeout: number
 *   ): Promise<T> {
 *     // Implementation with retry logic
 *   }
 * }
 * ```
 */
export interface IRetryHandler {
  /**
   * Executes an operation with automatic retry on failure.
   *
   * First attempts the operation with the initial timeout. If it fails,
   * retries once with the retry timeout. Throws if both attempts fail.
   *
   * @typeParam T - The return type of the operation
   * @param operation - An async function to execute
   * @param initialTimeout - Timeout in milliseconds for the first attempt
   * @param retryTimeout - Timeout in milliseconds for the retry attempt
   * @returns The result of the operation if successful
   * @throws Error if both attempts fail or timeout
   */
  executeWithRetry<T>(
    operation: () => Promise<T>,
    initialTimeout: number,
    retryTimeout: number
  ): Promise<T>;
}

/**
 * Interface for resources that can be destroyed/cleaned up.
 *
 * Implemented by components that hold resources (sessions, connections, etc.)
 * that need to be explicitly released when no longer needed.
 *
 * @example
 * ```typescript
 * class AISession implements IDestroyable {
 *   destroy(): void {
 *     // Release resources, close connections, etc.
 *   }
 * }
 * ```
 */
export interface IDestroyable {
  /**
   * Destroys the resource and releases any associated resources.
   *
   * After calling this method, the resource should not be used.
   * Implementations should handle being called multiple times gracefully.
   */
  destroy(): void;
}

/**
 * Base interface for all AI managers.
 *
 * Combines availability checking and destroyable interfaces to provide
 * a common contract for all AI manager implementations. All AI managers
 * (Writer, Rewriter, Summarizer, etc.) should implement this interface.
 *
 * @example
 * ```typescript
 * class WriterManager implements IAIManager {
 *   private available = false;
 *
 *   async checkAvailability(): Promise<boolean> {
 *     this.available = await ai.writer.capabilities() !== null;
 *     return this.available;
 *   }
 *
 *   isAvailable(): boolean {
 *     return this.available;
 *   }
 *
 *   destroy(): void {
 *     // Clean up sessions and resources
 *   }
 * }
 * ```
 */
export interface IAIManager extends IAvailabilityChecker, IDestroyable {}
