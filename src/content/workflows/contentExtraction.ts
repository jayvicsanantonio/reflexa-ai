/**
 * Content Extraction Workflow
 * Centralizes content extraction operations including validation and truncation
 */

import { contentState } from '../state';
import { instanceManager } from '../core';
import type { ExtractedContent } from '../../types';

/**
 * Extract and validate content from the page
 * Handles token limit checking and truncation automatically
 * @returns ExtractedContent or null if extraction fails
 */
export function extractAndValidateContent(): ExtractedContent | null {
  const contentExtractor = instanceManager.getContentExtractor();
  const extractedContent = contentExtractor.extractMainContent();

  if (!extractedContent?.text.trim()) {
    console.error('Failed to extract content from page');
    return null;
  }

  // Check if content exceeds token limit
  const { exceeds, tokens } =
    contentExtractor.checkTokenLimit(extractedContent);

  if (exceeds) {
    console.warn(
      `Content exceeds token limit (${tokens} tokens), will be truncated`
    );
    // Return truncated content
    return contentExtractor.getTruncatedContent(extractedContent);
  }

  return extractedContent;
}

/**
 * Extract content and store in state
 * @returns true if extraction succeeded, false otherwise
 */
export function extractAndStoreContent(): boolean {
  const extractedContent = extractAndValidateContent();

  if (!extractedContent) {
    return false;
  }

  // Store in state
  contentState.setExtractedContent(extractedContent);

  console.log('Content extracted:', {
    title: extractedContent.title,
    textLength: extractedContent.text.length,
    wordCount: extractedContent.wordCount,
    url: extractedContent.url,
  });

  return true;
}
