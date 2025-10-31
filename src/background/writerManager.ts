/**
 * Writer Manager for Chrome Built-in Writer API
 * Handles draft generation with tone and length control
 * Implements timeout logic, retry mechanism, streaming support, and session lifecycle management
 */

import type { WriterOptions } from '../types';
import type { AIWriter } from '../types/chrome-ai';
import { capabilityDetector } from './capabilityDetector';

/**
 * Timeout duration for writer operations (5 seconds)
 */
const WRITER_TIMEOUT = 5000;

/**
 * Extended timeout for retry attempts (8 seconds)
 */
const RETRY_TIMEOUT = 8000;

/**
 * Word count ranges for length control
 */
const LENGTH_RANGES = {
  short: { min: 50, max: 100 },
  medium: { min: 100, max: 200 },
  long: { min: 200, max: 300 },
} as const;

/**
 * WriterManager class
 * Manages Chrome Writer API sessions with tone/length control, error handling, and timeouts
 */
export class WriterManager {
  private sessions = new Map<string, AIWriter>();
  private available = false;

  /**
   * Check if Writer API is available
   * Uses capability detector for consistent availability checking
   * @returns Promise resolving to availability status
   */
  checkAvailability(): Promise<boolean> {
    try {
      const capabilities = capabilityDetector.getCapabilities();
      this.available = capabilities.writer;
      return Promise.resolve(this.available);
    } catch (error) {
      console.error('Error checking Writer availability:', error);
      this.available = false;
      return Promise.resolve(false);
    }
  }

  /**
   * Check if Writer API is available (synchronous)
   * @returns True if Writer API is available
   */
  isAvailable(): boolean {
    return this.available;
  }

  /**
   * Map Reflexa tone presets to Writer API tone values
   * @param tone - Reflexa tone preset
   * @returns Writer API tone value
   */
  private mapTone(
    tone: 'calm' | 'professional' | 'casual'
  ): 'formal' | 'neutral' | 'casual' {
    switch (tone) {
      case 'calm':
        return 'neutral';
      case 'professional':
        return 'formal';
      case 'casual':
        return 'casual';
      default:
        return 'neutral';
    }
  }

  /**
   * Map length parameter to Writer API length value
   * @param length - Length preset
   * @returns Writer API length value
   */
  private mapLength(
    length: 'short' | 'medium' | 'long'
  ): 'short' | 'medium' | 'long' {
    return length;
  }

  /**
   * Create or retrieve a writer session with specific configuration
   * Sessions are cached by configuration key for reuse
   * @param config - Writer configuration options
   * @returns AIWriter session or null if unavailable
   */
  private async createSession(config: {
    sharedContext?: string;
    tone?: 'formal' | 'neutral' | 'casual';
    format?: 'plain-text' | 'markdown';
    length?: 'short' | 'medium' | 'long';
    outputLanguage?: string;
  }): Promise<AIWriter | null> {
    const sessionKey = `${config.tone ?? 'neutral'}-${config.format ?? 'markdown'}-${config.length ?? 'medium'}-${config.outputLanguage ?? 'default'}`;

    // Return cached session if available
    if (this.sessions.has(sessionKey)) {
      return this.sessions.get(sessionKey)!;
    }

    try {
      // Access Writer from globalThis (service worker context)
      // Note: Writer API is accessed via global Writer, not ai.writer
      if (typeof Writer === 'undefined') {
        console.warn('Writer API not available');
        return null;
      }

      // Create new session with specified options
      const session = await Writer.create({
        sharedContext: config.sharedContext,
        tone: config.tone,
        format: config.format ?? 'markdown', // Default is markdown per docs
        length: config.length,
        ...(config.outputLanguage && { outputLanguage: config.outputLanguage }),
      });

      // Cache the session
      this.sessions.set(sessionKey, session);
      console.log(
        `Created writer session: ${sessionKey}${config.outputLanguage ? ` (language: ${config.outputLanguage})` : ''}`
      );

      return session;
    } catch (error) {
      console.error('Error creating writer session:', error);
      return null;
    }
  }

  /**
   * Write/generate text with specified options (main method for message handlers)
   * @param prompt - Prompt for text generation
   * @param options - Writer options (tone, format, length, outputLanguage)
   * @returns Generated text
   */
  async write(
    prompt: string,
    options?: {
      tone?: 'formal' | 'neutral' | 'casual';
      format?: 'plain-text' | 'markdown';
      length?: 'short' | 'medium' | 'long';
      outputLanguage?: string;
    }
  ): Promise<string> {
    // Map to WriterOptions format
    const writerOptions: WriterOptions = {
      tone: this.mapReverseTone(options?.tone ?? 'neutral'),
      length: options?.length ?? 'medium',
    };

    return this.generate(
      prompt,
      writerOptions,
      undefined,
      options?.outputLanguage
    );
  }

  /**
   * Map Writer API tone to Reflexa tone
   * @param tone - Writer API tone
   * @returns Reflexa tone preset
   */
  private mapReverseTone(
    tone: 'formal' | 'neutral' | 'casual'
  ): 'calm' | 'professional' | 'casual' {
    switch (tone) {
      case 'formal':
        return 'professional';
      case 'neutral':
        return 'calm';
      case 'casual':
        return 'casual';
      default:
        return 'calm';
    }
  }

  /**
   * Generate draft text with specified options
   * Implements timeout logic and retry mechanism
   * @param topic - Topic or prompt for draft generation
   * @param options - Writer options (tone, length)
   * @param context - Optional context (e.g., summary) for better generation
   * @param outputLanguage - Target language for generated text
   * @returns Generated draft text
   * @throws Error if generation fails after retry
   */
  async generate(
    topic: string,
    options: WriterOptions,
    context?: string,
    outputLanguage?: string
  ): Promise<string> {
    // Check availability first
    if (!this.available) {
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        throw new Error('Writer API is not available');
      }
    }

