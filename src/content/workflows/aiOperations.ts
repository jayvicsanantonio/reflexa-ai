/**
 * AI Operations Handlers
 * Handles all AI-related operations: proofreading, translation, rewriting, format changes
 */

import { contentState } from '../state';
import { sendMessageToBackground } from '../runtime/messageBus';
import type {
  ProofreadResult,
  LanguageDetection,
  TonePreset,
  SummaryFormat,
} from '../../types';
import { getLanguageName } from '../../utils/translationHelpers';
import { devLog, devWarn, devError } from '../../utils/logger';

/**
 * Handle proofread request
 * Sends text to background worker for AI proofreading
 */
export async function handleProofread(
  text: string,
  index: number
): Promise<ProofreadResult> {
  devLog(`Proofreading reflection ${index}...`);

  try {
    // Determine expected language for proofreading
    const expectedLanguage =
      contentState.getSelectedTargetLanguage() ??
      contentState.getOriginalDetectedLanguage() ??
      'en';

    const proofreadResponse = await sendMessageToBackground<ProofreadResult>({
      type: 'proofread',
      payload: {
        text,
        expectedLanguage,
      },
    });

    if (proofreadResponse.success) {
      devLog('Proofread completed');
      let result = proofreadResponse.data;

      // Ensure proofread output is in selected target language, if any
      if (contentState.getSelectedTargetLanguage() && result.correctedText) {
        try {
          const detect = await sendMessageToBackground<LanguageDetection>({
            type: 'detectLanguage',
            payload: {
              text: result.correctedText.substring(0, 500),
              pageUrl: contentState.getExtractedContent()?.url ?? location.href,
            },
          });
          const sourceLang = detect.success
            ? detect.data.detectedLanguage
            : (contentState.getOriginalDetectedLanguage() ?? 'en');
          if (sourceLang !== contentState.getSelectedTargetLanguage()) {
            const tr = await sendMessageToBackground<string>({
              type: 'translate',
              payload: {
                text: result.correctedText,
                source: sourceLang,
                target: contentState.getSelectedTargetLanguage() ?? 'en',
              },
            });
            if (tr.success) {
              result = { ...result, correctedText: tr.data };
            }
          }
        } catch (e) {
          devWarn('Proofread translation skipped due to error:', e);
        }
      }

      return result;
    } else {
      devError('Proofread failed:', proofreadResponse.error);
      throw new Error(proofreadResponse.error);
    }
  } catch (error) {
    devError('Error proofreading:', error);
    throw error;
  }
}

/**
 * Handle translate request
 * Translates summary and prompts to target language
 */
export async function handleTranslate(targetLanguage: string): Promise<void> {
  devLog('Translating to:', targetLanguage);

  const currentSummary = contentState.getSummary();
  const currentPrompts = contentState.getPrompts();
  const originalLanguage = contentState.getOriginalDetectedLanguage() ?? 'en';

  contentState.setIsTranslating(true);
  contentState.setSelectedTargetLanguage(targetLanguage);

  try {
    // Translate summary
    const summaryPromises = currentSummary.map((item) =>
      sendMessageToBackground<string>({
        type: 'translate',
        payload: {
          text: item,
          source: originalLanguage,
          target: targetLanguage,
        },
      })
    );

    const summaryResponses = await Promise.all(summaryPromises);
    const translatedSummary = summaryResponses.map((response, index) =>
      response.success
        ? response.data
        : `Translation failed for summary item ${index}`
    );

    // Translate prompts
    const promptPromises = currentPrompts.map((prompt) =>
      sendMessageToBackground<string>({
        type: 'translate',
        payload: {
          text: prompt,
          source: originalLanguage,
          target: targetLanguage,
        },
      })
    );

    const promptResponses = await Promise.all(promptPromises);
    const translatedPrompts = promptResponses.map((response, index) =>
      response.success
        ? response.data
        : `Translation failed for prompt ${index}`
    );

    // Update state with translations
    contentState.setSummary(translatedSummary);
    contentState.setSummaryDisplay(translatedSummary);
    contentState.setPrompts(translatedPrompts);

    // Update language detection to reflect translated language
    contentState.setLanguageDetection({
      detectedLanguage: targetLanguage,
      confidence: 1,
      languageName: getLanguageName(targetLanguage),
    });

    // Re-render overlay with translated content
    // Note: renderOverlay is still in index.tsx, will be extracted later
    // renderOverlay();
  } catch (error) {
    devError('Translation error:', error);
    contentState.setIsTranslating(false);
    throw error;
  } finally {
    contentState.setIsTranslating(false);
  }
}

/**
 * Handle translate to English request
 * Translates summary and prompts to English
 */
