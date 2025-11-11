/**
 * Enhanced accessibility utilities beyond basic a11y
 * Provides WCAG 2.1 AA compliance helpers
 */

/**
 * Manage ARIA live region announcements with debouncing
 * Prevents too many announcements in quick succession
 */
export class AccessibilityAnnouncer {
  private announceRegion: HTMLDivElement;
  private pendingAnnouncement: string | null = null;
  private announceTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(regionId = 'aria-live-announcer') {
    let region = document.getElementById(regionId);

    if (!region) {
      region = document.createElement('div');
      region.id = regionId;
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      region.className = 'sr-only'; // Hide visually but keep for screen readers
      region.style.cssText =
        'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
      document.body.appendChild(region);
    }

    this.announceRegion = region as HTMLDivElement;
  }

  /**
   * Announce message to screen reader
   * Debounced to avoid announcement spam
   */
  announce(message: string, delay = 100): void {
    this.pendingAnnouncement = message;

    if (this.announceTimeout) {
      clearTimeout(this.announceTimeout);
    }

    this.announceTimeout = setTimeout(() => {
      this.announceRegion.textContent = this.pendingAnnouncement;
      this.announceTimeout = null;
    }, delay);
  }

  /**
   * Announce important message immediately
   */
  announceImmediate(message: string): void {
    if (this.announceTimeout) {
      clearTimeout(this.announceTimeout);
    }

    this.announceRegion.textContent = message;
  }

  /**
   * Clear announcement
   */
  clear(): void {
    if (this.announceTimeout) {
      clearTimeout(this.announceTimeout);
    }

    this.announceRegion.textContent = '';
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.clear();
    this.announceRegion.remove();
  }
}

/**
 * Skip link manager
 * Provides keyboard navigation to main content
 */
export class SkipLinkManager {
  private skipLink: HTMLAnchorElement;

  constructor(targetId = 'main-content') {
    const existingSkipLink = document.querySelector('.skip-to-main');

    if (existingSkipLink) {
      this.skipLink = existingSkipLink as HTMLAnchorElement;
    } else {
      this.skipLink = document.createElement('a');
      this.skipLink.href = `#${targetId}`;
      this.skipLink.textContent = 'Skip to main content';
      this.skipLink.className = 'skip-to-main';
      this.skipLink.style.cssText =
        'position: absolute; left: -10000px; z-index: 999999;';

      // Make visible on focus
      this.skipLink.addEventListener('focus', () => {
        this.skipLink.style.position = 'fixed';
        this.skipLink.style.left = '0';
        this.skipLink.style.top = '0';
        this.skipLink.style.background = '#000';
        this.skipLink.style.color = '#fff';
        this.skipLink.style.padding = '0.5rem';
      });

      this.skipLink.addEventListener('blur', () => {
        this.skipLink.style.position = 'absolute';
        this.skipLink.style.left = '-10000px';
      });

      document.body.insertBefore(this.skipLink, document.body.firstChild);
    }
  }

  /**
   * Update target
   */
  setTarget(targetId: string): void {
    this.skipLink.href = `#${targetId}`;
  }
}

/**
 * Manage focus trap for modals
 * Ensures keyboard navigation stays within modal
 */
export class FocusTrap {
  private element: HTMLElement;
  private previousActiveElement: HTMLElement | null = null;
  private handleKeydown = (e: KeyboardEvent) => this.onKeydown(e);

  constructor(element: HTMLElement) {
    this.element = element;
  }

  /**
   * Activate focus trap
   */
  activate(): void {
    this.previousActiveElement = document.activeElement as HTMLElement;

    // Focus first focusable element
    const focusable = this.getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    this.element.addEventListener('keydown', this.handleKeydown);
  }

  /**
   * Deactivate focus trap
   */
  deactivate(): void {
    this.element.removeEventListener('keydown', this.handleKeydown);

    // Restore focus
    this.previousActiveElement?.focus();
  }

  /**
   * Get all focusable elements within trap
   */
  private getFocusableElements(): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];

    return Array.from(
      this.element.querySelectorAll(focusableSelectors.join(','))
    );
  }

  /**
   * Handle Tab/Shift+Tab navigation
   */
  private onKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Tab') return;

    const focusable = this.getFocusableElements();
    if (focusable.length === 0) return;

    const currentIndex = focusable.indexOf(
      document.activeElement as HTMLElement
    );

    if (e.shiftKey) {
      // Shift+Tab - move to previous
      const previousIndex =
        currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
      focusable[previousIndex].focus();
      e.preventDefault();
    } else {
      // Tab - move to next
      const nextIndex =
        currentIndex >= focusable.length - 1 ? 0 : currentIndex + 1;
      focusable[nextIndex].focus();
      e.preventDefault();
    }
  }
}

/**
 * Heading structure validator
 * Ensures proper heading hierarchy for accessibility
 */
export function validateHeadingStructure(element: Element = document.body): {
  valid: boolean;
  issues: string[];
} {
  const headings = Array.from(
    element.querySelectorAll('h1, h2, h3, h4, h5, h6')
  );

  if (headings.length === 0) {
    return { valid: false, issues: ['No headings found'] };
  }

  const issues: string[] = [];
  let previousLevel = 1;

  // Check for h1
  const h1Count = headings.filter((h) => h.tagName === 'H1').length;
  if (h1Count === 0) {
    issues.push('Missing H1 heading');
  } else if (h1Count > 1) {
    issues.push('Multiple H1 headings found (should be one)');
  }

  // Check for proper hierarchy
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName[1]);

    if (level - previousLevel > 1) {
      issues.push(`Heading hierarchy skip: H${previousLevel} to H${level}`);
    }

    previousLevel = level;
  });

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Color contrast checker
 * Determines if text meets WCAG AA standards
 */
export function checkContrast(
  fgColor: string,
  bgColor: string
): {
  ratio: number;
  level: 'AAA' | 'AA' | 'Fail';
} {
  const fgRGB = parseColor(fgColor);
  const bgRGB = parseColor(bgColor);

  if (!fgRGB || !bgRGB) {
    return { ratio: 0, level: 'Fail' };
  }

  const fgLum = getRelativeLuminance(fgRGB);
  const bgLum = getRelativeLuminance(bgRGB);

  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);

  const ratio = (lighter + 0.05) / (darker + 0.05);

  let level: 'AAA' | 'AA' | 'Fail';
  if (ratio >= 7) {
    level = 'AAA';
  } else if (ratio >= 4.5) {
    level = 'AA';
  } else {
    level = 'Fail';
  }

  return { ratio, level };
}

/**
 * Parse CSS color to RGB
 */
function parseColor(color: string): { r: number; g: number; b: number } | null {
  const div = document.createElement('div');
  div.style.color = color;
  document.body.appendChild(div);

  const computed = window.getComputedStyle(div).color;
  document.body.removeChild(div);

  const match = computed.match(/\d+/g);
  if (!match || match.length < 3) return null;

  return {
    r: parseInt(match[0]),
    g: parseInt(match[1]),
    b: parseInt(match[2]),
  };
}

/**
 * Get relative luminance for WCAG contrast calculation
 */
function getRelativeLuminance(rgb: {
  r: number;
  g: number;
  b: number;
}): number {
  const { r, g, b } = rgb;

  const [rs, gs, bs] = [r, g, b].map((val) => {
    const sRGB = val / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Generate accessible ID
 * Ensures unique, descriptive IDs for accessibility
 */
export function generateAccessibleId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
