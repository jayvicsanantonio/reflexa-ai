/**
 * Logger utility for conditional logging
 * Only logs in development mode to reduce console noise in production
 */

/**
 * Check if we're in development mode
 *
 * Detection priority:
 * 1. Vite environment variable (import.meta.env.DEV)
 * 2. Unpacked extension check (Chrome extensions loaded locally don't have update_url)
 * 3. Fallback to production mode
 */
const isDev = (() => {
  // 1. Check Vite environment variable (set during build)
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV === true) {
      return true;
    }
  } catch {
    // ignore
  }

  // 2. Check if extension is unpacked (loaded locally for testing)
  // Unpacked extensions don't have update_url, which is only present in Chrome Web Store extensions
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
      const manifest = chrome.runtime.getManifest();
      // If update_url is undefined, it's an unpacked extension (local testing)
      // Chrome Web Store extensions always have update_url
      if (manifest.update_url === undefined) {
        return true; // Unpacked = local testing = enable logging
      }
    }
  } catch {
    // ignore
  }

  // 3. Fallback: assume production (no logging)
  return false;
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
