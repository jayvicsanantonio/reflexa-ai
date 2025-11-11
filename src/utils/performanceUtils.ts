/**
 * Performance optimization utilities for Chrome extension
 * Helps identify and fix performance bottlenecks
 */

/**
 * Measures execution time of a function
 * Useful for identifying slow operations
 */
export function measurePerformance<T>(
  label: string,
  fn: () => T
): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;

  if (duration > 100) {
    console.warn(`[Performance] ${label} took ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

/**
 * Measures async function execution time
 */
export async function measureAsyncPerformance<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  if (duration > 100) {
    console.warn(
      `[Performance] ${label} (async) took ${duration.toFixed(2)}ms`
    );
  }

  return { result, duration };
}

/**
 * Request animation frame batching
 * Groups multiple DOM updates into a single frame
 */
export class BatchedRAF {
  private pending = false;
  private callbacks: (() => void)[] = [];

  /**
   * Schedule a callback to run in the next animation frame
   */
  schedule(callback: () => void): void {
    this.callbacks.push(callback);

    if (!this.pending) {
      this.pending = true;
      requestAnimationFrame(() => {
        const cbs = this.callbacks;
        this.callbacks = [];
        this.pending = false;

        cbs.forEach((cb) => cb());
      });
    }
  }
}

/**
 * Intersection Observer wrapper with automatic cleanup
 * Useful for lazy loading and visibility tracking
 */
export class ObserverManager {
  private observers = new Map<Element, IntersectionObserver>();

  /**
   * Observe element with callback
   */
  observe(
    element: Element,
    callback: (isVisible: boolean) => void,
    options?: IntersectionObserverInit
  ): void {
    const observer = new IntersectionObserver(([entry]) => {
      callback(entry.isIntersecting);
    }, options);

    observer.observe(element);
    this.observers.set(element, observer);
  }

  /**
   * Stop observing element
   */
  unobserve(element: Element): void {
    const observer = this.observers.get(element);
    if (observer) {
      observer.unobserve(element);
      observer.disconnect();
      this.observers.delete(element);
    }
  }

  /**
   * Clean up all observers
   */
  cleanup(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }
}

/**
 * Memoize function result
 * Caches result based on arguments (uses shallow equality)
 */
export function memoize<T extends unknown[], R>(
  fn: (...args: T) => R
): (...args: T) => R {
  let lastArgs: T | undefined;
  let lastResult: R;
  let hasBeenCalled = false;

  return (...args: T): R => {
    if (!hasBeenCalled || !areArgumentsEqual(args, lastArgs)) {
      lastArgs = args;
      lastResult = fn(...args);
      hasBeenCalled = true;
    }

    return lastResult;
  };
}

/**
 * Shallow equality check for arrays
 */
function areArgumentsEqual<T extends unknown[]>(
  a: T | undefined,
  b: T | undefined
): boolean {
  if (a === undefined || b === undefined) return false;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}

/**
 * Virtual scrolling list optimization
 * Renders only visible items to improve performance
 *
 * Example usage in React:
 * const { startIndex, endIndex } = calculateVisibleRange(
 *   scrollTop,
 *   containerHeight,
 *   itemHeight,
 *   items.length
 * );
 * const visibleItems = items.slice(startIndex, endIndex);
 */
export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan = 3
): { startIndex: number; endIndex: number; offsetY: number } {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  const offsetY = startIndex * itemHeight;

  return { startIndex, endIndex, offsetY };
}

/**
 * Debounce with trailing edge
 * Ensures last call is executed
 */
export function debounceTrailing<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number
): (...args: T) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: T): void => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      fn(...args);
      timeout = null;
    }, delay);
  };
}

/**
 * Throttle function calls
 * Ensures function is called at most once per interval
 */
export function throttle<T extends unknown[]>(
  fn: (...args: T) => void,
  interval: number
): (...args: T) => void {
  let lastCall = 0;

  return (...args: T): void => {
    const now = Date.now();
    if (now - lastCall >= interval) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Detect if DOM element is visible to user
 * Used to skip rendering hidden content
 */
export function isElementVisible(element: Element): boolean {
  if (!(element instanceof HTMLElement)) return false;

  const style = window.getComputedStyle(element);

  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0'
  ) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return !(
    rect.bottom < 0 ||
    rect.right < 0 ||
    rect.top > window.innerHeight ||
    rect.left > window.innerWidth
  );
}

/**
 * Get memory usage estimate (if available)
 * Note: Limited browser support - Chrome only
 */
export function getMemoryUsage(): Promise<{
  used: number;
  limit: number;
  percentage: number;
} | null> {
  return Promise.resolve(getMemoryUsageSync());
}

/**
 * Synchronous version of getMemoryUsage
 */
function getMemoryUsageSync(): {
  used: number;
  limit: number;
  percentage: number;
} | null {
  // Type assertion needed as memory API is not in standard Performance interface
  const perf = performance as Performance & {
    memory?: {
      usedJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  };

  if (!perf.memory) {
    return null;
  }

  const used = perf.memory.usedJSHeapSize;
  const limit = perf.memory.jsHeapSizeLimit;

  return {
    used,
    limit,
    percentage: (used / limit) * 100,
  };
}
