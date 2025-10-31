/**
 * Prompt Manager for Chrome Built-in Prompt API (Language Model)
 * Serves as universal fallback for all specialized AI APIs
 * Handles general-purpose AI prompting with conversation context management
 * Implements timeout logic, retry mechanism, and session lifecycle management
 */

/// <reference types="../../../types/chrome-ai.d.ts" />

import type { SummaryFormat, TonePreset, WriterOptions } from '../../../types';
import type { AILanguageModel } from '../../../types/chrome-ai';
import { capabilityDetector } from '../capabilities/capabilityDetector';

/**
 * Timeout duration for prompt operations (30 seconds)
 * Increased to accommodate model download and initialization
 */
const PROMPT_TIMEOUT = 30000;

/**
 * Extended timeout for retry attempts (60 seconds)
 * Allows for slower systems or large content processing
 */
const RETRY_TIMEOUT = 60000;

/**
 * Temperature settings for different task types
 */
const TEMPERATURE_SETTINGS = {
  factual: 0.3, // Low temperature for factual tasks (summarization)
  balanced: 0.7, // Balanced for general tasks
  creative: 0.9, // High temperature for creative tasks (writing, rewriting)
} as const;

/**
 * PromptManager class
 * Manages Chrome Prompt API (Language Model) sessions as universal fallback
 * Provides specialized prompts that mimic behavior of other AI APIs
 */
export class PromptManager {
  private sessions = new Map<string, AILanguageModel>();
  private available = false;

  /**
   * Check if Prompt API (Language Model) is available
   * Uses capability detector for consistent availability checking
   * @returns Promise resolving to availability status
   */
  async checkAvailability(): Promise<boolean> {
    try {
      // First check if API exists
      const capabilities = await Promise.resolve(
        capabilityDetector.getCapabilities()
      );

      if (!capabilities.prompt) {
        this.available = false;
        return false;
      }

      // Then check actual availability status using global LanguageModel
      if (typeof LanguageModel !== 'undefined') {
        const status = await LanguageModel.availability();
        this.available = status === 'available' || status === 'downloadable';
        return this.available;
      }

      this.available = false;
      return false;
    } catch (error) {
      console.error('Error checking Prompt API availability:', error);
      this.available = false;
      return false;
    }
  }

  /**
   * Check if Prompt API is available (synchronous)
   * @returns True if Prompt API is available
   */
  isAvailable(): boolean {
    return this.available;
  }

  /**
   * Create or retrieve a language model session with specific configuration
   * Sessions are cached by configuration key for reuse
   * @param config - Language model configuration options
   * @returns AILanguageModel session or null if unavailable
   */
  private async createSession(config: {
    systemPrompt?: string;
    initialPrompts?: {
      role: 'system' | 'user' | 'assistant';
      content: string;
    }[];
    temperature?: number;
    topK?: number;
    monitor?: (monitor: {
      addEventListener: (
        event: string,
        callback: (e: { loaded: number; total: number }) => void
      ) => void;
    }) => void;
    signal?: AbortSignal;
  }): Promise<AILanguageModel | null> {
    const sessionKey = `${config.systemPrompt ?? 'default'}-${config.temperature ?? 0.7}`;

    // Return cached session if available
    if (this.sessions.has(sessionKey)) {
      return this.sessions.get(sessionKey)!;
    }

    try {
      // Access global LanguageModel (service worker context)
      if (typeof LanguageModel === 'undefined') {
        console.warn('Prompt API (Language Model) not available');
        return null;
      }

      // Create new session with specified options
      const session = await LanguageModel.create({
        systemPrompt: config.systemPrompt,
        initialPrompts: config.initialPrompts,
        temperature: config.temperature ?? TEMPERATURE_SETTINGS.balanced,
        topK: config.topK ?? 40,
        monitor: config.monitor,
        signal: config.signal,
      });

      // Cache the session
      this.sessions.set(sessionKey, session);
      console.log(`Created prompt session: ${sessionKey.substring(0, 50)}...`);

      return session;
    } catch (error) {
      console.error('Error creating prompt session:', error);
      return null;
    }
  }

  /**
   * General-purpose prompt method
   * @param text - Input text/prompt
   * @param options - Optional configuration
   * @returns AI-generated response
   */
  async prompt(
    text: string,
    options?: {
      systemPrompt?: string;
      temperature?: number;
      topK?: number;
    }
  ): Promise<string> {
    // Check availability first
    if (!this.available) {
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        throw new Error('Prompt API is not available');
      }
    }

