/**
 * StorageManager - Handles all Chrome storage operations for reflections and settings
 */

import type { Reflection, StreakData } from '../types';
import { StorageFullError } from '../types/errors';
import { STORAGE_KEYS, TIMING } from '../constants';
import {
  generateUUID,
  formatDate,
  formatISODate,
  calculateStreak,
} from '../utils';

// Storage warning threshold (90%)
const STORAGE_WARNING_THRESHOLD = 0.9;

export class StorageManager {
  // Cache for reflections to reduce storage reads
  private cache: Reflection[] | null = null;
  private cacheTimestamp = 0;
  private migrationCompleted = false;

  /**
   * Migrate existing reflections to include AI metadata fields
   * This ensures backward compatibility with reflections created before AI integration
   */
  private async migrateReflections(): Promise<void> {
    if (this.migrationCompleted) {
      return;
    }

    const result = await chrome.storage.local.get(STORAGE_KEYS.REFLECTIONS);
    const reflections = (result[STORAGE_KEYS.REFLECTIONS] ??
      []) as Reflection[];

    let needsMigration = false;

    // Check if any reflection needs migration
    const migratedReflections = reflections.map((reflection) => {
      // Check if reflection already has AI metadata
      if (!reflection.aiMetadata) {
        needsMigration = true;
        return {
          ...reflection,
          // Add default AI metadata for existing reflections
          summaryFormat: reflection.summaryFormat ?? 'bullets',
          aiMetadata: {
            summarizerUsed: false,
            writerUsed: false,
            rewriterUsed: false,
            proofreaderUsed: false,
            translatorUsed: false,
            promptFallback: false,
            processingTime: 0,
          },
        };
      }
      return reflection;
    });

    // Only write to storage if migration was needed
    if (needsMigration) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.REFLECTIONS]: migratedReflections,
      });
      // Invalidate cache to force reload with migrated data
      this.invalidateCache();
    }

    this.migrationCompleted = true;
  }

  /**
   * Save a new reflection to storage
   * @param reflection Reflection object to save
   * @throws StorageFullError if storage quota exceeded
   */
  async saveReflection(reflection: Reflection): Promise<void> {
    try {
      const reflections = await this.getReflections();

      // Ensure reflection has an ID
      if (!reflection.id) {
        reflection.id = generateUUID();
      }

      // Ensure AI metadata exists with defaults if not provided
      reflection.aiMetadata ??= {
        summarizerUsed: false,
        writerUsed: false,
        rewriterUsed: false,
        proofreaderUsed: false,
        translatorUsed: false,
        promptFallback: false,
        processingTime: 0,
      };

      // Set default summary format if not provided
      reflection.summaryFormat ??= 'bullets';

      // Add to reflections array
      reflections.push(reflection);

      // Update streak data
      const streakData = await this.updateStreak(reflection.createdAt);

      // Save to storage
      await chrome.storage.local.set({
        [STORAGE_KEYS.REFLECTIONS]: reflections,
        [STORAGE_KEYS.STREAK]: streakData,
      });

      // Invalidate cache after save
      this.invalidateCache();
    } catch (error) {
      if (this.isQuotaExceededError(error)) {
        const { bytesUsed, quota } = await this.checkStorageQuota();
        throw new StorageFullError(undefined, bytesUsed, quota);
      }
      throw error;
    }
  }

  /**
   * Get all reflections sorted by date (most recent first)
   * Uses caching to reduce storage reads
   * @param limit Optional limit on number of reflections to return
   * @returns Array of reflections
   */
  async getReflections(limit?: number): Promise<Reflection[]> {
    // Run migration on first access
    await this.migrateReflections();

    // Check cache first
    const now = Date.now();
    if (this.cache && now - this.cacheTimestamp < TIMING.CACHE_TTL) {
      const sorted = this.cache.sort((a, b) => b.createdAt - a.createdAt);
      return limit ? sorted.slice(0, limit) : sorted;
    }

    // Cache miss or expired, fetch from storage
    const result = await chrome.storage.local.get(STORAGE_KEYS.REFLECTIONS);
    const reflections = (result[STORAGE_KEYS.REFLECTIONS] ??
      []) as Reflection[];

    // Update cache
    this.cache = reflections;
    this.cacheTimestamp = now;

    // Sort by createdAt descending (most recent first)
    const sorted = reflections.sort((a, b) => b.createdAt - a.createdAt);

    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * Get a single reflection by ID
   * @param id Reflection ID
   * @returns Reflection object or null if not found
   */
  async getReflectionById(id: string): Promise<Reflection | null> {
    const reflections = await this.getReflections();
    return reflections.find((r) => r.id === id) ?? null;
  }

  /**
   * Delete a reflection by ID
   * @param id Reflection ID to delete
   */
  async deleteReflection(id: string): Promise<void> {
    const reflections = await this.getReflections();
    const filtered = reflections.filter((r) => r.id !== id);

    await chrome.storage.local.set({
      [STORAGE_KEYS.REFLECTIONS]: filtered,
    });

    // Invalidate cache after delete
    this.invalidateCache();

    // Recalculate streak after deletion
    if (filtered.length > 0) {
      const dates = filtered.map((r) => formatISODate(r.createdAt));
      const streak = calculateStreak(dates);
      const lastReflectionDate = dates[0];

      await chrome.storage.local.set({
        [STORAGE_KEYS.STREAK]: {
          current: streak,
          lastReflectionDate,
        },
      });
    } else {
      // No reflections left, reset streak
      await chrome.storage.local.set({
        [STORAGE_KEYS.STREAK]: {
          current: 0,
          lastReflectionDate: '',
        },
      });
    }
  }

  /**
   * Export reflections in JSON format
   * @returns JSON string of all reflections
   */
  async exportJSON(): Promise<string> {
    const reflections = await this.getReflections();
    return JSON.stringify(reflections, null, 2);
  }

  /**
   * Export reflections in Markdown format
   * @returns Markdown string of all reflections
   */
  async exportMarkdown(): Promise<string> {
    const reflections = await this.getReflections();
    const header = this.generateMarkdownHeader(reflections.length);
    const body = this.generateMarkdownBody(reflections);
    return header + body;
  }

  /**
   * Generate Markdown export header
   * @param count Number of reflections
   * @returns Markdown header string
   */
  private generateMarkdownHeader(count: number): string {
    let header = '# Reflexa AI - Reflections Export\n\n';
    header += `Exported on: ${formatDate(Date.now())}\n`;
    header += `Total Reflections: ${count}\n\n`;
    header += '---\n\n';
    return header;
  }

  /**
   * Generate Markdown export body
   * @param reflections Array of reflections to export
   * @returns Markdown body string
   */
  private generateMarkdownBody(reflections: Reflection[]): string {
    let body = '';

    for (const reflection of reflections) {
      body += this.generateReflectionMarkdown(reflection);
      body += '---\n\n';
    }

    return body;
  }

  /**
   * Generate Markdown for a single reflection
   * @param reflection Reflection to convert to Markdown
   * @returns Markdown string for reflection
   */
  private generateReflectionMarkdown(reflection: Reflection): string {
    let markdown = `## ${reflection.title}\n\n`;
    markdown += `**URL:** ${reflection.url}\n`;
    markdown += `**Date:** ${formatDate(reflection.createdAt)}\n\n`;

    // Add AI metadata section if present
    if (reflection.aiMetadata) {
      markdown += this.generateAIMetadataMarkdown(reflection);
    }

    // Add summary section
    if (reflection.summary && reflection.summary.length > 0) {
      markdown += this.generateSummaryMarkdown(
        reflection.summary,
        reflection.summaryFormat
      );
    }

    // Add reflections section
    if (reflection.reflection && reflection.reflection.length > 0) {
      markdown += this.generateReflectionsMarkdown(reflection.reflection);
    }

    // Add proofread version if exists
    if (reflection.proofreadVersion) {
      markdown += '### Proofread Version\n\n';
      markdown += `${reflection.proofreadVersion}\n\n`;
    }

    // Add tags if exists
    if (reflection.tags && reflection.tags.length > 0) {
      markdown += `**Tags:** ${reflection.tags.join(', ')}\n\n`;
    }

    return markdown;
  }

  /**
   * Generate Markdown for AI metadata section
   * @param reflection Reflection with AI metadata
   * @returns Markdown string for AI metadata
   */
  private generateAIMetadataMarkdown(reflection: Reflection): string {
    let markdown = '### AI Processing\n\n';

    // Add language information
    if (reflection.detectedLanguage) {
      markdown += `**Detected Language:** ${reflection.detectedLanguage}`;
      if (reflection.originalLanguage) {
        markdown += ` (Original: ${reflection.originalLanguage})`;
      }
      markdown += '\n';
    }

    if (reflection.translatedTo) {
      markdown += `**Translated To:** ${reflection.translatedTo}\n`;
    }

    // Add summary format
    if (reflection.summaryFormat) {
      markdown += `**Summary Format:** ${reflection.summaryFormat}\n`;
    }

    // Add tone information
    if (reflection.toneUsed) {
      markdown += `**Tone Applied:** ${reflection.toneUsed}\n`;
    }

    // Add AI APIs used
    if (reflection.aiMetadata) {
      const apisUsed: string[] = [];
      if (reflection.aiMetadata.summarizerUsed) apisUsed.push('Summarizer');
      if (reflection.aiMetadata.writerUsed) apisUsed.push('Writer');
      if (reflection.aiMetadata.rewriterUsed) apisUsed.push('Rewriter');
      if (reflection.aiMetadata.proofreaderUsed) apisUsed.push('Proofreader');
      if (reflection.aiMetadata.translatorUsed) apisUsed.push('Translator');
      if (reflection.aiMetadata.promptFallback)
        apisUsed.push('Prompt (Fallback)');

      if (apisUsed.length > 0) {
        markdown += `**AI APIs Used:** ${apisUsed.join(', ')}\n`;
      }

      if (reflection.aiMetadata.processingTime > 0) {
        markdown += `**Processing Time:** ${reflection.aiMetadata.processingTime}ms\n`;
      }
    }

    markdown += '\n';
    return markdown;
  }

  /**
   * Generate Markdown for summary section
   * @param summary Array of summary bullets
   * @param format Optional summary format
   * @returns Markdown string for summary
   */
  private generateSummaryMarkdown(summary: string[], format?: string): string {
    let markdown = '### Summary';
    if (format) {
      markdown += ` (${format})`;
    }
    markdown += '\n\n';

    const labels = ['Insight', 'Surprise', 'Apply'];

    summary.forEach((bullet, index) => {
      markdown += `- **${labels[index] ?? 'Point'}:** ${bullet}\n`;
    });

    markdown += '\n';
    return markdown;
  }

  /**
   * Generate Markdown for reflections section
   * @param reflections Array of reflection texts
   * @returns Markdown string for reflections
   */
  private generateReflectionsMarkdown(reflections: string[]): string {
    let markdown = '### Reflections\n\n';

    reflections.forEach((text, index) => {
      markdown += `${index + 1}. ${text}\n\n`;
    });

    return markdown;
  }

  /**
   * Export reflections based on format
   * @param format Export format ('json' or 'markdown')
   * @returns Exported data as string
   */
  async exportReflections(format: 'json' | 'markdown'): Promise<string> {
    if (format === 'json') {
      return this.exportJSON();
    } else {
      return this.exportMarkdown();
    }
  }

  /**
   * Get current streak data
   * @returns Streak data object
   */
  async getStreak(): Promise<StreakData> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.STREAK);
    return (result[STORAGE_KEYS.STREAK] ?? {
      current: 0,
      lastReflectionDate: '',
    }) as StreakData;
  }

  /**
   * Update streak based on new reflection
   * @param timestamp Timestamp of new reflection
   * @returns Updated streak data
   */
  private async updateStreak(timestamp: number): Promise<StreakData> {
    const reflections = await this.getReflections();
    const dates = reflections.map((r) => formatISODate(r.createdAt));

    // Add new reflection date
    const newDate = formatISODate(timestamp);
    dates.push(newDate);

    // Calculate streak
    const streak = calculateStreak(dates);

    return {
      current: streak,
      lastReflectionDate: newDate,
    };
  }

  /**
   * Check storage quota and usage
   * @returns Object with bytes used and quota
   */
  async checkStorageQuota(): Promise<{ bytesUsed: number; quota: number }> {
    const bytesInUse = await chrome.storage.local.getBytesInUse();
    const quota = chrome.storage.local.QUOTA_BYTES;

    return {
      bytesUsed: bytesInUse,
      quota,
    };
  }

  /**
   * Check if storage is near quota limit (>90%)
   * @returns True if storage is near limit
   */
  async isStorageNearLimit(): Promise<boolean> {
    const { bytesUsed, quota } = await this.checkStorageQuota();
    return bytesUsed / quota > STORAGE_WARNING_THRESHOLD;
  }

  /**
   * Clear all reflections (use with caution)
   */
  async clearAllReflections(): Promise<void> {
    await chrome.storage.local.set({
      [STORAGE_KEYS.REFLECTIONS]: [],
      [STORAGE_KEYS.STREAK]: {
        current: 0,
        lastReflectionDate: '',
      },
    });

    // Invalidate cache after clear
    this.invalidateCache();
  }

  /**
   * Invalidate the reflections cache
   * Call this after any write operation
   */
  private invalidateCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Check if error is a quota exceeded error
   * @param error Error object
   * @returns True if quota exceeded error
   */
  private isQuotaExceededError(error: unknown): boolean {
    return (
      error instanceof Error &&
      (error.message.includes('QUOTA_BYTES') || error.message.includes('quota'))
    );
  }
}
