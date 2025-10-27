/**
 * Utility functions for Reflexa AI Chrome Extension
 */

import { CONTENT_LIMITS } from '../constants';

/**
 * Generate a UUID v4
 * @returns A UUID v4 string
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Format a Unix timestamp to a human-readable date string
 * @param timestamp Unix timestamp in milliseconds
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format a Unix timestamp to a relative time string
 * @param timestamp Unix timestamp in milliseconds
 * @returns Relative time string (e.g., "2 days ago", "just now")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

/**
 * Format a date to ISO date string (YYYY-MM-DD)
 * @param timestamp Unix timestamp in milliseconds
 * @returns ISO date string
 */
export function formatISODate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toISOString().split('T')[0];
}

/**
 * Estimate the number of tokens in a text string
 * Uses a simple word-based estimation: 1 token ≈ 0.75 words
 * @param text The text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / CONTENT_LIMITS.WORDS_PER_TOKEN);
}

/**
 * Truncate text to a maximum number of tokens
 * @param text The text to truncate
 * @param maxTokens Maximum number of tokens
 * @returns Truncated text
 */
export function truncateToTokens(text: string, maxTokens: number): string {
  const tokens = estimateTokens(text);
  if (tokens <= maxTokens) return text;

  const words = text.trim().split(/\s+/);
  const maxWords = Math.floor(maxTokens * CONTENT_LIMITS.WORDS_PER_TOKEN);
  return words.slice(0, maxWords).join(' ') + '...';
}

/**
 * Count words in a text string
 * @param text The text to count words in
 * @returns Word count
 */
export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Extract domain from a URL
 * @param url Full URL string
 * @returns Domain name (e.g., "example.com")
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

/**
 * Sanitize text by removing extra whitespace and normalizing line breaks
 * @param text The text to sanitize
 * @returns Sanitized text
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n') // Replace multiple line breaks with single
    .trim();
}

/**
 * Debounce a function call
 * @param func The function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if user prefers reduced motion
 * @returns True if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Calculate streak from reflection dates
 * @param reflectionDates Array of ISO date strings (YYYY-MM-DD)
 * @returns Current streak count
 */
export function calculateStreak(reflectionDates: string[]): number {
  if (reflectionDates.length === 0) return 0;

  // Sort dates in descending order (most recent first)
  const sortedDates = [...new Set(reflectionDates)].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const today = formatISODate(Date.now());
  const yesterday = formatISODate(Date.now() - 24 * 60 * 60 * 1000);

  // Check if most recent reflection is today or yesterday
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0;
  }

  let streak = 1;
  let currentDate = new Date(sortedDates[0]);

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i]);
    const dayDiff = Math.floor(
      (currentDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (dayDiff === 1) {
      streak++;
      currentDate = prevDate;
    } else if (dayDiff > 1) {
      break;
    }
    // If dayDiff === 0, it's the same day, continue to next
  }

  return streak;
}

/**
 * Validate settings object
 * @param settings Settings object to validate
 * @returns True if valid, false otherwise
 */
export function validateSettings(settings: unknown): boolean {
  if (typeof settings !== 'object' || settings === null) return false;

  const {
    dwellThreshold,
    enableSound,
    reduceMotion,
    proofreadEnabled,
    privacyMode,
  } = settings as Record<string, unknown>;

  if (
    typeof dwellThreshold !== 'number' ||
    dwellThreshold < 30 ||
    dwellThreshold > 300
  ) {
    return false;
  }

  if (typeof enableSound !== 'boolean') return false;
  if (typeof reduceMotion !== 'boolean') return false;
  if (typeof proofreadEnabled !== 'boolean') return false;
  if (privacyMode !== 'local' && privacyMode !== 'sync') return false;

  return true;
}

/**
 * Deep clone an object
 * @param obj Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

/**
 * Sleep for a specified duration
 * @param ms Duration in milliseconds
 * @returns Promise that resolves after the duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
