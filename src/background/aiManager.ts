/**
 * AI Manager for Gemini Nano integration
 * Handles all interactions with Chrome's built-in AI (Gemini Nano)
 */

import { AI_PROMPTS, CONTENT_LIMITS, TIMING } from '../constants';
import { estimateTokens, truncateToTokens } from '../utils';

/**
 * Type definitions for Chrome's Prompt API (Gemini Nano)
 * These are experimental APIs that may not be in standard TypeScript definitions
 */
interface AILanguageModel {
  prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  promptStreaming(input: string): ReadableStream;
  destroy(): void;
}

interface AILanguageModelFactory {
  create(options?: {
    systemPrompt?: string;
    initialPrompts?: { role: string; content: string }[];
    signal?: AbortSignal;
    monitor?: (monitor: AIDownloadProgressMonitor) => void;
  }): Promise<AILanguageModel>;
  availability(): Promise<
    'available' | 'downloadable' | 'downloading' | 'unavailable'
  >;
}

interface AIDownloadProgressMonitor {
  addEventListener(
    type: 'downloadprogress',
    listener: (event: { loaded: number }) => void
  ): void;
}

// Extend the global Window interface to include the AI API
declare global {
  interface Window {
    ai?: {
      languageModel?: AILanguageModelFactory;
    };
  }
}

/**
 * AIManager class that wraps Chrome's Prompt API (Gemini Nano)
 */
export class AIManager {
  private isAvailable = false;
  private model: AILanguageModel | null = null;
  private modelCreatedAt = 0;
  private readonly MODEL_SESSION_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if Gemini Nano is available on the user's system
   * @returns Promise resolving to availability status
   */
  async checkAvailability(): Promise<boolean> {
    try {
      // Check if the AI API exists
      if (!window.ai?.languageModel) {
        console.warn('Chrome AI API not available');
        this.isAvailable = false;
        return false;
      }

      const availability = await window.ai.languageModel.availability();
      console.log('AI availability status:', availability);

      // Consider 'available' and 'downloadable' as usable states
      this.isAvailable =
        availability === 'available' || availability === 'downloadable';
      return this.isAvailable;
    } catch (error) {
      console.error('Error checking AI availability:', error);
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Initialize the AI model session
   * @param systemPrompt Optional system prompt to set context
   * @returns Promise resolving to success status
   */
  private async initializeModel(systemPrompt?: string): Promise<boolean> {
    try {
      if (!window.ai?.languageModel) {
        return false;
      }

      // Create a new session with optional system prompt
      const options: Parameters<AILanguageModelFactory['create']>[0] = {};

      if (systemPrompt) {
        options.systemPrompt = systemPrompt;
      }

      // Add download progress monitoring
      options.monitor = (m: AIDownloadProgressMonitor) => {
        m.addEventListener('downloadprogress', (e) => {
          console.log(
            `AI model download progress: ${(e.loaded * 100).toFixed(1)}%`
          );
        });
      };

      this.model = await window.ai.languageModel.create(options);
      this.modelCreatedAt = Date.now();
      return true;
    } catch (error) {
      console.error('Error initializing AI model:', error);
      return false;
    }
  }

  /**
   * Ensure model is initialized and valid
   * Recreates model if session is stale or invalid
   * @returns Promise resolving to success status
   */
  private async ensureModel(): Promise<boolean> {
    // Check if model exists and is not stale
    if (this.model) {
      const age = Date.now() - this.modelCreatedAt;

      // If model is too old, recreate it
      if (age > this.MODEL_SESSION_TTL) {
        console.log('Model session expired, recreating...');
        this.model.destroy();
        this.model = null;
        return await this.initializeModel();
      }

      // Test if model is still valid with a quick prompt
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 100);

        await this.model.prompt('test', { signal: controller.signal });
        clearTimeout(timeoutId);
        return true;
      } catch {
        // Model is invalid, recreate it
        console.log('Model session invalid, recreating...');
        this.model.destroy();
        this.model = null;
        return await this.initializeModel();
      }
    }

    // No model exists, create one
    return await this.initializeModel();
  }

