/**
 * Content Truncator - Handles token limit checking and truncation
 * Follows Single Responsibility Principle (SRP) - only handles truncation
 */

import type { IContentTruncator } from '../interfaces';
import type { ExtractedContent } from '../../../../types';
import { estimateTokens, countWords } from '../../../../utils';
import { CONTENT_LIMITS } from '../../../../constants';

export class ContentTruncator implements IContentTruncator {
  constructor(
    private readonly maxTokens: number = CONTENT_LIMITS.MAX_TOKENS,
    private readonly truncateTokens: number = CONTENT_LIMITS.TRUNCATE_TOKENS,
    private readonly wordsPerToken: number = CONTENT_LIMITS.WORDS_PER_TOKEN
  ) {}

  /**
   * Check if extracted content exceeds token limit
   */
  checkTokenLimit(content: ExtractedContent): {
    exceeds: boolean;
    tokens: number;
  } {
    const tokens = estimateTokens(content.text);
    const exceeds = tokens > this.maxTokens;
    return { exceeds, tokens };
  }

  /**
   * Truncate content if it exceeds token limit
   */
  truncate(content: ExtractedContent): ExtractedContent {
    const { exceeds } = this.checkTokenLimit(content);

    if (!exceeds) {
      return content;
    }

    const words = content.text.trim().split(/\s+/);
    const maxWords = Math.floor(this.truncateTokens * this.wordsPerToken);
    const truncatedText = words.slice(0, maxWords).join(' ') + '...';

    return {
      ...content,
      text: truncatedText,
      wordCount: countWords(truncatedText),
    };
  }
}