    try {
      // First attempt with standard timeout
      return await this.promptWithTimeout(text, options, PROMPT_TIMEOUT);
    } catch (error) {
      console.warn('First prompt attempt failed, retrying...', error);

      try {
        // Retry with extended timeout
        return await this.promptWithTimeout(text, options, RETRY_TIMEOUT);
      } catch (retryError) {
        console.error('Prompt failed after retry:', retryError);
        throw new Error(
          `Prompt operation failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`
        );
      }
    }
  }

  /**
   * Prompt with timeout wrapper
   * @param text - Input text/prompt
   * @param options - Optional configuration
   * @param timeout - Timeout in milliseconds
   * @returns AI-generated response
   */
  private async promptWithTimeout(
    text: string,
    options:
      | {
          systemPrompt?: string;
          temperature?: number;
          topK?: number;
        }
      | undefined,
    timeout: number
  ): Promise<string> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Prompt timeout')), timeout);
    });

    const promptPromise = this.executePrompt(text, options);

    return Promise.race([promptPromise, timeoutPromise]);
  }

  /**
   * Execute prompt operation
   * @param text - Input text/prompt
   * @param options - Optional configuration
   * @returns AI-generated response
   */
  private async executePrompt(
    text: string,
    options?: {
      systemPrompt?: string;
      temperature?: number;
      topK?: number;
    }
  ): Promise<string> {
    // Create session with configuration
    const session = await this.createSession({
      systemPrompt: options?.systemPrompt,
      temperature: options?.temperature,
      topK: options?.topK,
    });

    if (!session) {
      throw new Error('Failed to create prompt session');
    }

    // Execute prompt
    const result = await session.prompt(text);

    return result.trim();
  }

  /**
   * Summarize content using Prompt API as fallback
   * Mimics Summarizer API behavior with specialized prompts
   * @param text - Content to summarize
   * @param format - Desired summary format (defaults to 'bullets' for backward compatibility)
   * @returns Array of summary strings
   */
  async summarize(
    text: string,
    format: SummaryFormat = 'bullets'
  ): Promise<string[]> {
    const systemPrompt = this.buildSummarizationSystemPrompt(format);
    const userPrompt = this.buildSummarizationUserPrompt(text, format);

    const result = await this.prompt(userPrompt, {
      systemPrompt,
      temperature: TEMPERATURE_SETTINGS.factual,
    });

    return this.parseSummaryResponse(result, format);
  }

  /**
   * Build system prompt for summarization
   * @param format - Summary format
   * @returns System prompt string
   */
  private buildSummarizationSystemPrompt(format: SummaryFormat): string {
    const basePrompt =
      'You are a precise summarization assistant. Your task is to create concise, accurate summaries that capture the key information from the provided text.';

    switch (format) {
      case 'bullets':
        return `${basePrompt} Always respond with exactly 3 bullet points, each containing no more than 20 words. Format each bullet point on a new line starting with a dash (-).`;
      case 'paragraph':
        return `${basePrompt} Always respond with a single paragraph of no more than 150 words that captures the main ideas.`;
      case 'headline-bullets':
        return `${basePrompt} Always respond with a headline (maximum 10 words) on the first line, followed by exactly 3 bullet points (each no more than 20 words). Format bullet points starting with a dash (-).`;
      default:
        return basePrompt;
    }
  }

  /**
   * Build user prompt for summarization
   * @param text - Content to summarize
   * @param format - Summary format
   * @returns User prompt string
   */
  private buildSummarizationUserPrompt(
    text: string,
    format: SummaryFormat
  ): string {
    const formatInstructions: Record<SummaryFormat, string> = {
      bullets:
        'Provide exactly 3 bullet points summarizing the key information:',
      paragraph: 'Provide a concise paragraph summary:',
      'headline-bullets':
        'Provide a headline followed by 3 bullet points summarizing the key information:',
    };

    return `${formatInstructions[format]}\n\n${text}`;
  }

  /**
   * Parse summary response into array format
   * @param response - AI response
   * @param format - Summary format
   * @returns Array of summary strings
   */
  private parseSummaryResponse(
    response: string,
    format: SummaryFormat
  ): string[] {
    switch (format) {
      case 'bullets': {
        // Extract bullet points
        const bullets = response
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.startsWith('-') || line.startsWith('*'))
          .map((line) => line.replace(/^[-*]\s*/, '').trim())
          .filter((line) => line.length > 0)
          .slice(0, 3);

        // If no bullets found, split by newlines
        if (bullets.length === 0) {
          return response
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .slice(0, 3);
        }

        return bullets;
      }

      case 'paragraph':
        return [response.trim()];

      case 'headline-bullets': {
        const lines = response.split('\n').map((line) => line.trim());
        const headline = lines[0] ?? '';
        const bullets = lines
          .slice(1)
          .filter((line) => line.startsWith('-') || line.startsWith('*'))
          .map((line) => line.replace(/^[-*]\s*/, '').trim())
          .filter((line) => line.length > 0)
          .slice(0, 3);

        return [headline, ...bullets];
      }

      default:
        return [response.trim()];
    }
  }

  /**
   * Generate draft text using Prompt API as fallback
   * Mimics Writer API behavior with specialized prompts
   * @param topic - Topic or prompt for draft generation
   * @param options - Writer options (tone, length)
   * @param context - Optional context for better generation
   * @returns Generated draft text
   */
  async generateDraft(
    topic: string,
    options: WriterOptions,
    context?: string
  ): Promise<string> {
    const systemPrompt = this.buildWriterSystemPrompt(options);
    const userPrompt = this.buildWriterUserPrompt(topic, context);

    const result = await this.prompt(userPrompt, {
      systemPrompt,
      temperature: TEMPERATURE_SETTINGS.creative,
    });

    return result.trim();
  }

  /**
   * Build system prompt for draft generation
   * @param options - Writer options
   * @returns System prompt string
   */
  private buildWriterSystemPrompt(options: WriterOptions): string {
    const toneDescriptions: Record<WriterOptions['tone'], string> = {
      calm: 'calm, reflective, and mindful',
      professional: 'professional, clear, and formal',
      casual: 'casual, friendly, and conversational',
    };

    const lengthDescriptions: Record<WriterOptions['length'], string> = {
      short: '50-100 words',
      medium: '100-200 words',
      long: '200-300 words',
    };

    return `You are a skilled writing assistant. Generate thoughtful, well-structured text in a ${toneDescriptions[options.tone]} tone. Your response should be approximately ${lengthDescriptions[options.length]} in length. Write in a natural, flowing style appropriate for personal reflection.`;
  }

  /**
   * Build user prompt for draft generation
   * @param topic - Topic for generation
   * @param context - Optional context
   * @returns User prompt string
   */
  private buildWriterUserPrompt(topic: string, context?: string): string {
    if (context) {
      return `Based on the following context:\n\n${context}\n\nWrite a reflective paragraph about: ${topic}`;
    }

    return `Write a reflective paragraph about: ${topic}`;
  }

  /**
   * Rewrite text using Prompt API as fallback
   * Mimics Rewriter API behavior with specialized prompts
   * @param text - Text to rewrite
   * @param preset - Tone preset to apply
   * @param context - Optional context
   * @returns Rewritten text
   */
  async rewrite(
    text: string,
    preset: TonePreset,
    context?: string
  ): Promise<string> {
    const systemPrompt = this.buildRewriterSystemPrompt(preset);
    const userPrompt = this.buildRewriterUserPrompt(text, preset, context);

    const result = await this.prompt(userPrompt, {
      systemPrompt,
      temperature: TEMPERATURE_SETTINGS.creative,
    });

    return result.trim();
  }

  /**
   * Build system prompt for rewriting
   * @param preset - Tone preset
   * @returns System prompt string
   */
  private buildRewriterSystemPrompt(preset: TonePreset): string {
    const presetDescriptions: Record<TonePreset, string> = {
      calm: 'Rewrite text to be calm, peaceful, and reflective while maintaining the original meaning.',
      concise:
        'Rewrite text to be more concise and direct, removing unnecessary words while preserving all key information.',
      empathetic:
        'Rewrite text to be more empathetic, warm, and understanding while keeping the core message.',
      academic:
        'Rewrite text to be more formal, scholarly, and precise while maintaining clarity.',
    };

    return `You are a text rewriting assistant. ${presetDescriptions[preset]} Preserve the paragraph structure and all important details.`;
  }

  /**
   * Build user prompt for rewriting
   * @param text - Text to rewrite
   * @param preset - Tone preset
   * @param context - Optional context
   * @returns User prompt string
   */
  private buildRewriterUserPrompt(
    text: string,
    preset: TonePreset,
    context?: string
  ): string {
    const contextPrefix = context ? `Context: ${context}\n\n` : '';
    return `${contextPrefix}Rewrite the following text with a ${preset} tone:\n\n${text}`;
  }

  /**
   * Prompt with streaming support
   * Updates progressively as response generates
   * @param text - Input text/prompt
   * @param options - Optional configuration
   * @param onChunk - Callback for each text chunk
   * @returns Complete generated text
   */
  async promptStreaming(
    text: string,
    options:
      | {
          systemPrompt?: string;
          temperature?: number;
          topK?: number;
        }
      | undefined,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    // Check availability first
    if (!this.available) {
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        throw new Error('Prompt API is not available');
      }
    }

    try {
      // Create session with configuration
      const session = await this.createSession({
        systemPrompt: options?.systemPrompt,
        temperature: options?.temperature,
        topK: options?.topK,
      });

      if (!session) {
        throw new Error('Failed to create prompt session');
      }

      // Get streaming response - returns ReadableStream<string>
      const stream = session.promptStreaming(text);
      const reader = stream.getReader();
      let fullText = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Value is already a string chunk, no need to decode
          if (value) {
            fullText += value;

            // Call chunk callback for progressive UI updates
            onChunk(value);
          }
        }

        return fullText.trim();
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Streaming prompt failed:', error);
      throw new Error(
        `Streaming prompt failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
        console.log(`Destroyed prompt session: ${key.substring(0, 50)}...`);
      } catch (error) {
        console.error(`Error destroying session ${key}:`, error);
      }
    }
    this.sessions.clear();
  }

  /**
   * Clean up a specific session
   * @param sessionKey - Key identifying the session
   */
  destroySession(sessionKey: string): void {
    const session = this.sessions.get(sessionKey);
    if (session) {
      try {
        session.destroy();
        this.sessions.delete(sessionKey);
        console.log(
          `Destroyed prompt session: ${sessionKey.substring(0, 50)}...`
        );
      } catch (error) {
        console.error(`Error destroying session ${sessionKey}:`, error);
      }
    }
  }

  /**
   * Get model capabilities (token limits, temperature ranges)
   * @returns Model capabilities or null if unavailable
   */
  async getCapabilities(): Promise<{
    available: 'readily' | 'after-download' | 'no';
    defaultTopK: number;
    maxTopK: number;
    defaultTemperature: number;
  } | null> {
    try {
      if (typeof LanguageModel === 'undefined') {
        return null;
      }

      return await LanguageModel.capabilities();
    } catch (error) {
      console.error('Error getting model capabilities:', error);
      return null;
    }
  }

  /**
   * Clone an existing session
   * Useful for creating variations without re-downloading the model
   * @param sessionKey - Key of the session to clone
   * @returns Cloned session or null
   */
  async cloneSession(sessionKey: string): Promise<AILanguageModel | null> {
    const session = this.sessions.get(sessionKey);
    if (!session) {
      console.warn(`Session ${sessionKey} not found for cloning`);
      return null;
    }

    try {
      const clonedSession = await session.clone();
      const cloneKey = `${sessionKey}-clone-${Date.now()}`;
      this.sessions.set(cloneKey, clonedSession);
      console.log(`Cloned session: ${cloneKey}`);
      return clonedSession;
    } catch (error) {
      console.error('Error cloning session:', error);
      return null;
    }
  }

  /**
   * Count tokens in a prompt without executing it
   * Useful for checking if prompt fits within limits
   * @param text - Text to count tokens for
   * @param sessionKey - Optional session key to use for counting
   * @returns Token count or null if unavailable
   */
  async countTokens(text: string, sessionKey?: string): Promise<number | null> {
    try {
      let session: AILanguageModel | null = null;

      if (sessionKey && this.sessions.has(sessionKey)) {
        session = this.sessions.get(sessionKey)!;
      } else {
        // Create a temporary session for counting
        session = await this.createSession({});
      }

      if (!session) {
        return null;
      }

      return await session.countPromptTokens(text);
    } catch (error) {
      console.error('Error counting tokens:', error);
      return null;
    }
  }

  /**
   * Generate reflection prompts based on summary (backward compatibility method)
   * @param summary - Summary array to base prompts on
   * @returns Array of reflection prompts
   */
  async generateReflectionPrompts(summary: string[]): Promise<string[]> {
    const systemPrompt =
      'You are a thoughtful reflection assistant. Generate three insightful reflection prompts based on the provided summary. Each prompt should encourage deep thinking and personal connection to the content.';

    const userPrompt = `Based on this summary:\n\n${summary.join('\n')}\n\nGenerate exactly 3 reflection prompts, one per line, that help the reader think deeply about this content.`;

    const result = await this.prompt(userPrompt, {
      systemPrompt,
      temperature: TEMPERATURE_SETTINGS.creative,
    });

    // Parse response into array of prompts
    const prompts = result
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, ''))
      .slice(0, 3);

    return prompts.length > 0
      ? prompts
      : [
          'What insights from this content resonate with you?',
          'How might you apply these ideas in your life?',
          'What questions does this raise for you?',
        ];
  }

  /**
   * Proofread text for grammar and clarity (backward compatibility method)
   * Note: This is a simplified version. For full proofreading with change tracking,
   * use the ProofreaderManager when available.
   * @param text - Text to proofread
   * @returns Proofread text
   */
  async proofread(text: string): Promise<string> {
    const systemPrompt =
      'You are a professional proofreader. Fix grammar, spelling, and clarity issues while preserving the original meaning and tone. Return only the corrected text without explanations.';

    const userPrompt = `Proofread and correct the following text:\n\n${text}`;

    const result = await this.prompt(userPrompt, {
      systemPrompt,
      temperature: TEMPERATURE_SETTINGS.factual,
    });

    return result.trim();
  }
}