export async function handleTranslateToEnglish(): Promise<void> {
  devLog('Translating to English...');

  const currentSummary = contentState.getSummary();
  const currentPrompts = contentState.getPrompts();
  const originalLanguage = contentState.getOriginalDetectedLanguage() ?? 'en';

  if (originalLanguage === 'en') {
    devLog('Content is already in English');
    return;
  }

  contentState.setIsTranslating(true);
  contentState.setSelectedTargetLanguage('en');

  try {
    // Translate summary
    const summaryPromises = currentSummary.map((item) =>
      sendMessageToBackground<string>({
        type: 'translate',
        payload: {
          text: item,
          source: originalLanguage,
          target: 'en',
        },
      })
    );

    const summaryResponses = await Promise.all(summaryPromises);
    const translatedSummary = summaryResponses.map((response, index) =>
      response.success
        ? response.data
        : `Translation failed for summary item ${index}`
    );

    // Translate prompts
    const promptPromises = currentPrompts.map((prompt) =>
      sendMessageToBackground<string>({
        type: 'translate',
        payload: {
          text: prompt,
          source: originalLanguage,
          target: 'en',
        },
      })
    );

    const promptResponses = await Promise.all(promptPromises);
    const translatedPrompts = promptResponses.map((response, index) =>
      response.success
        ? response.data
        : `Translation failed for prompt ${index}`
    );

    // Update state with translations
    contentState.setSummary(translatedSummary);
    contentState.setSummaryDisplay(translatedSummary);
    contentState.setPrompts(translatedPrompts);

    // Update language detection to English
    contentState.setLanguageDetection({
      detectedLanguage: 'en',
      confidence: 1,
      languageName: getLanguageName('en'),
    });

    // Re-render overlay with translated content
    // Note: renderOverlay is still in index.tsx, will be extracted later
    // renderOverlay();
  } catch (error) {
    devError('Translation to English error:', error);
    contentState.setIsTranslating(false);
    throw error;
  } finally {
    contentState.setIsTranslating(false);
  }
}

/**
 * Handle rewrite request
 * Rewrites text with selected tone preset
 */
export async function handleRewrite(
  text: string,
  tone: TonePreset,
  index: number
): Promise<{ original: string; rewritten: string }> {
  devLog(`Rewriting reflection ${index} with tone: ${tone}...`);

  contentState.setIsRewriting(index, true);

  try {
    // Build context from summary and reflection prompt
    const contextParts: string[] = [];

    const summary = contentState.getSummary();
    if (summary?.length > 0) {
      contextParts.push(`Summary: ${summary.join(' ')}`);
    }

    const prompts = contentState.getPrompts();
    if (prompts?.[index]) {
      contextParts.push(`Reflection prompt: ${prompts[index]}`);
    }

    const context =
      contextParts.length > 0 ? contextParts.join('\n\n') : undefined;

    const rewriteResponse = await sendMessageToBackground<{
      original: string;
      rewritten: string;
    }>({
      type: 'rewrite',
      payload: {
        text,
        tone,
        context,
      },
    });

    if (rewriteResponse.success) {
      devLog('Rewrite completed');
      return rewriteResponse.data;
    } else {
      devError('Rewrite failed:', rewriteResponse.error);
      throw new Error(rewriteResponse.error);
    }
  } catch (error) {
    devError('Error rewriting:', error);
    throw error;
  } finally {
    contentState.setIsRewriting(index, false);
  }
}

/**
 * Handle summary format change
 * Re-requests summary with new format from background worker
 */
export async function handleFormatChange(
  format: SummaryFormat,
  renderOverlay: () => void,
  showNotification: (
    title: string,
    message: string,
    type: 'warning' | 'error' | 'info'
  ) => void,
  stopSummaryAnimation: () => void
): Promise<void> {
  if (
    !contentState.getExtractedContent() ||
    contentState.getIsLoadingSummary()
  ) {
    return;
  }

  devLog(`Changing summary format to: ${format}`);
  contentState.setSummaryFormat(format);
  contentState.setIsLoadingSummary(true);

  // Note: Re-rendering with loading state would be handled by caller
  // This function focuses on the format change logic

  try {
    // Request new summary with selected format
    // Pass detected language to maintain source language when translation is disabled
    const summaryResponse = await sendMessageToBackground<string[]>({
      type: 'summarize',
      payload: {
        content: contentState.getExtractedContent()?.text ?? '',
        format: format,
        detectedLanguage: contentState.getLanguageDetection()?.detectedLanguage,
      },
    });

    if (summaryResponse.success) {
      let newSummary = summaryResponse.data;
      // If the user selected a target language, translate the freshly
      // generated summary to that language.
      if (contentState.getSelectedTargetLanguage()) {
        const translated: string[] = [];
        for (const item of newSummary) {
          const tr = await sendMessageToBackground<string>({
            type: 'translate',
            payload: {
              text: item,
              source: contentState.getOriginalDetectedLanguage() ?? 'en',
              target: contentState.getSelectedTargetLanguage() ?? 'en',
            },
          });
          translated.push(tr.success ? tr.data : item);
        }
        newSummary = translated;
      }
      contentState.setSummary(newSummary);
      contentState.setSummaryDisplay(newSummary);
      stopSummaryAnimation();
      contentState.setSummaryStreamComplete(true);
      devLog('Summary updated with new format:', contentState.getSummary());
    } else {
      devError('Failed to update summary format:', summaryResponse.error);
      // Keep existing summary on error
      showNotification(
        'Format Change Failed',
        'Could not update summary format. Using previous format.',
        'error'
      );
    }
  } catch (error) {
    devError('Error changing format:', error);
    showNotification(
      'Format Change Failed',
      'An error occurred while changing format.',
      'error'
    );
  } finally {
    contentState.setIsLoadingSummary(false);
    // Re-render overlay with updated summary
    renderOverlay();
  }
}
