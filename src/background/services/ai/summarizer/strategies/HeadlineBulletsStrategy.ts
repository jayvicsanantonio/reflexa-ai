/**
 * Headline + Bullets Summary Strategy
 * Follows Open/Closed Principle (OCP) - new format without modifying existing code
 */

import type {
  ISummaryStrategy,
  ISessionPool,
  SummarizerLanguageOptions,
} from '../interfaces';
import type { SummaryFormat } from '../../../../../types';

export class HeadlineBulletsStrategy implements ISummaryStrategy {
  readonly format: SummaryFormat = 'headline-bullets';

  async summarize(
    text: string,
    sessionPool: ISessionPool,
    outputLanguage?: string,
    languageOptions?: SummarizerLanguageOptions
  ): Promise<string[]> {
    // Create both sessions
    const [headlineSession, bulletsSession] = await Promise.all([
      sessionPool.getOrCreate({
        type: 'headline',
        format: 'plain-text',
        length: 'short',
        outputLanguage,
        languageOptions,
      }),
      sessionPool.getOrCreate({
        type: 'key-points',
        format: 'markdown',
        length: 'short',
        outputLanguage,
        languageOptions,
      }),
    ]);

    if (!headlineSession || !bulletsSession) {
      throw new Error('Failed to create summarizer sessions');
    }

    // Generate headline and bullets in parallel
    const [headline, bulletsResult] = await Promise.all([
      headlineSession.summarize(text),
      bulletsSession.summarize(text),
    ]);

    const bullets = this.parseBullets(bulletsResult);
    return [headline.trim(), ...bullets];
  }

  private parseBullets(result: string): string[] {
    return result
      .split('\n')
      .filter(
        (line: string) =>
          line.trim().startsWith('-') || line.trim().startsWith('*')
      )
      .map((line: string) => line.replace(/^[-*]\s*/, '').trim())
      .filter((line: string) => line.length > 0)
      .slice(0, 3);
  }
}
