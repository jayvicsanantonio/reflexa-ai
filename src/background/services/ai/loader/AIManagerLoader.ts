/**
 * AIManagerLoader - Lazy loading for AI managers
 *
 * Implements dynamic import for each manager type with instance caching
 * and concurrent request deduplication to prevent duplicate loading.
 *
 * Requirements: 6.1, 6.2, 6.3
 */

import type { IWriterManager } from '../writer/interfaces';
import type { IRewriterManager } from '../rewriter/interfaces';
import type { IProofreaderManager } from '../proofreader/interfaces';
import type { ITranslatorManager } from '../translator/interfaces';
import type { ISummarizerManager } from '../summarizer/interfaces';
import type { IAIManagerLoader, ManagerType, AIManager } from './interfaces';

/**
 * AIManagerLoader provides lazy loading capabilities for AI managers.
 *
 * Features:
 * - Dynamic import for each manager type (Requirement 6.1)
 * - Instance caching for subsequent requests (Requirement 6.2)
 * - Concurrent request deduplication (Requirement 6.3)
 */
export class AIManagerLoader implements IAIManagerLoader {
  /** Cached manager instances */
  private cache = new Map<ManagerType, AIManager>();

  /** Pending load promises for concurrent request deduplication */
  private pendingLoads = new Map<ManagerType, Promise<AIManager>>();

  /**
   * Gets the WriterManager instance, loading it if necessary
   */
  async getWriter(): Promise<IWriterManager> {
    return this.getManager('writer') as Promise<IWriterManager>;
  }

  /**
   * Gets the RewriterManager instance, loading it if necessary
   */
  async getRewriter(): Promise<IRewriterManager> {
    return this.getManager('rewriter') as Promise<IRewriterManager>;
  }

  /**
   * Gets the ProofreaderManager instance, loading it if necessary
   */
  async getProofreader(): Promise<IProofreaderManager> {
    return this.getManager('proofreader') as Promise<IProofreaderManager>;
  }

  /**
   * Gets the TranslatorManager instance, loading it if necessary
   */
  async getTranslator(): Promise<ITranslatorManager> {
    return this.getManager('translator') as Promise<ITranslatorManager>;
  }

  /**
   * Gets the SummarizerManager instance, loading it if necessary
   */
  async getSummarizer(): Promise<ISummarizerManager> {
    return this.getManager('summarizer') as Promise<ISummarizerManager>;
  }

  /**
   * Preloads specified managers for optional eager loading
   * @param managers Array of manager types to preload
   */
  async preload(managers: ManagerType[]): Promise<void> {
    await Promise.all(managers.map((type) => this.getManager(type)));
  }

  /**
   * Checks if a manager is already loaded
   * @param type The manager type to check
   */
  isLoaded(type: ManagerType): boolean {
    return this.cache.has(type);
  }

  /**
   * Clears all cached manager instances
   */
  clearCache(): void {
    this.cache.clear();
    this.pendingLoads.clear();
  }

  /**
   * Gets a manager by type, handling caching and concurrent request deduplication
   * @param type The manager type to get
   */
  private async getManager(type: ManagerType): Promise<AIManager> {
    // Return cached instance if available (Requirement 6.2)
    const cached = this.cache.get(type);
    if (cached) {
      return cached;
    }

    // Return pending promise if load is in progress (Requirement 6.3)
    const pending = this.pendingLoads.get(type);
    if (pending) {
      return pending;
    }

    // Start new load and store promise for deduplication
    const loadPromise = this.loadManager(type);
    this.pendingLoads.set(type, loadPromise);

    try {
      const manager = await loadPromise;
      // Cache the loaded instance
      this.cache.set(type, manager);
      return manager;
    } finally {
      // Clean up pending promise
      this.pendingLoads.delete(type);
    }
  }

  /**
   * Dynamically imports and instantiates a manager (Requirement 6.1)
   * @param type The manager type to load
   */
  private async loadManager(type: ManagerType): Promise<AIManager> {
    switch (type) {
      case 'writer': {
        const { WriterManager } = await import('../writer');
        return new WriterManager();
      }
      case 'rewriter': {
        const { RewriterManager } = await import('../rewriter');
        return new RewriterManager();
      }
      case 'proofreader': {
        const { ProofreaderManager } = await import('../proofreader');
        return new ProofreaderManager();
      }
      case 'translator': {
        const { TranslatorManager } = await import('../translator');
        return new TranslatorManager();
      }
      case 'summarizer': {
        const { SummarizerManager } = await import('../summarizer');
        return new SummarizerManager();
      }
      default: {
        // TypeScript exhaustiveness check
        const _exhaustive: never = type;
        throw new Error(`Unknown manager type: ${String(_exhaustive)}`);
      }
    }
  }
}