  /**
   * Summarize content into three bullets (Insight, Surprise, Apply)
   * @param content The article content to summarize
   * @returns Promise resolving to array of three summary bullets, or empty array on failure
   */
  async summarize(content: string): Promise<string[]> {
    try {
      // Check availability first
      if (!this.isAvailable) {
        const available = await this.checkAvailability();
        if (!available) {
          console.warn('AI not available for summarization');
          return [];
        }
      }

      // Truncate content if it exceeds token limit
      const tokens = estimateTokens(content);
      let processedContent = content;

      if (tokens > CONTENT_LIMITS.MAX_TOKENS) {
        console.warn(
          `Content exceeds ${CONTENT_LIMITS.MAX_TOKENS} tokens, truncating...`
        );
        processedContent = truncateToTokens(
          content,
          CONTENT_LIMITS.TRUNCATE_TOKENS
        );
      }

      // Format the prompt
      const prompt = AI_PROMPTS.SUMMARIZE.replace(
        '{content}',
        processedContent
      );

      // Call AI with timeout and retry logic
      const result = await this.callWithTimeout(prompt, 1);

      if (!result) {
        return [];
      }

      // Parse the response into three bullets
      const bullets = this.parseSummaryResponse(result);
      return bullets;
    } catch (error) {
      console.error('Error in summarize:', error);
      return [];
    }
  }

  /**
   * Generate two reflection prompts based on the summary
   * @param summary The three-bullet summary
   * @returns Promise resolving to array of two reflection questions, or empty array on failure
   */
  async generateReflectionPrompts(summary: string[]): Promise<string[]> {
    try {
      // Check availability first
      if (!this.isAvailable) {
        const available = await this.checkAvailability();
        if (!available) {
          console.warn('AI not available for reflection prompts');
          return [];
        }
      }

      // Format the summary for the prompt
      const summaryText = summary.join('\n');
      const prompt = AI_PROMPTS.REFLECT.replace('{summary}', summaryText);

      // Call AI with timeout and retry logic
      const result = await this.callWithTimeout(prompt, 1);

      if (!result) {
        return [];
      }

      // Parse the response into two questions
      const questions = this.parseReflectionResponse(result);
      return questions;
    } catch (error) {
      console.error('Error in generateReflectionPrompts:', error);
      return [];
    }
  }

  /**
   * Proofread text for grammar and clarity improvements
   * @param text The text to proofread
   * @returns Promise resolving to proofread text, or original text on failure
   */
  async proofread(text: string): Promise<string> {
    try {
      // Check availability first
      if (!this.isAvailable) {
        const available = await this.checkAvailability();
        if (!available) {
          console.warn('AI not available for proofreading');
          return text;
        }
      }

      // Format the prompt
      const prompt = AI_PROMPTS.PROOFREAD.replace('{text}', text);

      // Call AI with timeout and retry logic
      const result = await this.callWithTimeout(prompt, 1);

      if (!result) {
        return text;
      }

      // Return the proofread version, or original if empty
      return result.trim() || text;
    } catch (error) {
      console.error('Error in proofread:', error);
      return text;
    }
  }

  /**
   * Call the AI model with timeout and retry logic
   * @param prompt The prompt to send to the AI
   * @param retryCount Number of retries remaining
   * @returns Promise resolving to AI response or null on failure
   */
  private async callWithTimeout(
    prompt: string,
    retryCount: number
  ): Promise<string | null> {
    try {
      // Ensure model is initialized and valid
      const modelReady = await this.ensureModel();
      if (!modelReady) {
        return null;
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMING.AI_TIMEOUT);

      try {
        // Call the AI model with abort signal
        const result = await this.model!.prompt(prompt, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return result;
      } catch (error) {
        clearTimeout(timeoutId);

        // Check if it was a timeout (abort)
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('AI request timed out');

          // Retry once if we have retries left
          if (retryCount > 0) {
            console.log('Retrying AI request...');
            return this.callWithTimeout(prompt, retryCount - 1);
          }
        }

        throw error;
      }
    } catch (error) {
      console.error('Error calling AI model:', error);
      return null;
    }
  }

