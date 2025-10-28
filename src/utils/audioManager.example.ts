/**
 * AudioManager Usage Examples
 *
 * This file demonstrates how to use the AudioManager class
 * in different parts of the Reflexa AI Chrome Extension.
 */

import { AudioManager } from './audioManager';
import type { Settings } from '../types';

// Example 1: Initialize AudioManager with settings
function initializeAudioInContentScript() {
  // Get settings from background worker or storage
  const settings: Settings = {
    dwellThreshold: 1,
    enableSound: true,
    reduceMotion: false,
    proofreadEnabled: false,
    privacyMode: 'local',
  };

  // Create AudioManager instance
  const audioManager = new AudioManager(settings);

  // Preload audio files (optional, but recommended for better performance)
  audioManager.loadAudioFiles();

  return audioManager;
}

// Example 2: Play sounds during Reflect Mode activation
async function activateReflectMode(audioManager: AudioManager) {
  // Play entry chime when overlay appears
  await audioManager.playEntryChime();

  // Start ambient loop for calming background sound
  await audioManager.playAmbientLoop();
}

// Example 3: Handle user saving reflection
async function saveReflection(audioManager: AudioManager) {
  // Stop ambient loop
  audioManager.stopAmbientLoop();

  // Play completion bell
  await audioManager.playCompletionBell();
}

// Example 4: Handle user canceling reflection
function cancelReflection(audioManager: AudioManager) {
  // Stop all audio
  audioManager.stopAll();
}

// Example 5: Update settings when user changes preferences
function updateAudioSettings(
  audioManager: AudioManager,
  newSettings: Settings
) {
  // Update settings - this will stop all audio if sound is disabled
  audioManager.updateSettings(newSettings);
}

// Example 6: Cleanup when component unmounts
function cleanupAudio(audioManager: AudioManager) {
  // Clean up audio resources
  audioManager.cleanup();
}

// Example 7: Typical Reflect Mode flow
async function reflectModeFlow() {
  // 1. Initialize
  const audioManager = initializeAudioInContentScript();

  // 2. User clicks lotus nudge - activate Reflect Mode
  await activateReflectMode(audioManager);

  // 3. User interacts with overlay...
  // (summary displayed, reflection questions answered)

  // 4a. User saves reflection
  await saveReflection(audioManager);

  // OR

  // 4b. User cancels
  // cancelReflection(audioManager);

  // 5. Cleanup when done
  audioManager.cleanup();
}

// Export examples for reference
export {
  initializeAudioInContentScript,
  activateReflectMode,
  saveReflection,
  cancelReflection,
  updateAudioSettings,
  cleanupAudio,
  reflectModeFlow,
};
