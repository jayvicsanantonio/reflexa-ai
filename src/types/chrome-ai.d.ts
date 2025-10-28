/**
 * Type declarations for Chrome Built-in AI APIs
 * These APIs are experimental and may not be available in all Chrome versions
 */

/**
 * Chrome AI namespace containing all built-in AI APIs
 */
interface ChromeAI {
  summarizer?: unknown;
  writer?: unknown;
  rewriter?: unknown;
  languageDetector?: unknown;
  translator?: unknown;
  languageModel?: unknown;
}

/**
 * Extend the global Window interface to include Chrome AI APIs
 */
declare global {
  interface Window {
    ai?: ChromeAI;
  }

  // For service workers
  const ai: ChromeAI | undefined;
}

export {};