  /**
   * Validate summary bullets for quality
   * @param bullets Array of summary bullets
   * @returns True if valid, false otherwise
   */
  private validateSummary(bullets: string[]): boolean {
    // Must have exactly 3 bullets
    if (bullets.length !== 3) {
      return false;
    }

    // Each bullet must be non-empty and within reasonable length
    return bullets.every((bullet) => {
      const trimmed = bullet.trim();
      const wordCount = trimmed.split(/\s+/).length;

      // Must have content and not exceed max words (with some tolerance)
      return (
        trimmed.length > 0 &&
        wordCount > 0 &&
        wordCount <= CONTENT_LIMITS.MAX_SUMMARY_WORDS + 5 // Allow 5 word tolerance
      );
    });
  }

  /**
   * Parse the summary response into three bullets
   * Expected format:
   * - Insight: [text]
   * - Surprise: [text]
   * - Apply: [text]
   *
   * @param response Raw AI response
   * @returns Array of three summary bullets
   */
  private parseSummaryResponse(response: string): string[] {
    try {
      const lines = response.split('\n').filter((line) => line.trim());
      const bullets: string[] = [];

      // Look for lines starting with "- Insight:", "- Surprise:", "- Apply:"
      const insightMatch = lines.find((line) =>
        line.toLowerCase().includes('insight:')
      );
      const surpriseMatch = lines.find((line) =>
        line.toLowerCase().includes('surprise:')
      );
      const applyMatch = lines.find((line) =>
        line.toLowerCase().includes('apply:')
      );

      if (insightMatch) {
        bullets.push(this.extractBulletText(insightMatch, 'insight:'));
      }
      if (surpriseMatch) {
        bullets.push(this.extractBulletText(surpriseMatch, 'surprise:'));
      }
      if (applyMatch) {
        bullets.push(this.extractBulletText(applyMatch, 'apply:'));
      }

      // Validate parsed bullets
      if (!this.validateSummary(bullets)) {
        console.warn('Parsed summary failed validation, using fallback');
        return this.fallbackParseSummary(response);
      }

      return bullets;
    } catch (error) {
      console.error('Error parsing summary response:', error);
      return this.fallbackParseSummary(response);
    }
  }

  /**
   * Extract text after a label (e.g., "Insight: text" -> "text")
   * @param line The line containing the label and text
   * @param label The label to remove (e.g., "insight:")
   * @returns Extracted text
   */
  private extractBulletText(line: string, label: string): string {
    const index = line.toLowerCase().indexOf(label);
    if (index === -1) return line.trim();

    return line
      .substring(index + label.length)
      .replace(/^[\s\-:]+/, '') // Remove leading whitespace, dashes, colons
      .trim();
  }

  /**
   * Fallback parsing for summary when expected format is not found
   * @param response Raw AI response
   * @returns Array of up to three bullets
   */
  private fallbackParseSummary(response: string): string[] {
    const lines = response
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((line) => !/^(insight|surprise|apply)$/i.exec(line)); // Remove standalone labels

    // Take first 3 non-empty lines
    return lines.slice(0, 3);
  }

  /**
   * Validate reflection questions for quality
   * @param questions Array of reflection questions
   * @returns True if valid, false otherwise
   */
  private validateReflectionQuestions(questions: string[]): boolean {
    // Must have exactly 2 questions
    if (questions.length !== 2) {
      return false;
    }

    // Each question must be non-empty, end with '?', and within reasonable length
    return questions.every((question) => {
      const trimmed = question.trim();
      const wordCount = trimmed.split(/\s+/).length;

      // Must have content, end with '?', and not exceed max words (with tolerance)
      return (
        trimmed.length > 0 &&
        trimmed.endsWith('?') &&
        wordCount > 0 &&
        wordCount <= CONTENT_LIMITS.MAX_PROMPT_WORDS + 5 // Allow 5 word tolerance
      );
    });
  }

