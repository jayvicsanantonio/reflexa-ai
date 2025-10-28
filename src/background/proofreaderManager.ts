/**
 * Proofreader Manager for Chrome Built-in Proofreader API
 * Handles grammar checking and text correction with change tracking
 * Implements timeout logic, retry mechanism, and session lifecycle management
 */

import type { ProofreadResult, TextChange } from '../types';
import type { AIProofreader } from '../types/chrome-ai';
import { capabilityDetector } from './capabilityDetector';

/**
 * Timeout duration for proofreader operations (5 seconds)
 */
const PROOFREADER_TIMEOUT = 5000;

/**
 * Extended timeout for retry attempts (8 seconds)
 */
const RETRY_TIMEOUT = 8000;

/**
 * ProofreaderManager class
 * Manages Chrome Proofreader API sessions with change tracking, error handling, and timeouts
 */
export class ProofreaderManager {
  private session: AIProofreader | null = null;
  private available = false;

  /**
   * Check if Proofreader API is available
   * Uses capability detector for consistent availability checking
   * @returns Promise resolving to availability status
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const capabilities = await Promise.resolve(
        capabilityDetector.getCapabilities()
      );
      this.available = Boolean(capabilities.proofreader);
      return this.available;
    } catch (error) {
      console.error('Error checking Proofreader availability:', error);
      this.available = false;
      return false;
    }
  }

  /**
   * Check if Proofreader API is available (synchronous)
   * @returns True if Proofreader API is available
   */
  isAvailable(): boolean {
    return this.available;
  }

  /**
   * Create or retrieve a proofreader session
   * Only one session is maintained at a time
   * @param config - Proofreader configuration options
   * @returns AIProofreader session or null if unavailable
   */
  private async createSession(config?: {
    sharedContext?: string;
  }): Promise<AIProofreader | null> {
    // Return cached session if available
    if (this.session) {
      return this.session;
    }

    try {
      // Access ai.proofreader from globalThis (service worker context)
      if (typeof ai === 'undefined' || !ai?.proofreader) {
        console.warn('Proofreader API not available');
        return null;
      }

      // Create new session with specified options
      const session = await ai.proofreader.create({
        sharedContext: config?.sharedContext,
      });

      // Cache the session
      this.session = session;
      console.log('Created proofreader session');

      return session;
    } catch (error) {
      console.error('Error creating proofreader session:', error);
      return null;
    }
  }

  /**
   * Proofread text with grammar and clarity checking
   * Implements timeout logic and retry mechanism
   * Calculates diff and categorizes changes
   * @param text - Text to proofread
   * @returns ProofreadResult with corrected text and changes
   * @throws Error if proofreading fails after retry
   */
  async proofread(text: string): Promise<ProofreadResult> {
    // Check availability first
    if (!this.available) {
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        throw new Error('Proofreader API is not available');
      }
    }

