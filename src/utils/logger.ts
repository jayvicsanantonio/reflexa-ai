/**
 * Logger utility for conditional logging
 * Only logs in development mode to reduce console noise in production
 */

/**
 * Check if we're in development mode
 * In Vite, import.meta.env.DEV is true in development
 */
const isDev = (() => {
  try {
    // @ts-expect-error - import.meta.env is a Vite feature
    return typeof import.meta !== 'undefined' && import.meta.env?.DEV === true;
  } catch {
    // Fallback: assume production if import.meta is not available
    return false;
  }
})();

/**
 * Development-only console.log
 */
export const devLog = (...args: unknown[]): void => {
  if (isDev) {
    console.log('[Reflexa]', ...args);
  }
};

/**
 * Development-only console.warn
 */
export const devWarn = (...args: unknown[]): void => {
  if (isDev) {
    console.warn('[Reflexa]', ...args);
  }
};

/**
 * Always logs errors (even in production)
 * Errors should always be visible for debugging
 */
export const devError = (...args: unknown[]): void => {
  console.error('[Reflexa]', ...args);
};

/**
 * Performance logging (always enabled for monitoring)
 */
export const perfLog = (...args: unknown[]): void => {
  if (isDev) {
    console.log('[Reflexa Perf]', ...args);
  }
};

