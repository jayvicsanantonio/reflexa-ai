/**
 * Reflection Actions
 * Handles save, cancel, and format change operations for reflections
 */

import { contentState } from '../state';
import { instanceManager } from '../core';
import { sendMessageToBackground } from '../runtime/messageBus';
import { hideReflectModeOverlay } from './overlayWorkflow';
import { createShowErrorModal } from '../ui';
import { uiManager } from '../ui';
import type {
  Reflection,
  VoiceInputMetadata,
} from '../../types';
import { generateUUID } from '../../utils';
import { ERROR_MESSAGES } from '../../constants';

// Create error modal handler
let showErrorModalHandler: ReturnType<typeof createShowErrorModal> | null =
  null;

// Notification handler - will be injected from index.tsx
let showNotificationHandler: ((
  title: string,
  message: string,
  type: 'warning' | 'error' | 'info'
) => void) | null = null;

export function setNotificationHandler(
  handler: (
    title: string,
    message: string,
    type: 'warning' | 'error' | 'info'
  ) => void
): void {
  showNotificationHandler = handler;
}

function showNotification(
  title: string,
  message: string,
  type: 'warning' | 'error' | 'info'
): void {
  if (showNotificationHandler) {
    showNotificationHandler(title, message, type);
  } else {
    console.warn(`[Notification] ${type}: ${title} - ${message}`);
  }
}

export function setErrorModalHandler(
  handler: ReturnType<typeof createShowErrorModal>
): void {
  showErrorModalHandler = handler;
}

function getShowErrorModal() {
  if (!showErrorModalHandler) {
    showErrorModalHandler = createShowErrorModal(() => {
      uiManager.hideErrorModal();
    });
  }
  return showErrorModalHandler;
}

/**
 * Handle save reflection action
 * Sends reflection data to background worker for storage
 */
export async function handleSaveReflection(
  reflections: string[],
  voiceMetadata?: VoiceInputMetadata[],
  originalReflections?: (string | null)[]
): Promise<void> {
  console.log('Saving reflection...');

  try {
    // Stop ambient audio if playing
    instanceManager.stopAudioManager();

    // Determine if any reflection was proofread
    // If originalReflections has non-null values, it means proofreading was applied
    const hasProofreadVersion = originalReflections?.some(
      (orig) => orig !== null
    );

    // Build the final reflection array
    // Use original versions where available, otherwise use current reflections
    const finalReflections = reflections.map((reflection, index) => {
      const original = originalReflections?.[index];
      return original ?? reflection;
    });

    // Create reflection object
    const reflection: Reflection = {
      id: generateUUID(),
      url: contentState.getExtractedContent()?.url ?? window.location.href,
      title: contentState.getExtractedContent()?.title ?? document.title,
      createdAt: Date.now(),
      summary: contentState.getSummary(),
      reflection: finalReflections,
      proofreadVersion: hasProofreadVersion
        ? reflections.join('\n\n')
        : undefined,
      voiceMetadata,
    };

    // Send to background worker for storage
    const saveResponse = await sendMessageToBackground<void>({
      type: 'save',
      payload: reflection,
    });

    if (!saveResponse.success) {
      console.error('Failed to save reflection:', saveResponse.error);

      // Check if it's a storage full error
      if (saveResponse.error.includes('Storage full')) {
        // Hide overlay first
        hideReflectModeOverlay();

        // Show storage full modal with export option
        getShowErrorModal()(
          'Storage Full',
          ERROR_MESSAGES.STORAGE_FULL,
          'storage-full',
          async () => {
            // Open popup to export reflections
            void chrome.runtime.sendMessage({ type: 'openPopup' });
          },
          'Export Reflections'
        );
        return;
      }

      // Show generic error
      showNotification(
        'Save Failed',
        saveResponse.error || ERROR_MESSAGES.GENERIC_ERROR,
        'error'
      );
      return;
    }

    console.log('Reflection saved successfully');

    // Play completion bell if enabled (before hiding overlay)
    const settingsForBell = instanceManager.getSettings();
    const audioManagerForBell = instanceManager.getAudioManager();
    if (settingsForBell?.enableSound && audioManagerForBell) {
      void audioManagerForBell.playCompletionBell();
    }

    // Wait a brief moment for the completion bell to start playing
    // before hiding the overlay (bell continues playing after overlay closes)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Clean up and hide overlay
    hideReflectModeOverlay();
    contentState.resetReflectionState();

    // Note: showLotusNudge would be called from index.tsx after this
  } catch (error) {
    console.error('Error saving reflection:', error);
    showNotification(
      'Save Error',
      error instanceof Error ? error.message : 'An unexpected error occurred',
      'error'
    );
  }
}

/**
 * Handle cancel reflection action
 * Closes overlay without saving and shows the nudge again
 */
export function handleCancelReflection(): void {
  console.log('Canceling reflection...');

  // Stop ambient audio if playing
  instanceManager.stopAudioManager();

  // Reset reflection state
  contentState.resetReflectionState();

  // Hide overlay
  hideReflectModeOverlay();

  // Show nudge again for next reflection
  // Note: showLotusNudge is still in index.tsx
  // showLotusNudge();
}
