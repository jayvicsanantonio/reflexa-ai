/**
 * AIManagerLoader Interfaces
 * Defines types for lazy loading AI managers
 */

import type { IWriterManager } from '../writer/interfaces';
import type { IRewriterManager } from '../rewriter/interfaces';
import type { IProofreaderManager } from '../proofreader/interfaces';
import type { ITranslatorManager } from '../translator/interfaces';
import type { ISummarizerManager } from '../summarizer/interfaces';

/**
 * Supported AI manager types for lazy loading
 */
export type ManagerType =
  | 'writer'
  | 'rewriter'
  | 'proofreader'
  | 'translator'
  | 'summarizer';

/**
 * Union type of all AI manager interfaces
 */
export type AIManager =
  | IWriterManager
  | IRewriterManager
  | IProofreaderManager
  | ITranslatorManager
  | ISummarizerManager;

/**
 * Interface for the AIManagerLoader
 * Provides lazy loading capabilities for AI managers
 */
export interface IAIManagerLoader {
  /**
   * Gets the WriterManager instance, loading it if necessary
   */
  getWriter(): Promise<IWriterManager>;

  /**
   * Gets the RewriterManager instance, loading it if necessary
   */
  getRewriter(): Promise<IRewriterManager>;

  /**
   * Gets the ProofreaderManager instance, loading it if necessary
   */
  getProofreader(): Promise<IProofreaderManager>;

  /**
   * Gets the TranslatorManager instance, loading it if necessary
   */
  getTranslator(): Promise<ITranslatorManager>;

  /**
   * Gets the SummarizerManager instance, loading it if necessary
   */
  getSummarizer(): Promise<ISummarizerManager>;

  /**
   * Preloads specified managers for optional eager loading
   * @param managers Array of manager types to preload
   */
  preload(managers: ManagerType[]): Promise<void>;

  /**
   * Checks if a manager is already loaded
   * @param type The manager type to check
   */
  isLoaded(type: ManagerType): boolean;

  /**
   * Clears all cached manager instances
   */
  clearCache(): void;
}
