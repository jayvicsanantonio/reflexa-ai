/**
 * Accessibility utilities for Reflexa AI
 * Provides helpers for keyboard navigation, focus management, and ARIA support
 */

import { devWarn } from './logger';

/**
 * Detect if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Trap focus within a container element
 * Useful for modals and overlays
 *
 * OPTIMIZATION: Caches focusable elements and uses MutationObserver
 * to detect DOM changes, improving performance for complex modals
 */
export const trapFocus = (
  container: HTMLElement,
  onEscape?: () => void
): (() => void) => {
  const focusableSelector =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  // Cache focusable elements for performance
  let cachedFocusableElements: HTMLElement[] = [];

  const updateFocusableElements = (): void => {
    cachedFocusableElements = Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelector)
    );
  };

  // Initial cache
  updateFocusableElements();

  // Set up MutationObserver to detect DOM changes
  const observer = new MutationObserver(() => {
    updateFocusableElements();
  });

  // Observe changes to child elements and attributes
  observer.observe(container, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['disabled', 'tabindex'],
  });

  const handleKeyDown = (e: KeyboardEvent): void => {
    // Handle Escape key
    if (e.key === 'Escape' && onEscape) {
      e.preventDefault();
      onEscape();
      return;
    }

    // Handle Tab key for focus trap
    if (e.key === 'Tab') {
      // Use cached elements instead of re-querying
      if (cachedFocusableElements.length === 0) return;

      const firstElement = cachedFocusableElements[0];
      const lastElement =
        cachedFocusableElements[cachedFocusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  // Add event listener
  container.addEventListener('keydown', handleKeyDown);

  // Focus first element
  if (cachedFocusableElements.length > 0) {
    cachedFocusableElements[0].focus();
  }

  // Return cleanup function
  return (): void => {
    container.removeEventListener('keydown', handleKeyDown);
    observer.disconnect();
  };
};

// Track active announcements for proper cleanup
const activeAnnouncements = new Set<HTMLElement>();

/**
 * Announce message to screen readers
 *
 * IMPROVEMENT: Returns cleanup function and tracks announcements
 * to prevent memory leaks and handle component unmounting gracefully
 *
 * @param message Message to announce
 * @param priority Announcement priority ('polite' or 'assertive')
 * @returns Cleanup function to remove announcement immediately
 */
export const announceToScreenReader = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): (() => void) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);
  activeAnnouncements.add(announcement);

  // Auto-remove after announcement
  const timeoutId = setTimeout(() => {
    if (announcement.parentNode) {
      document.body.removeChild(announcement);
      activeAnnouncements.delete(announcement);
    }
  }, 1000);

  // Return cleanup function for immediate removal
  return (): void => {
    clearTimeout(timeoutId);
    if (announcement.parentNode) {
      document.body.removeChild(announcement);
      activeAnnouncements.delete(announcement);
    }
  };
};

/**
 * Clean up all active screen reader announcements
 * Useful for component unmounting or page navigation
 */
export const cleanupAllAnnouncements = (): void => {
  activeAnnouncements.forEach((announcement) => {
    if (announcement.parentNode) {
      document.body.removeChild(announcement);
    }
  });
  activeAnnouncements.clear();
};

/**
 * Parse color string to RGB array
 * Supports hex, rgb(), rgba(), hsl(), and hsla() formats
 *
 * ENHANCEMENT: Extended to support multiple color formats beyond hex
 *
 * @param color Color string in various formats
 * @returns RGB array [r, g, b] with values 0-255
 */
const parseColor = (color: string): number[] => {
  const trimmed = color.trim();

  // Hex format: #RGB or #RRGGBB
  if (trimmed.startsWith('#')) {
    const hex = trimmed.substring(1);

    // Short hex (#RGB)
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
      ];
    }

    // Full hex (#RRGGBB)
    if (hex.length === 6) {
      return [
        parseInt(hex.substring(0, 2), 16),
        parseInt(hex.substring(2, 4), 16),
        parseInt(hex.substring(4, 6), 16),
      ];
    }
  }

  // RGB/RGBA format: rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(trimmed);
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1], 10),
      parseInt(rgbMatch[2], 10),
      parseInt(rgbMatch[3], 10),
    ];
  }

  // HSL/HSLA format: hsl(h, s%, l%) or hsla(h, s%, l%, a)
  const hslMatch = /hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%/.exec(trimmed);
  if (hslMatch) {
    const h = parseInt(hslMatch[1], 10) / 360;
    const s = parseInt(hslMatch[2], 10) / 100;
    const l = parseInt(hslMatch[3], 10) / 100;

    return hslToRgb(h, s, l);
  }

  // Fallback to black if format not recognized
  devWarn(`Unrecognized color format: ${color}`);
  return [0, 0, 0];
};

/**
 * Convert HSL to RGB
 * @param h Hue (0-1)
 * @param s Saturation (0-1)
 * @param l Lightness (0-1)
 * @returns RGB array [r, g, b] with values 0-255
 */
const hslToRgb = (h: number, s: number, l: number): number[] => {
  let r: number, g: number, b: number;

  if (s === 0) {
    // Achromatic (gray)
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

/**
 * Calculate relative luminance of an RGB color
 * @param rgb RGB array [r, g, b] with values 0-255
 * @returns Relative luminance (0-1)
 */
const getLuminance = (rgb: number[]): number => {
  const [r, g, b] = rgb.map((val) => {
    const sRGB = val / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Check if color contrast meets WCAG AA standards (4.5:1)
 *
 * ENHANCEMENT: Now supports hex, rgb(), rgba(), hsl(), and hsla() formats
 *
 * @param foreground Foreground color (text)
 * @param background Background color
 * @returns True if contrast ratio meets WCAG AA (4.5:1), false otherwise
 */
export const meetsContrastRequirement = (
  foreground: string,
  background: string
): boolean => {
  const fgRgb = parseColor(foreground);
  const bgRgb = parseColor(background);

  const fgLuminance = getLuminance(fgRgb);
  const bgLuminance = getLuminance(bgRgb);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  const contrastRatio = (lighter + 0.05) / (darker + 0.05);

  return contrastRatio >= 4.5;
};

/**
 * Calculate the contrast ratio between two colors
 * Useful for debugging and displaying actual ratio values
 *
 * @param foreground Foreground color (text)
 * @param background Background color
 * @returns Contrast ratio (1-21)
 */
export const getContrastRatio = (
  foreground: string,
  background: string
): number => {
  const fgRgb = parseColor(foreground);
  const bgRgb = parseColor(background);

  const fgLuminance = getLuminance(fgRgb);
  const bgLuminance = getLuminance(bgRgb);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Create a keyboard event handler for button-like elements
 */
export const createKeyboardHandler = (
  onClick: () => void
): ((e: React.KeyboardEvent) => void) => {
  return (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };
};

/**
 * Get accessible label for time duration
 */
export const getAccessibleDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds} seconds`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }
  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} and ${remainingSeconds} ${remainingSeconds === 1 ? 'second' : 'seconds'}`;
};