    try {
      // First attempt with standard timeout
      return await this.proofreadWithTimeout(text, PROOFREADER_TIMEOUT);
    } catch (error) {
      console.warn('First proofread attempt failed, retrying...', error);

      try {
        // Retry with extended timeout
        return await this.proofreadWithTimeout(text, RETRY_TIMEOUT);
      } catch (retryError) {
        console.error('Proofreading failed after retry:', retryError);
        throw new Error(
          `Proofreading failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`
        );
      }
    }
  }

  /**
   * Proofread with timeout wrapper
   * @param text - Text to proofread
   * @param timeout - Timeout in milliseconds
   * @returns ProofreadResult with corrected text and changes
   */
  private async proofreadWithTimeout(
    text: string,
    timeout: number
  ): Promise<ProofreadResult> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Proofreader timeout')), timeout);
    });

    const proofreadPromise = this.executeProofread(text);

    return Promise.race([proofreadPromise, timeoutPromise]);
  }

  /**
   * Execute proofreading operation
   * @param text - Text to proofread
   * @returns ProofreadResult with corrected text and changes
   */
  private async executeProofread(text: string): Promise<ProofreadResult> {
    // Create session
    const session = await this.createSession();

    if (!session) {
      throw new Error('Failed to create proofreader session');
    }

    // Call API with grammar_clarity mode (implicit in the API)
    const correctedText = await session.proofread(text);

    // Calculate diff between original and corrected versions
    const changes = this.calculateChanges(text, correctedText);

    return {
      correctedText: correctedText.trim(),
      changes,
    };
  }

  /**
   * Calculate changes between original and corrected text
   * Categorizes changes by type (grammar, spelling, clarity)
   * Generates TextChange objects with position information
   * @param original - Original text
   * @param corrected - Corrected text
   * @returns Array of TextChange objects
   */
  private calculateChanges(original: string, corrected: string): TextChange[] {
    const changes: TextChange[] = [];

    // If texts are identical, return empty array
    if (original === corrected) {
      return changes;
    }

    // Split into words for comparison
    const originalWords = original.split(/\s+/);
    const correctedWords = corrected.split(/\s+/);

    // Simple diff algorithm: find changed segments
    let originalPos = 0;
    let correctedPos = 0;
    let charPosition = 0;

    while (
      originalPos < originalWords.length ||
      correctedPos < correctedWords.length
    ) {
      const origWord = originalWords[originalPos];
      const corrWord = correctedWords[correctedPos];

      if (origWord === corrWord) {
        // Words match, move forward
        charPosition += (origWord?.length ?? 0) + 1; // +1 for space
        originalPos++;
        correctedPos++;
      } else {
        // Words differ, find the extent of the change
        const changeStart = charPosition;
        let changeOriginal = origWord ?? '';
        let changeCorrected = corrWord ?? '';

        // Look ahead to find the end of the change
        let lookAhead = 1;
        while (
          originalPos + lookAhead < originalWords.length &&
          correctedPos + lookAhead < correctedWords.length &&
          originalWords[originalPos + lookAhead] !==
            correctedWords[correctedPos + lookAhead]
        ) {
          changeOriginal += ' ' + originalWords[originalPos + lookAhead];
          changeCorrected += ' ' + correctedWords[correctedPos + lookAhead];
          lookAhead++;
        }

        // Determine change type based on the nature of the change
        const changeType = this.categorizeChange(
          changeOriginal,
          changeCorrected
        );

        changes.push({
          original: changeOriginal,
          corrected: changeCorrected,
          type: changeType,
          position: {
            start: changeStart,
            end: changeStart + changeOriginal.length,
          },
        });

        // Move past the changed section
        charPosition += changeOriginal.length + 1;
        originalPos += lookAhead;
        correctedPos += lookAhead;
      }
    }

    return changes;
  }

  /**
   * Categorize a change by type (grammar, spelling, clarity)
   * Uses heuristics to determine the most likely type
   * @param original - Original text segment
   * @param corrected - Corrected text segment
   * @returns Change type
   */
  private categorizeChange(
    original: string,
    corrected: string
  ): 'grammar' | 'clarity' | 'spelling' {
    // Simple heuristics for categorization
    const origLower = original.toLowerCase();
    const corrLower = corrected.toLowerCase();

    // If only case changed, likely grammar (capitalization)
    if (origLower === corrLower) {
      return 'grammar';
    }

    // If words are similar (Levenshtein distance < 3), likely spelling
    if (this.levenshteinDistance(origLower, corrLower) <= 2) {
      return 'spelling';
    }

    // If word count changed significantly, likely clarity
    const origWordCount = original.split(/\s+/).length;
    const corrWordCount = corrected.split(/\s+/).length;
    if (Math.abs(origWordCount - corrWordCount) > 1) {
      return 'clarity';
    }

    // Default to grammar for other cases
    return 'grammar';
  }

  /**
   * Calculate Levenshtein distance between two strings
   * Used for determining spelling vs grammar changes
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Edit distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Clean up the active session
   * Should be called when the manager is no longer needed
   */
  destroy(): void {
    if (this.session) {
      try {
        this.session.destroy();
        console.log('Destroyed proofreader session');
      } catch (error) {
        console.error('Error destroying proofreader session:', error);
      }
      this.session = null;
    }
  }
}
