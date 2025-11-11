/**
 * Memory management utilities for Chrome extension
 * Helps prevent memory leaks and optimize resource usage
 */

/**
 * Manages event listener cleanup with automatic removal
 * Prevents memory leaks from forgotten removeEventListener calls
 */
export class EventListenerManager {
  private listeners: {
    target: EventTarget;
    event: string;
    handler: EventListener;
    options?: AddEventListenerOptions;
  }[] = [];

  /**
   * Add an event listener and track it for cleanup
   */
  addEventListener(
    target: EventTarget,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): void {
    target.addEventListener(event, handler, options);
    this.listeners.push({ target, event, handler, options });
  }

  /**
   * Remove a specific event listener
   */
  removeEventListener(
    target: EventTarget,
    event: string,
    handler: EventListener
  ): void {
    target.removeEventListener(event, handler);
    this.listeners = this.listeners.filter(
      (listener) =>
        listener.target !== target ||
        listener.event !== event ||
        listener.handler !== handler
    );
  }

  /**
   * Clean up all tracked event listeners
   */
  cleanup(): void {
    this.listeners.forEach(({ target, event, handler, options }) => {
      target.removeEventListener(event, handler, options);
    });
    this.listeners = [];
  }
}

/**
 * Manages timer cleanup (setTimeout/setInterval)
 * Prevents dangling timers from consuming memory
 */
export class TimerManager {
  private timers: ReturnType<typeof setTimeout>[] = [];

  /**
   * Set a timeout and track it for cleanup
   */
  setTimeout<T extends unknown[]>(
    callback: (...args: T) => void,
    delay?: number,
    ...args: T
  ): ReturnType<typeof setTimeout> {
    const timerId = setTimeout(callback, delay ?? 0, ...args);
    this.timers.push(timerId);
    return timerId;
  }

  /**
   * Set an interval and track it for cleanup
   */
  setInterval<T extends unknown[]>(
    callback: (...args: T) => void,
    delay?: number,
    ...args: T
  ): ReturnType<typeof setInterval> {
    const timerId = setInterval(callback, delay ?? 0, ...args);
    this.timers.push(timerId);
    return timerId;
  }

  /**
   * Clear a specific timer
   */
  clear(timerId: ReturnType<typeof setTimeout>): void {
    clearTimeout(timerId);
    clearInterval(timerId as unknown as ReturnType<typeof setInterval>);
    this.timers = this.timers.filter((id) => id !== timerId);
  }

  /**
   * Clean up all tracked timers
   */
  cleanup(): void {
    this.timers.forEach((timerId) => {
      clearTimeout(timerId);
      clearInterval(timerId as unknown as ReturnType<typeof setInterval>);
    });
    this.timers = [];
  }
}

/**
 * Memoization cache with size limits and TTL support
 * Prevents memory from growing unbounded
 */
export class LimitedCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  private maxSize: number;
  private ttl: number;

  /**
   * @param maxSize Maximum number of entries to store
   * @param ttl Time to live in milliseconds (0 = no expiration)
   */
  constructor(maxSize = 100, ttl = 0) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Get a value from cache
   * Returns undefined if not found or expired
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check if entry has expired
    if (this.ttl > 0 && Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Set a value in cache
   * Evicts oldest entry if cache is full
   */
  set(key: string, value: T): void {
    // Remove old entry if it exists
    this.cache.delete(key);

    // If cache is full, remove the oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, { value, timestamp: Date.now() });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Clear all entries from cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * Weak map wrapper for automatic cleanup when objects are garbage collected
 * Use when you need to associate data with objects without preventing GC
 */
export class WeakCache<K extends WeakKey, V> {
  private weakMap = new WeakMap<K, V>();

  get(key: K): V | undefined {
    return this.weakMap.get(key);
  }

  set(key: K, value: V): void {
    this.weakMap.set(key, value);
  }

  has(key: K): boolean {
    return this.weakMap.has(key);
  }
}

/**
 * Debounce with automatic cleanup
 */
export function createDebouncedFunction<T extends unknown[], R>(
  func: (...args: T) => R,
  delay: number,
  timerManager: TimerManager
): (...args: T) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: T): void {
    if (timeout !== null) {
      timerManager.clear(timeout);
    }

    timeout = timerManager.setTimeout(() => {
      func(...args);
      timeout = null;
    }, delay);
  };
}

/**
 * Create a resource cleanup manager
 * Coordinates cleanup of multiple resources
 */
export class ResourceManager {
  private cleanupFunctions: (() => void | Promise<void>)[] = [];

  /**
   * Register a cleanup function
   */
  onCleanup(fn: () => void | Promise<void>): void {
    this.cleanupFunctions.push(fn);
  }

  /**
   * Register event listener with automatic cleanup
   */
  addEventListener(
    target: EventTarget,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): void {
    target.addEventListener(event, handler, options);
    this.onCleanup(() => {
      target.removeEventListener(event, handler, options);
    });
  }

  /**
   * Register timer with automatic cleanup
   */
  setTimeout<T extends unknown[]>(
    callback: (...args: T) => void,
    delay?: number,
    ...args: T
  ): ReturnType<typeof setTimeout> {
    const timerId = setTimeout(callback, delay, ...args);
    this.onCleanup(() => clearTimeout(timerId));
    return timerId;
  }

  /**
   * Clean up all registered resources
   */
  async cleanup(): Promise<void> {
    const results = this.cleanupFunctions.map((fn) => fn());
    await Promise.all(results.filter((r) => r instanceof Promise));
    this.cleanupFunctions = [];
  }
}
