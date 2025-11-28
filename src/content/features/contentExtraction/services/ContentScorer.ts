/**
 * Content Scorer - Calculates content density scores for elements
 * Follows Single Responsibility Principle (SRP) - only handles scoring
 */

import type { IContentScorer, ContentExtractionConfig } from '../interfaces';
import { devLog } from '../../../../utils/logger';

export class ContentScorer implements IContentScorer {
  constructor(private readonly config: ContentExtractionConfig) {}

  /**
   * Calculate content score for an element based on various heuristics
   */
  calculateScore(element: HTMLElement): number {
    if (this.shouldExclude(element)) {
      return 0;
    }

    let score = 0;
    const text = element.textContent || '';
    const textLength = text.trim().length;

    if (textLength < this.config.minTextLength) {
      return 0;
    }

    // Base score from text length
    score += textLength;

    // Bonus for paragraph tags
    const paragraphs = element.querySelectorAll('p');
    score += paragraphs.length * 50;

    // Bonus for semantic HTML
    score += this.getSemanticBonus(element);

    // Penalty for high link density (suggests navigation)
    score *= this.getLinkDensityMultiplier(element, textLength);

    // Penalty for excluded child elements
    const excludedChildren = element.querySelectorAll(
      this.config.excludeSelectors.join(',')
    );
    score -= excludedChildren.length * 30;

    return Math.max(0, score);
  }

  /**
   * Find element with highest content density
   */
  findHighestScoringElement(elements: HTMLElement[]): HTMLElement | null {
    let bestElement: HTMLElement | null = null;
    let highestScore = 0;

    const maxElements = Math.min(
      elements.length,
      this.config.maxElementsToAnalyze
    );

    for (let i = 0; i < maxElements; i++) {
      const element = elements[i];
      const score = this.calculateScore(element);

      if (score > highestScore) {
        highestScore = score;
        bestElement = element;

        // Early exit for high scores
        if (score > this.config.highScoreThreshold) {
          devLog(
            `Found high-scoring element early (score: ${score}), stopping search`
          );
          break;
        }
      }
    }

    return highestScore > 0 ? bestElement : null;
  }

  /**
   * Check if element should be excluded from content extraction
   */
  shouldExclude(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    const excludedTags = [
      'nav',
      'header',
      'footer',
      'aside',
      'script',
      'style',
      'noscript',
    ];

    if (excludedTags.includes(tagName)) {
      return true;
    }

    const role = element.getAttribute('role');
    const excludedRoles = [
      'navigation',
      'banner',
      'contentinfo',
      'complementary',
    ];

    if (role && excludedRoles.includes(role)) {
      return true;
    }

    const className = element.className?.toLowerCase() || '';
    const id = element.id?.toLowerCase() || '';

    for (const pattern of this.config.excludePatterns) {
      if (className.includes(pattern) || id.includes(pattern)) {
        return true;
      }
    }

    return false;
  }

  private getSemanticBonus(element: HTMLElement): number {
    let bonus = 0;

    if (element.tagName === 'ARTICLE') bonus += 200;
    if (element.tagName === 'MAIN') bonus += 150;
    if (element.getAttribute('role') === 'article') bonus += 200;
    if (element.getAttribute('role') === 'main') bonus += 150;

    return bonus;
  }

  private getLinkDensityMultiplier(
    element: HTMLElement,
    textLength: number
  ): number {
    const links = element.querySelectorAll('a');
    const linkText = Array.from(links).reduce((sum, link) => {
      return sum + (link.textContent?.length || 0);
    }, 0);

    const linkDensity = textLength > 0 ? linkText / textLength : 0;

    return linkDensity > 0.5 ? 0.3 : 1;
  }
}
