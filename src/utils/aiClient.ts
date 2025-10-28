/**
 * AI Client utilities for calling Gemini Nano APIs from content scripts and popup
 * Provides a clean interface for chrome.runtime.sendMessage
 */

import type { AIResponse } from '../types';

/**
 * Send a message to the background service worker and wait for response
 */
async function sendMessage<T>(
  type: string,
  payload?: unknown
): Promise<AIResponse<T>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, payload }, (response: AIResponse<T>) => {
      if (chrome.runtime.lastError) {
        resolve({
          success: false,
          error: chrome.runtime.lastError.message ?? 'Unknown error',
        });
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Prompt API - Summarize content
 */
export async function summarize(content: string): Promise<string[]> {
  const response = await sendMessage<string[]>('summarize', { content });

  if (!response.success) {
    console.error('Summarization failed:', response.error);
    return [];
  }

  return response.data;
}

/**
 * Prompt API - Generate reflection prompts
 */
export async function generateReflectionPrompts(
  summary: string[]
): Promise<string[]> {
  const response = await sendMessage<string[]>('reflect', { summary });

  if (!response.success) {
    console.error('Reflection generation failed:', response.error);
    return [];
  }

  return response.data;
}

/**
 * Proofreader API - Proofread text
 * Automatically uses native Proofreader API if available, falls back to Prompt API
 */
export async function proofread(text: string): Promise<string> {
  const response = await sendMessage<string>('proofread', { text });

  if (!response.success) {
    console.error('Proofreading failed:', response.error);
    return text; // Return original text on failure
  }

  return response.data;
}

/**
 * Translator API - Translate text
 */
export async function translate(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> {
  const response = await sendMessage<string>('translate', {
    text,
    source: sourceLanguage,
    target: targetLanguage,
  });

  if (!response.success) {
    console.error('Translation failed:', response.error);
    return text; // Return original text on failure
  }

  return response.data;
}

/**
 * Rewriter API - Rewrite text with different style
 */
export async function rewrite(
  text: string,
  options?: {
    tone?: 'as-is' | 'more-formal' | 'more-casual';
    format?: 'as-is' | 'plain-text' | 'markdown';
    length?: 'as-is' | 'shorter' | 'longer';
  }
): Promise<string> {
  const response = await sendMessage<string>('rewrite', { text, options });

  if (!response.success) {
    console.error('Rewriting failed:', response.error);
    return text; // Return original text on failure
  }

  return response.data;
}

/**
 * Writer API - Generate new content
 */
export async function write(
  prompt: string,
  options?: {
    tone?: 'formal' | 'neutral' | 'casual';
    format?: 'plain-text' | 'markdown';
    length?: 'short' | 'medium' | 'long';
  }
): Promise<string> {
  const response = await sendMessage<string>('write', { prompt, options });

  if (!response.success) {
    console.error('Writing failed:', response.error);
    return '';
  }

  return response.data;
}

/**
 * Check Prompt API availability
 */
export async function checkAIAvailability(): Promise<boolean> {
  const response = await sendMessage<boolean>('checkAI');

  if (!response.success) {
    console.error('AI availability check failed:', response.error);
    return false;
  }

  return response.data;
}

/**
 * Check all Gemini Nano APIs availability
 */
export async function checkAllAIAvailability(): Promise<{
  prompt: boolean;
  proofreader: boolean;
  summarizer: boolean;
  translator: boolean;
  writer: boolean;
  rewriter: boolean;
}> {
  const response = await sendMessage<{
    prompt: boolean;
    proofreader: boolean;
    summarizer: boolean;
    translator: boolean;
    writer: boolean;
    rewriter: boolean;
  }>('checkAllAI');

  if (!response.success) {
    console.error('AI availability check failed:', response.error);
    return {
      prompt: false,
      proofreader: false,
      summarizer: false,
      translator: false,
      writer: false,
      rewriter: false,
    };
  }

  return response.data;
}

/**
 * Helper: Get writing suggestions for user input
 * Returns multiple rewrite options
 */
export async function getWritingSuggestions(text: string): Promise<{
  proofread: string;
  formal: string;
  casual: string;
  shorter: string;
}> {
  const [proofreadResult, formal, casual, shorter] = await Promise.all([
    proofread(text),
    rewrite(text, { tone: 'more-formal' }),
    rewrite(text, { tone: 'more-casual' }),
    rewrite(text, { length: 'shorter' }),
  ]);

  return { proofread: proofreadResult, formal, casual, shorter };
}

/**
 * Helper: Translate summary to target language
 */
export async function translateSummary(
  summary: string[],
  targetLanguage: string
): Promise<string[]> {
  return await Promise.all(
    summary.map((bullet) => translate(bullet, 'en', targetLanguage))
  );
}

/**
 * Helper: Generate alternative reflection questions
 */
export async function generateAlternativeQuestions(
  summary: string[],
  count = 3
): Promise<string[][]> {
  const questions: string[][] = [];

  for (let i = 0; i < count; i++) {
    const prompt = `Generate 2 unique reflection questions about: ${summary.join('. ')}`;
    const generated = await write(prompt, {
      tone: 'neutral',
      length: 'short',
    });

    // Parse generated questions (assuming they're numbered)
    const parsed = generated
      .split('\n')
      .filter((line) => /^[12][.)]/.exec(line.trim()))
      .map((line) => line.replace(/^[12][.)]/, '').trim());

    if (parsed.length === 2) {
      questions.push(parsed);
    }
  }

  return questions;
}
