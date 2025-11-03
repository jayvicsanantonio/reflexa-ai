/**
 * Content Script Setup
 * Handles initialization and setup of the content script
 */

import type { Settings } from '../../types';
import { contentState } from '../state';
import { instanceManager } from '../core';
import { sendMessageToBackground } from '../runtime/messageBus';
import { applyTranslationPreference } from '../workflows';
import { devLog, devWarn, devError } from '../../utils/logger';

/**
 * Get settings from background worker
 * @returns Settings object
 */
export async function getSettings(): Promise<Settings> {
  const settingsResponse = await sendMessageToBackground<Settings>({
    type: 'getSettings',
  });

  if (settingsResponse.success) {
    return settingsResponse.data;
  } else {
    devError('Failed to load settings:', settingsResponse.error);
    // Return default settings as fallback
    return {
      dwellThreshold: 30,
      enableSound: true,
      reduceMotion: false,
      proofreadEnabled: true,
      privacyMode: 'local',
      useNativeSummarizer: false,
      useNativeProofreader: false,
      translationEnabled: false,
      targetLanguage: 'en',
      defaultSummaryFormat: 'bullets',
      enableProofreading: true,
      enableTranslation: false,
      preferredTranslationLanguage: 'en',
      experimentalMode: false,
      autoDetectLanguage: true,
    };
  }
}

/**
 * Set up listeners for page navigation
 * Resets the dwell tracker when navigating to a new page
 */
export function setupNavigationListeners(): void {
  // Listen for popstate events (back/forward navigation)
  window.addEventListener('popstate', () => {
    instanceManager.resetDwellTracker();
    devLog('Dwell tracker reset due to navigation');
  });

  // Listen for pushState/replaceState (SPA navigation)
  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = function (...args) {
    originalPushState(...args);
    instanceManager.resetDwellTracker();
    devLog('Dwell tracker reset due to pushState');
  };

  history.replaceState = function (...args) {
    originalReplaceState(...args);
    instanceManager.resetDwellTracker();
    devLog('Dwell tracker reset due to replaceState');
  };
}

/**
 * Set up message listener for background worker responses
 * Handles any messages sent from the background worker
 * @param dependencies - Dependencies needed for message handling
 */
export function setupMessageListener(dependencies: {
  applyTranslationPreference: (settings: Settings) => void;
  showNotification: (
    title: string,
    message: string,
    type: 'warning' | 'error' | 'info'
  ) => void;
  renderOverlay: () => void;
  initiateReflectionFlow: () => Promise<void>;
  showDashboardModal: () => Promise<void>;
}): void {
  chrome.runtime.onMessage.addListener(
    (message: unknown, _sender, sendResponse) => {
      try {
        if (message && typeof message === 'object' && 'type' in message) {
          const { type } = message as { type: string };
          if (type === 'settingsUpdated') {
            const updated = (message as { data?: unknown }).data as
              | Settings
              | undefined;
            if (updated) {
              devLog('Applying live settings update:', updated);
              dependencies.applyTranslationPreference(updated);
              // Toast for user feedback
              try {
                dependencies.showNotification('Settings updated', '', 'info');
              } catch {
                // no-op
              }
              // Live-update audio behavior for overlay
              const audioManagerForSettings = instanceManager.getAudioManager();
              if (
                contentState.getOverlayState().isVisible &&
                audioManagerForSettings
              ) {
                if (updated.enableSound) {
                  void audioManagerForSettings.playAmbientLoopGracefully(300);
                } else {
                  void audioManagerForSettings.stopAmbientLoopGracefully(300);
                }
              }

              // If overlay is mounted, re-render via unified renderer to reflect toggles consistently
              const overlayStateMessage = contentState.getOverlayState();
              if (
                overlayStateMessage.isVisible &&
                overlayStateMessage.root &&
                overlayStateMessage.container
              ) {
                dependencies.renderOverlay();
              }
            }
          } else if (type === 'openDashboard') {
            void dependencies.showDashboardModal();
            sendResponse({ success: true });
            return true;
          } else if (type === 'startReflection') {
            // Mirror lotus click behavior
            void (async () => {
              try {
                await dependencies.initiateReflectionFlow();
                sendResponse({ success: true });
              } catch {
                sendResponse({ success: false });
              }
            })();
            return true;
          }
        }
      } catch (e) {
        devWarn('Error handling incoming message in content script:', e);
      }

      sendResponse({ success: true });
      return true;
    }
  );
}

/**
 * Initialize the content script
 * Sets up dwell tracking and prepares for UI injection
 * @param dependencies - Dependencies needed for initialization
 */
export async function initializeContentScript(dependencies: {
  onDwellThresholdReached: () => void;
}): Promise<void> {
  try {
    // Load settings from background worker
    const settings = await getSettings();
    instanceManager.setSettings(settings);
    applyTranslationPreference(settings);

    // Initialize dwell tracker with threshold from settings
    instanceManager.initializeDwellTracker(
      settings.dwellThreshold,
      dependencies.onDwellThresholdReached
    );

    // Set up navigation listeners
    setupNavigationListeners();

    devLog(
      `Dwell tracking started with threshold: ${settings.dwellThreshold}s`
    );
  } catch (error) {
    devError('Failed to initialize content script:', error);
  }
}
