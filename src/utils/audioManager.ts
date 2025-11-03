/**
 * AudioManager - Handles sound playback for Reflexa AI
 * Manages entry chime, ambient loop, and completion bell sounds
 */

import { AUDIO } from '../constants';
import type { Settings } from '../types';
import { devWarn, devError } from './logger';

/**
 * Audio file paths relative to extension root
 */
const AUDIO_FILES = {
  ENTRY_CHIME: '/audio/entry-chime.mp3',
  AMBIENT_LOOP: '/audio/ambient-loop.wav',
  COMPLETION_BELL: '/audio/completion-bell.wav',
  VOICE_STOP_CUE: '/audio/voice-stop-cue.mp3',
} as const;

/**
 * AudioManager class for handling all audio playback
 */
export class AudioManager {
  private entryChime: HTMLAudioElement | null = null;
  private ambientLoop: HTMLAudioElement | null = null;
  private completionBell: HTMLAudioElement | null = null;
  private voiceStopCue: HTMLAudioElement | null = null;
  private settings: Settings | null = null;
  private isLoaded = false;
  private isEntryChimePlaying = false;
  private isAmbientLoopPlaying = false;
  private isCompletionBellPlaying = false;
  private isVoiceStopCuePlaying = false;

  /**
   * Initialize the AudioManager with user settings
   * @param settings User settings containing enableSound preference
   */
  constructor(settings?: Settings) {
    this.settings = settings ?? null;
  }

  /**
   * Load all audio files
   * Creates Audio elements with lazy loading (preload='none')
   * Audio files are only loaded when first played
   */
  loadAudioFiles(): void {
    if (this.isLoaded) return;

    try {
      // Verify chrome.runtime is available
      if (!chrome?.runtime?.getURL) {
        devWarn('Chrome runtime not available, skipping audio load');
        return;
      }

      // Create audio elements
      const entryChimeUrl = chrome.runtime.getURL(AUDIO_FILES.ENTRY_CHIME);
      const ambientLoopUrl = chrome.runtime.getURL(AUDIO_FILES.AMBIENT_LOOP);
      const completionBellUrl = chrome.runtime.getURL(
        AUDIO_FILES.COMPLETION_BELL
      );
      const voiceStopCueUrl = chrome.runtime.getURL(AUDIO_FILES.VOICE_STOP_CUE);

      // Validate URLs before creating Audio elements
      if (
        !entryChimeUrl ||
        entryChimeUrl.includes('invalid') ||
        !ambientLoopUrl ||
        ambientLoopUrl.includes('invalid') ||
        !completionBellUrl ||
        completionBellUrl.includes('invalid') ||
        !voiceStopCueUrl ||
        voiceStopCueUrl.includes('invalid')
      ) {
        devWarn('Invalid audio URLs, skipping audio load');
        return;
      }

      this.entryChime = new Audio(entryChimeUrl);
      this.ambientLoop = new Audio(ambientLoopUrl);
      this.completionBell = new Audio(completionBellUrl);
      this.voiceStopCue = new Audio(voiceStopCueUrl);

      // Set volume to 30% for all audio elements
      this.entryChime.volume = AUDIO.VOLUME;
      this.ambientLoop.volume = AUDIO.VOLUME;
      this.completionBell.volume = AUDIO.VOLUME;
      this.voiceStopCue.volume = AUDIO.VOLUME;

      // Enable looping for ambient sound
      this.ambientLoop.loop = true;

      // Lazy load audio files - only load when first played
      this.entryChime.preload = 'none';
      this.ambientLoop.preload = 'none';
      this.completionBell.preload = 'none';
      this.voiceStopCue.preload = 'none';

      this.isLoaded = true;
    } catch (error) {
      devError('Failed to load audio files:', error);
      this.isLoaded = false;
    }
  }

  /**
   * Update settings (e.g., when user changes preferences)
   * @param settings Updated settings object
   */
  updateSettings(settings: Settings): void {
    this.settings = settings;

    // If sound is disabled, stop all currently playing audio
    if (!settings.enableSound) {
      this.stopAll();
    }
  }

  /**
   * Check if audio should be played based on settings
   * @returns True if audio is enabled in settings
   */
  private shouldPlayAudio(): boolean {
    return this.settings?.enableSound ?? true;
  }

  /**
   * Play the entry chime sound
   * Plays when Reflect Mode is activated
   */
  async playEntryChime(): Promise<void> {
    if (!this.shouldPlayAudio()) return;

    if (!this.isLoaded) {
      this.loadAudioFiles();
    }

    try {
      if (this.entryChime) {
        this.isEntryChimePlaying = true;
        this.entryChime.currentTime = 0; // Reset to start

        // Track when audio ends
        this.entryChime.addEventListener(
          'ended',
          () => {
            this.isEntryChimePlaying = false;
          },
          { once: true }
        );

        await this.entryChime.play();
      }
    } catch (error) {
      devError('Failed to play entry chime:', error);
      this.isEntryChimePlaying = false;
    }
  }

