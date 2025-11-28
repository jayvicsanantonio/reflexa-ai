/**
 * Paragraph Summary Strategy
 * Follows Open/Closed Principle (OCP) - new format without modifying existing code
 */

import type {
  ISummaryStrategy,
  ISessionPool,
  SummarizerLanguageOptions,
} from '../interfaces';
import type { SummaryFormat } from '../../../../../types';

export class ParagraphStrategy implements ISummaryStrategy {
  readonly format: SummaryFormat = 'paragraph';

  async summarize(
    text: string,
    sessionPool: ISessionPool,
    outputLanguage?: string,
    languageOptions?: SummarizerLanguageOptions
  ): Promise<string[]> {
    const session = await sessionPool.getOrCreate({
      type: 'tldr',
      format: 'plain-text',
      length: 'medium',
      outputLanguage,
      languageOptions,
    });

    if (!session) {
      throw new Error('Failed to create summarizer session');
    }

    const result = await session.summarize(text);
    if (!result) {
      throw new Error('Summarizer returned empty result');
    }
    return [result.trim()];
  }
}
