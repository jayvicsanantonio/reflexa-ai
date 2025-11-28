/**
 * Bullets Summary Strategy
 * Follows Open/Closed Principle (OCP) - new format without modifying existing code
 */

import type {
  ISummaryStrategy,
  ISessionPool,
  SummarizerLanguageOptions,
} from '../interfaces';
import type { SummaryFormat } from '../../../../../types';

export class BulletsStrategy implements ISummaryStrategy {
  readonly format: SummaryFormat = 'bullets';

  async summarize(
    text: string,
    sessionPool: ISessionPool,
    outputLanguage?: string,
    languageOptions?: SummarizerLanguageOptions
  ): Promise<string[]> {
    const session = await sessionPool.getOrCreate({
      type: 'key-points',
      format: 'markdown',
      length: 'short',
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
    return this.parseBullets(result);
  }

  private parseBullets(result: string): string[] {
    const bullets = result
      .split('\n')
      .filter(
        (line: string) =>
          line.trim().startsWith('-') || line.trim().startsWith('*')
      )
      .map((line: string) => line.replace(/^[-*]\s*/, '').trim())
      .filter((line: string) => line.length > 0)
      .slice(0, 3);

    // Fallback if parsing fails
    if (bullets.length < 3) {
      return result
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .slice(0, 3);
    }

    return bullets;
  }
}