    try {
      // First attempt with standard timeout
      return await this.generateWithTimeout(
        topic,
        options,
        context,
        outputLanguage,
        WRITER_TIMEOUT
      );
    } catch (error) {
      console.warn('First generation attempt failed, retrying...', error);

      try {
        // Retry with extended timeout
        return await this.generateWithTimeout(
          topic,
          options,
          context,
          outputLanguage,
          RETRY_TIMEOUT
        );
      } catch (retryError) {
        console.error('Generation failed after retry:', retryError);
        throw new Error(
          `Draft generation failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`
        );
      }
    }
  }

  /**
   * Generate with timeout wrapper
   * @param topic - Topic or prompt for draft generation
   * @param options - Writer options
   * @param context - Optional context
   * @param outputLanguage - Target language for generated text
   * @param timeout - Timeout in milliseconds
   * @returns Generated draft text
   */
  private async generateWithTimeout(
    topic: string,
    options: WriterOptions,
    context: string | undefined,
    outputLanguage: string | undefined,
    timeout: number
  ): Promise<string> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Writer timeout')), timeout);
    });

    const generatePromise = this.executeGenerate(
      topic,
      options,
      context,
      outputLanguage
    );

    return Promise.race([generatePromise, timeoutPromise]);
  }

  /**
   * Execute draft generation
   * @param topic - Topic or prompt for draft generation
   * @param options - Writer options (tone, length)
   * @param context - Optional context for better generation
   * @param outputLanguage - Target language for generated text
   * @returns Generated draft text
   */
  private async executeGenerate(
    topic: string,
    options: WriterOptions,
    context?: string,
    outputLanguage?: string
  ): Promise<string> {
    // Map tone and length to Writer API values
    const apiTone = this.mapTone(options.tone);
    const apiLength = this.mapLength(options.length);

    // Don't use sharedContext - pass everything as the input to write()
    // This ensures the Writer API generates content based on the full prompt
    const session = await this.createSession({
      tone: apiTone,
      format: 'plain-text',
      length: apiLength,
      outputLanguage,
    });

    if (!session) {
      throw new Error('Failed to create writer session');
    }

    // Build the full prompt to pass to write()
    const fullPrompt = context ? `Context: ${context}\n\n${topic}` : topic;

    // Generate draft - pass the full prompt as input
    const result = await session.write(fullPrompt);

    // Format response as clean paragraph text
    const cleanedText = result.trim();

    // Validate word count based on length parameter
    const wordCount = cleanedText.split(/\s+/).length;
    const range = LENGTH_RANGES[options.length];

    console.log(
      `Generated draft: ${wordCount} words (target: ${range.min}-${range.max})`
    );

    return cleanedText;
  }

  /**
   * Generate draft with streaming support
   * Updates progressively as text generates
   * @param topic - Topic or prompt for draft generation
   * @param options - Writer options (tone, length)
   * @param context - Optional context for better generation
   * @param onChunk - Callback for each text chunk
   * @param outputLanguage - Target language for generated text
   * @returns Complete generated text
   */
  async generateStreaming(
    topic: string,
    options: WriterOptions,
    context: string | undefined,
    onChunk: (chunk: string) => void,
    outputLanguage?: string
  ): Promise<string> {
    // Check availability first
    if (!this.available) {
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        throw new Error('Writer API is not available');
      }
    }

    try {
      // Map tone and length to Writer API values
      const apiTone = this.mapTone(options.tone);
      const apiLength = this.mapLength(options.length);

      // Build shared context
      const sharedContext = context
        ? `Context: ${context}\n\nGenerate a reflective paragraph about: ${topic}`
        : `Generate a reflective paragraph about: ${topic}`;

      // Create session with configuration
      const session = await this.createSession({
        sharedContext,
        tone: apiTone,
        format: 'plain-text',
        length: apiLength,
        outputLanguage,
      });

      if (!session) {
        throw new Error('Failed to create writer session');
      }

      // Get streaming response and iterate using for await...of
      const stream = session.writeStreaming(topic, {
        context: context,
      });
      let fullText = '';

      // Use for await...of to iterate over the stream as per documentation
      for await (const chunk of stream) {
        fullText += chunk;
        // Call chunk callback for progressive UI updates
        onChunk(chunk);
      }

      return fullText.trim();
    } catch (error) {
      console.error('Streaming generation failed:', error);
      throw new Error(
        `Streaming generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Clean up all active sessions
   * Should be called when the manager is no longer needed
   */
  destroy(): void {
    for (const [key, session] of this.sessions.entries()) {
      try {
        session.destroy();
        console.log(`Destroyed writer session: ${key}`);
      } catch (error) {
        console.error(`Error destroying session ${key}:`, error);
      }
    }
    this.sessions.clear();
  }

  /**
   * Clean up a specific session
   * @param options - Writer options to identify the session
   */
  destroySession(options: WriterOptions): void {
    const apiTone = this.mapTone(options.tone);
    const apiLength = this.mapLength(options.length);
    const sessionKey = `${apiTone}-plain-text-${apiLength}`;

    const session = this.sessions.get(sessionKey);
    if (session) {
      try {
        session.destroy();
        this.sessions.delete(sessionKey);
        console.log(`Destroyed writer session: ${sessionKey}`);
      } catch (error) {
        console.error(`Error destroying session ${sessionKey}:`, error);
      }
    }
  }
}
