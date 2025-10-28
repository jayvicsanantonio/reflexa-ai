/**
 * Capability Detection Module
 * Detects availability of Chrome Built-in AI APIs with caching
 */

import type { AICapabilities } from '../types';

/**
 * Default TTL for capability cache (5 minutes)
 */
const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

/**
 * Internal cache structure for capability detection
 */
interface CapabilityCache {
  capabilities: AICapabilities;
  lastChecked: number;
  ttl: number;
}

/**
 * Capability Detector Class
 * Handles detection and caching of Chrome AI API availability
 */
export class CapabilityDetector {
  private cache: CapabilityCache | null = null;

  /**
   * Check if a specific API is available in the browser
   * @param apiName - Name of the API to check
   * @returns Availability status
   */
  private checkAPIAvailability(apiName: string): boolean {
    try {
      // Check if globalThis exists
      if (typeof globalThis === 'undefined') {
        return false;
      }

      // Note: Rewriter, Writer, and Proofreader APIs are accessed as globals,
      // not through the ai object
      if (
        apiName === 'rewriter' ||
        apiName === 'writer' ||
        apiName === 'proofreader'
      ) {
        // Check for capital-case global (e.g., 'Rewriter' in self)
        const capitalizedName =
          apiName.charAt(0).toUpperCase() + apiName.slice(1);
        return capitalizedName in globalThis;
      }

      // For other APIs, check through ai object
      const ai = (
        globalThis as typeof globalThis & { ai?: Record<string, unknown> }
      ).ai;

      if (!ai) {
        return false;
      }

      // Check if the specific API exists
      return apiName in ai;
    } catch (error) {
      console.warn(`Error checking ${apiName} availability:`, error);
      return false;
    }
  }

  /**
   * Detect all Chrome AI API capabilities
   * @param experimentalMode - Whether to enable experimental features
   * @returns AICapabilities object
   */
  detectCapabilities(experimentalMode = false): AICapabilities {
    const startTime = Date.now();

    // Check all seven Chrome AI APIs synchronously
    const summarizer = this.checkAPIAvailability('summarizer');
    const writer = this.checkAPIAvailability('writer');
    const rewriter = this.checkAPIAvailability('rewriter');
    const proofreader = this.checkAPIAvailability('languageDetector'); // Note: proofreader uses languageDetector
    const languageDetector = this.checkAPIAvailability('languageDetector');
    const translator = this.checkAPIAvailability('translator');
    const prompt = this.checkAPIAvailability('languageModel');

    const capabilities: AICapabilities = {
      summarizer,
      writer,
      rewriter,
      proofreader,
      languageDetector,
      translator,
      prompt,
      experimental: experimentalMode,
    };

    const duration = Date.now() - startTime;
    console.log(
      `Capability detection completed in ${duration}ms:`,
      capabilities
    );

    return capabilities;
  }

  /**
   * Get cached capabilities or detect new ones
   * @param experimentalMode - Whether to enable experimental features
   * @param forceFresh - Force fresh detection, bypassing cache
   * @returns AICapabilities object
   */
  getCapabilities(
    experimentalMode = false,
    forceFresh = false
  ): AICapabilities {
    // Check if cache is valid
    if (!forceFresh && this.isCacheValid()) {
      console.log('Using cached capabilities');
      return this.cache!.capabilities;
    }

    // Detect fresh capabilities
    const capabilities: AICapabilities =
      this.detectCapabilities(experimentalMode);

    // Update cache
    this.cache = {
      capabilities,
      lastChecked: Date.now(),
      ttl: DEFAULT_CACHE_TTL,
    } as CapabilityCache;

    return capabilities;
  }

  /**
   * Check if the current cache is still valid
   * @returns True if cache exists and hasn't expired
   */
  private isCacheValid(): boolean {
    if (!this.cache) {
      return false;
    }

    const now = Date.now();
    const cacheAge = now - this.cache.lastChecked;

    return cacheAge < this.cache.ttl;
  }

  /**
   * Refresh capabilities on demand
   * Forces a fresh detection and updates the cache
   * @param experimentalMode - Whether to enable experimental features
   * @returns Updated AICapabilities object
   */
  refreshCapabilities(experimentalMode = false): AICapabilities {
    console.log('Refreshing capabilities...');
    return this.getCapabilities(experimentalMode, true);
  }

  /**
   * Clear the capability cache
   */
  clearCache(): void {
    this.cache = null;
    console.log('Capability cache cleared');
  }

  /**
   * Get the current cache state (for debugging)
   * @returns Current cache or null
   */
  getCacheState(): CapabilityCache | null {
    return this.cache;
  }

  /**
   * Set custom TTL for capability cache
   * @param ttlMs - Time to live in milliseconds
   */
  setCacheTTL(ttlMs: number): void {
    if (this.cache) {
      this.cache.ttl = ttlMs;
    }
  }
}

// Export singleton instance
export const capabilityDetector = new CapabilityDetector();
