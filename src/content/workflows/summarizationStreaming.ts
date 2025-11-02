/**
 * Summarization Streaming Workflow
 * Handles streaming summarization with animation and parsing logic
 */

import { contentState } from '../state';
import { startAIStream } from '../runtime/messageBus';
import type { SummaryFormat } from '../../types';

/**
 * Parse summary buffer into array of summary items
 * Handles different formats (bullets, paragraph, etc.)
 */
export function parseSummaryBuffer(
  buffer: string,
  format: SummaryFormat
): string[] {
  const normalized = buffer.replace(/\r/g, '');
  if (!normalized.trim()) {
    return [];
  }

  if (format === 'paragraph') {
    return [normalized.trim()];
  }

  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      // Remove common bullet markers: *, -, and bullet character (U+2022)
      let cleaned = line.replace(/^[*\-\u2022]\s*/u, '');
      if (cleaned.charCodeAt(0) === 0x2022) {
        cleaned = cleaned.substring(1).trim();
      }
      return cleaned.trim();
    });

  return lines;
}

/**
 * Stop summary animation
 */
export function stopSummaryAnimation(): void {
  if (contentState.getSummaryAnimationTimer() !== null) {
    window.clearTimeout(contentState.getSummaryAnimationTimer()!);
    contentState.setSummaryAnimationTimer(null);
  }
}

/**
 * Step summary animation
 * Progressively reveals summary text with animation
 * Requires renderOverlay callback for UI updates
 */
export function stepSummaryAnimation(renderOverlay: () => void): void {
  const targetLength = contentState.getSummaryBuffer().length;
  if (contentState.getSummaryAnimationIndex() >= targetLength) {
    contentState.setSummaryAnimationTimer(null);
    if (contentState.getSummaryStreamComplete()) {
      contentState.setSummaryDisplay(
        parseSummaryBuffer(
          contentState.getSummaryBuffer(),
          contentState.getSummaryAnimationFormat()
        )
      );
      renderOverlay();
    }
    return;
  }

  contentState.setSummaryAnimationIndex(
    Math.min(contentState.getSummaryAnimationIndex() + 3, targetLength)
  );

  const partial = contentState
    .getSummaryBuffer()
    .slice(0, contentState.getSummaryAnimationIndex());
  contentState.setSummaryDisplay(
    parseSummaryBuffer(partial, contentState.getSummaryAnimationFormat())
  );
  renderOverlay();

  contentState.setSummaryAnimationTimer(
    window.setTimeout(() => stepSummaryAnimation(renderOverlay), 20)
  );
}

/**
 * Start summary animation
 * Requires renderOverlay callback for UI updates
 */
export function startSummaryAnimation(
  format: SummaryFormat,
  renderOverlay: () => void
): void {
  contentState.setSummaryAnimationFormat(format);
  if (contentState.getSummaryAnimationTimer() !== null) return;
  contentState.setSummaryAnimationTimer(
    window.setTimeout(() => stepSummaryAnimation(renderOverlay), 0)
  );
}

/**
 * Summarize content with streaming
 * Handles real-time streaming of AI-generated summaries
 * Requires renderOverlay callback for UI updates
 */
export function summarizeWithStreaming(
  content: string,
  format: SummaryFormat,
  detectedLanguage: string | undefined,
  renderOverlay: () => void
): Promise<boolean> {
  if (format === 'headline-bullets') {
    return Promise.resolve(false);
  }

  return new Promise<boolean>((resolve, reject) => {
    contentState.setSummaryBuffer('');
    contentState.setSummary([]);
    contentState.setSummaryDisplay([]);
    contentState.setSummaryAnimationIndex(0);
    contentState.setSummaryStreamComplete(false);
    stopSummaryAnimation();
    let receivedChunk = false;
    let completed = false;

    contentState.getActiveSummaryStreamCleanup()?.();
    contentState.setActiveSummaryStreamCleanup(null);

    const { cancel } = startAIStream(
      'summarize-stream',
      {
        content,
        format,
        detectedLanguage,
      },
      {
        onChunk: (chunk) => {
          if (!chunk) return;
          receivedChunk = true;
          contentState.setSummaryBuffer(
            contentState.getSummaryBuffer() + chunk
          );
          if (contentState.getIsLoadingSummary()) {
            contentState.setIsLoadingSummary(false);
          }
          startSummaryAnimation(format, renderOverlay);
        },
        onComplete: (finalData) => {
          completed = true;
          if (typeof finalData === 'string' && finalData.length > 0) {
            contentState.setSummaryBuffer(finalData);
          }
          const finalSummary = parseSummaryBuffer(
            contentState.getSummaryBuffer(),
            format
          );
          contentState.setSummary(finalSummary);
          contentState.setSummaryStreamComplete(true);
          if (!receivedChunk) {
            startSummaryAnimation(format, renderOverlay);
          } else if (contentState.getSummaryAnimationTimer() === null) {
            contentState.setSummaryDisplay(finalSummary);
            renderOverlay();
          }
          contentState.setIsLoadingSummary(false);
          contentState.setActiveSummaryStreamCleanup(null);
          resolve(
            parseSummaryBuffer(contentState.getSummaryBuffer(), format).length >
              0
          );
        },
        onError: (error) => {
          console.warn('Summarize stream error:', error);
          if (!completed) {
            contentState.setSummaryBuffer('');
          }
          contentState.setActiveSummaryStreamCleanup(null);
          contentState.setSummaryStreamComplete(true);
          if (receivedChunk) {
            resolve(false);
          } else {
            reject(new Error(error));
          }
        },
      }
    );

    contentState.setActiveSummaryStreamCleanup(() => {
      cancel();
      contentState.setActiveSummaryStreamCleanup(null);
    });
  });
}
