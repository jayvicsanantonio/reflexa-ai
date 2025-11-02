/**
 * Instance Manager for content script
 * Centralizes lifecycle management of DwellTracker, ContentExtractor, AudioManager, and Settings
 */

import type { Settings } from '../../types';
import { DwellTracker } from '../features/dwellTracking';
import { ContentExtractor } from '../features/contentExtraction/contentExtractor';
import { AudioManager } from '../../utils/audioManager';

/**
 * Manages lifecycle of core instances used throughout the content script
 */
class InstanceManager {
  private dwellTracker: DwellTracker | null = null;
  private contentExtractor: ContentExtractor | null = null;
  private audioManager: AudioManager | null = null;
  private settings: Settings | null = null;

  /**
   * Initialize dwell tracker with threshold and callback
   */
  initializeDwellTracker(
    threshold: number,
    onThresholdReached: () => void
  ): void {
    // Clean up existing tracker if any
    if (this.dwellTracker) {
      this.dwellTracker.destroy();
      this.dwellTracker = null;
    }

    // Create new tracker
    this.dwellTracker = new DwellTracker(threshold);

    // Register callback
    this.dwellTracker.onThresholdReached(onThresholdReached);

    // Start tracking
    this.dwellTracker.startTracking();
  }

  /**
   * Initialize audio manager with settings
   */
  initializeAudioManager(settings: Settings): void {
    // Clean up existing audio manager if any
    if (this.audioManager) {
      this.audioManager.stopAmbientLoop();
      this.audioManager = null;
    }

    // Create new audio manager if sound is enabled
    if (settings.enableSound) {
      this.audioManager = new AudioManager(settings);
    }
  }

  /**
   * Update settings and apply changes to existing instances
   */
  setSettings(settings: Settings): void {
    this.settings = settings;

    // Update dwell tracker threshold if it exists
    if (this.dwellTracker) {
      this.dwellTracker.setDwellThreshold(settings.dwellThreshold);
      this.dwellTracker.reset();
    }

    // Update or create audio manager based on settings
    if (this.audioManager) {
      this.audioManager.updateSettings(settings);
    } else if (settings.enableSound) {
      this.audioManager = new AudioManager(settings);
    }
  }

  /**
   * Get dwell tracker instance
   */
  getDwellTracker(): DwellTracker | null {
    return this.dwellTracker;
  }

  /**
   * Get content extractor instance (creates if doesn't exist)
   */
  getContentExtractor(): ContentExtractor {
    this.contentExtractor ??= new ContentExtractor();
    return this.contentExtractor;
  }

  /**
   * Get audio manager instance
   */
  getAudioManager(): AudioManager | null {
    return this.audioManager;
  }

  /**
   * Get current settings
   */
  getSettings(): Settings | null {
    return this.settings;
  }

  /**
   * Reset dwell tracker
   */
  resetDwellTracker(): void {
    if (this.dwellTracker) {
      this.dwellTracker.reset();
    }
  }

  /**
   * Stop audio manager ambient loop
   */
  stopAudioManager(): void {
    if (this.audioManager) {
      this.audioManager.stopAmbientLoop();
    }
  }

  /**
   * Cleanup all instances
   */
  cleanup(): void {
    // Destroy dwell tracker
    if (this.dwellTracker) {
      this.dwellTracker.destroy();
      this.dwellTracker = null;
    }

    // Stop audio manager
    if (this.audioManager) {
      this.audioManager.stopAmbientLoop();
      this.audioManager = null;
    }

    // Reset extractor (no cleanup needed, just null it)
    this.contentExtractor = null;

    // Clear settings
    this.settings = null;
  }
}

/**
 * Singleton instance of the instance manager
 */
export const instanceManager = new InstanceManager();
