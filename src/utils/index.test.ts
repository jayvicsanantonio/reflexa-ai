/**
 * Unit tests for utility functions
 * Tests reflection data transformations, streak calculation, and formatting
 */

import { describe, it, expect } from 'vitest';
import {
  generateUUID,
  formatDate,
  formatISODate,
  estimateTokens,
  truncateToTokens,
  countWords,
  extractDomain,
  sanitizeText,
  calculateStreak,
} from './index';

describe('Utility Functions', () => {
  describe('generateUUID', () => {
    it('should generate a valid UUID v4', () => {
      const uuid = generateUUID();
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('formatDate', () => {
    it('should format timestamp to readable date', () => {
      const timestamp = new Date('2024-01-15T12:00:00Z').getTime();
      const formatted = formatDate(timestamp);
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('2024');
      // Date may vary by timezone, so just check it contains a day number
      expect(formatted).toMatch(/\d{1,2}/);
    });
  });

  describe('formatISODate', () => {
    it('should format timestamp to ISO date string', () => {
      const timestamp = new Date('2024-01-15T12:00:00Z').getTime();
      const formatted = formatISODate(timestamp);
      expect(formatted).toBe('2024-01-15');
    });
  });

  describe('estimateTokens', () => {
    it('should estimate tokens for text', () => {
      const text = 'This is a test sentence with ten words in it.';
      const tokens = estimateTokens(text);
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(20); // Should be around 13-14 tokens
    });

    it('should return minimal tokens for empty text', () => {
      const tokens = estimateTokens('');
      expect(tokens).toBeLessThanOrEqual(2); // Empty string may result in 1-2 tokens due to rounding
    });
  });

  describe('truncateToTokens', () => {
    it('should truncate text exceeding token limit', () => {
      const longText = 'word '.repeat(1000);
      const truncated = truncateToTokens(longText, 100);
      expect(truncated.length).toBeLessThan(longText.length);
      expect(truncated).toContain('...');
    });

    it('should not truncate text within token limit', () => {
      const shortText = 'This is a short text.';
      const truncated = truncateToTokens(shortText, 100);
      expect(truncated).toBe(shortText);
    });
  });

  describe('countWords', () => {
    it('should count words correctly', () => {
      const text = 'This is a test sentence.';
      const count = countWords(text);
      expect(count).toBe(5);
    });

    it('should handle multiple spaces', () => {
      const text = 'This  has   multiple    spaces.';
      const count = countWords(text);
      expect(count).toBe(4);
    });

    it('should return 0 for empty text', () => {
      const count = countWords('');
      expect(count).toBe(0);
    });
  });

  describe('extractDomain', () => {
    it('should extract domain from URL', () => {
      const url = 'https://www.example.com/path/to/page';
      const domain = extractDomain(url);
      expect(domain).toBe('www.example.com');
    });

    it('should handle URLs without www', () => {
      const url = 'https://example.com/page';
      const domain = extractDomain(url);
      expect(domain).toBe('example.com');
    });

    it('should return empty string for invalid URL', () => {
      const domain = extractDomain('not a url');
      expect(domain).toBe('');
    });
  });

  describe('sanitizeText', () => {
    it('should remove extra whitespace', () => {
      const text = 'This  has   extra    spaces.';
      const sanitized = sanitizeText(text);
      expect(sanitized).toBe('This has extra spaces.');
    });

    it('should normalize line breaks', () => {
      const text = 'Line 1\n\n\nLine 2';
      const sanitized = sanitizeText(text);
      // sanitizeText replaces all whitespace including newlines with single space
      expect(sanitized).toBe('Line 1 Line 2');
    });

    it('should trim leading and trailing whitespace', () => {
      const text = '  Text with spaces  ';
      const sanitized = sanitizeText(text);
      expect(sanitized).toBe('Text with spaces');
    });
  });

  describe('calculateStreak', () => {
    it('should return 0 for empty array', () => {
      const streak = calculateStreak([]);
      expect(streak).toBe(0);
    });

    it('should calculate streak for consecutive days', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const dates = [
        formatISODate(today.getTime()),
        formatISODate(yesterday.getTime()),
        formatISODate(twoDaysAgo.getTime()),
      ];

      const streak = calculateStreak(dates);
      expect(streak).toBe(3);
    });

    it('should break streak for non-consecutive days', () => {
      const today = new Date();
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const dates = [
        formatISODate(today.getTime()),
        formatISODate(threeDaysAgo.getTime()),
      ];

      const streak = calculateStreak(dates);
      expect(streak).toBe(1); // Only today counts
    });

    it('should return 0 if most recent reflection is too old', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const dates = [formatISODate(threeDaysAgo.getTime())];

      const streak = calculateStreak(dates);
      expect(streak).toBe(0);
    });

    it('should handle multiple reflections on same day', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const dates = [
        formatISODate(today.getTime()),
        formatISODate(today.getTime()), // Duplicate
        formatISODate(yesterday.getTime()),
      ];

      const streak = calculateStreak(dates);
      expect(streak).toBe(2); // Should count as 2 days, not 3
    });

    it('should accept yesterday as valid for streak', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const dates = [
        formatISODate(yesterday.getTime()),
        formatISODate(twoDaysAgo.getTime()),
      ];

      const streak = calculateStreak(dates);
      expect(streak).toBe(2);
    });
  });
});