  /**
   * Play the ambient loop sound
   * Loops continuously while Reflect Mode is active
   */
  async playAmbientLoop(): Promise<void> {
    if (!this.shouldPlayAudio()) return;

    if (!this.isLoaded) {
      this.loadAudioFiles();
    }

    try {
      if (this.ambientLoop) {
        this.isAmbientLoopPlaying = true;
        this.ambientLoop.currentTime = 0; // Reset to start

        // Track when audio ends (though it loops, track for stop events)
        this.ambientLoop.addEventListener(
          'pause',
          () => {
            this.isAmbientLoopPlaying = false;
          },
          { once: true }
        );

        await this.ambientLoop.play();
      }
    } catch (error) {
      devError('Failed to play ambient loop:', error);
      this.isAmbientLoopPlaying = false;
    }
  }

  /**
   * Play the completion bell sound
   * Plays when user saves their reflection
   */
  async playCompletionBell(): Promise<void> {
    if (!this.shouldPlayAudio()) return;

    if (!this.isLoaded) {
      this.loadAudioFiles();
    }

    try {
      if (this.completionBell) {
        this.isCompletionBellPlaying = true;
        this.completionBell.currentTime = 0; // Reset to start

        // Track when audio ends
        this.completionBell.addEventListener(
          'ended',
          () => {
            this.isCompletionBellPlaying = false;
          },
          { once: true }
        );

        await this.completionBell.play();
      }
    } catch (error) {
      devError('Failed to play completion bell:', error);
      this.isCompletionBellPlaying = false;
    }
  }

  /**
   * Play the voice stop cue sound
   * Plays when voice recording stops (manual or auto-stop)
   * Duration: 250ms (< 0.3 seconds as per requirements)
   */
  async playVoiceStopCue(): Promise<void> {
    if (!this.shouldPlayAudio()) return;

    if (!this.isLoaded) {
      this.loadAudioFiles();
    }

    try {
      if (this.voiceStopCue) {
        this.isVoiceStopCuePlaying = true;
        this.voiceStopCue.currentTime = 0; // Reset to start

        // Track when audio ends
        this.voiceStopCue.addEventListener(
          'ended',
          () => {
            this.isVoiceStopCuePlaying = false;
          },
          { once: true }
        );

        await this.voiceStopCue.play();
      }
    } catch (error) {
      devError('Failed to play voice stop cue:', error);
      this.isVoiceStopCuePlaying = false;
    }
  }

  /**
   * Stop the entry chime sound
   */
  stopEntryChime(): void {
    if (this.entryChime) {
      this.entryChime.pause();
      this.entryChime.currentTime = 0;
      this.isEntryChimePlaying = false;
    }
  }

  /**
   * Stop the ambient loop sound
   */
  stopAmbientLoop(): void {
    if (this.ambientLoop) {
      this.ambientLoop.pause();
      this.ambientLoop.currentTime = 0;
      this.isAmbientLoopPlaying = false;
    }
  }

  /**
   * Stop the completion bell sound
   */
  stopCompletionBell(): void {
    if (this.completionBell) {
      this.completionBell.pause();
      this.completionBell.currentTime = 0;
      this.isCompletionBellPlaying = false;
    }
  }

  /**
   * Stop the voice stop cue sound
   */
  stopVoiceStopCue(): void {
    if (this.voiceStopCue) {
      this.voiceStopCue.pause();
      this.voiceStopCue.currentTime = 0;
      this.isVoiceStopCuePlaying = false;
    }
  }

  /**
   * Stop all currently playing audio
   */
  stopAll(): void {
    this.stopEntryChime();
    this.stopAmbientLoop();
    this.stopCompletionBell();
    this.stopVoiceStopCue();
  }

  /**
   * Check if any audio is currently playing
   * @returns True if any audio is playing
   */
  isPlaying(): boolean {
    return (
      this.isEntryChimePlaying ||
      this.isAmbientLoopPlaying ||
      this.isCompletionBellPlaying ||
      this.isVoiceStopCuePlaying
    );
  }

  /**
   * Check if entry chime is currently playing
   * @returns True if entry chime is playing
   */
  isEntryChimePlayingNow(): boolean {
    return this.isEntryChimePlaying;
  }

  /**
   * Check if ambient loop is currently playing
   * @returns True if ambient loop is playing
   */
  isAmbientLoopPlayingNow(): boolean {
    return this.isAmbientLoopPlaying;
  }