  /**
   * Parse the reflection response into two questions
   * Expected format:
   * 1. [First question]
   * 2. [Second question]
   *
   * @param response Raw AI response
   * @returns Array of two reflection questions
   */
  private parseReflectionResponse(response: string): string[] {
    try {
      const lines = response.split('\n').filter((line) => line.trim());
      const questions: string[] = [];

      // Look for lines starting with "1." or "2."
      for (const line of lines) {
        const match = /^[12][.)]\s*(.+)/.exec(line);
        if (match) {
          questions.push(match[1].trim());
        }
      }

      // Validate parsed questions
      if (!this.validateReflectionQuestions(questions)) {
        console.warn(
          'Parsed reflection questions failed validation, using fallback'
        );
        return this.fallbackParseReflection(response);
      }

      return questions;
    } catch (error) {
      console.error('Error parsing reflection response:', error);
      return this.fallbackParseReflection(response);
    }
  }

  /**
   * Fallback parsing for reflection prompts when expected format is not found
   * @param response Raw AI response
   * @returns Array of up to two questions
   */
  private fallbackParseReflection(response: string): string[] {
    const lines = response
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((line) => /\?/.exec(line)); // Filter for questions

    // Take first 2 questions
    return lines.slice(0, 2);
  }

  /**
   * Summarize content with streaming response
   * Yields partial results as they become available
   * @param content The article content to summarize
   * @returns AsyncGenerator yielding partial summary text
   */
  async *summarizeStreaming(content: string): AsyncGenerator<string> {
    try {
      // Check availability first
      if (!this.isAvailable) {
        const available = await this.checkAvailability();
        if (!available) {
          console.warn('AI not available for streaming summarization');
          return;
        }
      }

      // Truncate content if it exceeds token limit
      const tokens = estimateTokens(content);
      let processedContent = content;

      if (tokens > CONTENT_LIMITS.MAX_TOKENS) {
        console.warn(
          `Content exceeds ${CONTENT_LIMITS.MAX_TOKENS} tokens, truncating...`
        );
        processedContent = truncateToTokens(
          content,
          CONTENT_LIMITS.TRUNCATE_TOKENS
        );
      }

      // Format the prompt
      const prompt = AI_PROMPTS.SUMMARIZE.replace(
        '{content}',
        processedContent
      );

      // Ensure model is ready
      const modelReady = await this.ensureModel();
      if (!modelReady) {
        return;
      }

      // Get streaming response
      const stream = this.model!.promptStreaming(prompt);
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const result = await reader.read();
          const done = result.done;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const value = result.value;

          if (done) {
            break;
          }

          // Decode and yield the chunk
          if (value) {
            const chunk = decoder.decode(value as Uint8Array, { stream: true });
            yield chunk;
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Error in summarizeStreaming:', error);
    }
  }

  /**
   * Generate reflection prompts with streaming response
   * Yields partial results as they become available
   * @param summary The three-bullet summary
   * @returns AsyncGenerator yielding partial prompt text
   */
  async *generateReflectionPromptsStreaming(
    summary: string[]
  ): AsyncGenerator<string> {
    try {
      // Check availability first
      if (!this.isAvailable) {
        const available = await this.checkAvailability();
        if (!available) {
          console.warn('AI not available for streaming reflection prompts');
          return;
        }
      }

      // Format the summary for the prompt
      const summaryText = summary.join('\n');
      const prompt = AI_PROMPTS.REFLECT.replace('{summary}', summaryText);

      // Ensure model is ready
      const modelReady = await this.ensureModel();
      if (!modelReady) {
        return;
      }

      // Get streaming response
      const stream = this.model!.promptStreaming(prompt);
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const result = await reader.read();
          const done = result.done;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const value = result.value;

          if (done) {
            break;
          }

          // Decode and yield the chunk
          if (value) {
            const chunk = decoder.decode(value as Uint8Array, { stream: true });
            yield chunk;
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Error in generateReflectionPromptsStreaming:', error);
    }
  }

  /**
   * Destroy the current AI model session
   */
  destroy(): void {
    if (this.model) {
      this.model.destroy();
      this.model = null;
      this.modelCreatedAt = 0;
    }
  }
}
