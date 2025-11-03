/**
 * Overlay Workflow
 * Handles showing and managing the reflection overlay
 */

import { contentState } from '../state';
import { instanceManager } from '../core';
import { uiManager } from '../ui';
import { performanceMonitor } from '../../utils/performanceMonitor';
import { sendMessageToBackground } from '../runtime/messageBus';
import type { Settings } from '../../types';
import { devLog } from '../../utils/logger';

/**
 * Show the Reflect Mode overlay
 * Creates shadow DOM and renders the overlay component
 * Optimized to minimize layout shifts and track render time
 */
export async function showReflectModeOverlay(): Promise<void> {
  const overlayState = contentState.getOverlayState();
  if (overlayState.isVisible) {
    devLog('Overlay already visible');
    return;
  }

  // Start performance measurement
  performanceMonitor.startMeasure('overlay-render');

  devLog('Showing Reflect Mode overlay...');

  // Load current settings
  const settings = await (async () => {
    const settingsResponse = await sendMessageToBackground<Settings>({
      type: 'getSettings',
    });
    return settingsResponse.success ? settingsResponse.data : null;
  })();

  if (settings) {
    instanceManager.setSettings(settings);
  }

  // Initialize audio manager if sound is enabled
  if (settings?.enableSound) {
    instanceManager.initializeAudioManager(settings);
  }

  // Play entry chime and ambient loop if enabled
  const audioManagerForPlay = instanceManager.getAudioManager();
  if (settings?.enableSound && audioManagerForPlay) {
    void audioManagerForPlay.playEntryChime();
    void audioManagerForPlay.playAmbientLoop();
  }

  // Create overlay container using uiManager
  // Note: renderOverlay is still in index.tsx for now, will be extracted later
  // We need to call renderOverlay from index.tsx after showing overlay
  // For now, we'll create a minimal placeholder
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
  uiManager.showOverlay(React.createElement('div'));

  // End performance measurement
  performanceMonitor.endMeasure('overlay-render');

  // Start frame rate monitoring if animations are enabled
  const settingsForMotion = instanceManager.getSettings();
  if (!settingsForMotion?.reduceMotion) {
    performanceMonitor.startFrameRateMonitoring();
  }

  // Log memory usage
  performanceMonitor.logMemoryUsage();

  devLog('Reflect Mode overlay displayed');
}

/**
 * Hide the Reflect Mode overlay
 * Removes the component and cleans up the DOM
 */
export function hideReflectModeOverlay(): void {
  // Stop ambient audio if playing
  instanceManager.stopAudioManager();

  // Stop frame rate monitoring if active
  performanceMonitor.stopFrameRateMonitoring();

  uiManager.hideOverlay();
}