  /**
   * Check if completion bell is currently playing
   * @returns True if completion bell is playing
   */
  isCompletionBellPlayingNow(): boolean {
    return this.isCompletionBellPlaying;
  }

  /**
   * Check if voice stop cue is currently playing
   * @returns True if voice stop cue is playing
   */
  isVoiceStopCuePlayingNow(): boolean {
    return this.isVoiceStopCuePlaying;
  }

  /**
   * Set volume for all audio elements
   * @param volume Volume level between 0.0 (mute) and 1.0 (full volume)
   */
  setVolume(volume: number): void {
    // Clamp volume between 0 and 1
    const clampedVolume = Math.max(0, Math.min(1, volume));

    if (this.entryChime) {
      this.entryChime.volume = clampedVolume;
    }
    if (this.ambientLoop) {
      this.ambientLoop.volume = clampedVolume;
    }
    if (this.completionBell) {
      this.completionBell.volume = clampedVolume;
    }
    if (this.voiceStopCue) {
      this.voiceStopCue.volume = clampedVolume;
    }
  }

  /**
   * Get current volume level
   * @returns Current volume (0.0 to 1.0), or default if not loaded
   */
  getVolume(): number {
    if (this.entryChime) {
      return this.entryChime.volume;
    }
    return AUDIO.VOLUME; // Return default if not loaded
  }

  /**
   * Fade out audio element
   * @param audio Audio element to fade out
   * @param duration Fade duration in milliseconds (default: 500ms)
   * @returns Promise that resolves when fade is complete
   */
  private fadeOut(audio: HTMLAudioElement, duration = 500): Promise<void> {
    return new Promise((resolve) => {
      const startVolume = audio.volume;
      const fadeStep = startVolume / (duration / 10);

      const fadeInterval = setInterval(() => {
        if (audio.volume > fadeStep) {
          audio.volume = Math.max(0, audio.volume - fadeStep);
        } else {
          audio.volume = 0;
          audio.pause();
          audio.currentTime = 0;
          audio.volume = startVolume; // Restore original volume
          clearInterval(fadeInterval);
          resolve();
        }
      }, 10);
    });
  }

  /**
   * Fade in audio element
   * @param audio Audio element to fade in
   * @param targetVolume Target volume to reach (default: current volume)
   * @param duration Fade duration in milliseconds (default: 500ms)
   * @returns Promise that resolves when fade is complete
   */
  private async fadeIn(
    audio: HTMLAudioElement,
    targetVolume = AUDIO.VOLUME,
    duration = 500
  ): Promise<void> {
    audio.volume = 0;
    await audio.play();

    return new Promise((resolve) => {
      const fadeStep = targetVolume / (duration / 10);

      const fadeInterval = setInterval(() => {
        if (audio.volume < targetVolume - fadeStep) {
          audio.volume = Math.min(targetVolume, audio.volume + fadeStep);
        } else {
          audio.volume = targetVolume;
          clearInterval(fadeInterval);
          resolve();
        }
      }, 10);
    });
  }

  /**
   * Stop ambient loop with smooth fade out
   * @param duration Fade duration in milliseconds (default: 500ms)
   */
  async stopAmbientLoopGracefully(duration = 500): Promise<void> {
    if (this.ambientLoop && this.isAmbientLoopPlaying) {
      await this.fadeOut(this.ambientLoop, duration);
      this.isAmbientLoopPlaying = false;
    }
  }

  /**
   * Play ambient loop with smooth fade in
   * @param duration Fade duration in milliseconds (default: 500ms)
   */
  async playAmbientLoopGracefully(duration = 500): Promise<void> {
    if (!this.shouldPlayAudio()) return;

    if (!this.isLoaded) {
      this.loadAudioFiles();
    }

    try {
      if (this.ambientLoop) {
        this.isAmbientLoopPlaying = true;
        this.ambientLoop.currentTime = 0;

        // Track when audio ends
        this.ambientLoop.addEventListener(
          'pause',
          () => {
            this.isAmbientLoopPlaying = false;
          },
          { once: true }
        );

        await this.fadeIn(this.ambientLoop, AUDIO.VOLUME, duration);
      }
    } catch (error) {
      devError('Failed to play ambient loop with fade:', error);
      this.isAmbientLoopPlaying = false;
    }
  }

  /**
   * Clean up audio resources
   * Should be called when AudioManager is no longer needed
   */
  cleanup(): void {
    this.stopAll();
    this.entryChime = null;
    this.ambientLoop = null;
    this.completionBell = null;
    this.voiceStopCue = null;
    this.isLoaded = false;
  }
}
