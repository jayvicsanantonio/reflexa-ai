/**
 * Hook for managing voice input instances and shared state
 * Handles both voice input instances, voice toggle, error state, and audio cues
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useVoiceInput } from '../../../hooks/useVoiceInput';
import type {
  VoiceInputError,
  UseVoiceInputReturn,
} from '../../../hooks/useVoiceInput';
import { AudioManager } from '../../../../utils/audioManager';
import type { Settings } from '../../../../types';
import { devLog, devError } from '../../../../utils/logger';

/**
 * Configuration for the voice input manager
 */
export interface VoiceInputManagerConfig {
  language: string;
  autoStopDelay: number;
  enableSound: boolean;
  settings: Settings;
}

/**
 * State for a single voice input
 */
export interface VoiceInputState {
  isRecording: boolean;
  interimText: string;
}

/**
 * Return type for useVoiceInputManager hook
 */
export interface VoiceInputManagerResult {
  voiceInputs: [UseVoiceInputReturn, UseVoiceInputReturn];
  voiceInputStates: VoiceInputState[];
  voiceError: VoiceInputError | null;
  clearVoiceError: () => void;
  handleVoiceToggle: (index: 0 | 1) => void;
  autoStopNotification: boolean;
  clearAutoStopNotification: () => void;
  languageFallbackNotification: { show: boolean; languageName: string };
  clearLanguageFallbackNotification: () => void;
}

/**
 * Callback type for handling transcripts
 */
type TranscriptCallback = (text: string, isFinal: boolean) => void;

/**
 * Custom hook for managing both voice input instances and their shared state
 *
 * @example
 * ```tsx
 * const {
 *   voiceInputs,
 *   voiceInputStates,
 *   voiceError,
 *   handleVoiceToggle,
 * } = useVoiceInputManager({
 *   language: 'en-US',
 *   autoStopDelay: 3000,
 *   enableSound: true,
 *   settings,
 * });
 *
 * // Toggle voice input for field 0
 * handleVoiceToggle(0);
 * ```
 */
export function useVoiceInputManager(
  config: VoiceInputManagerConfig,
  onTranscript0: TranscriptCallback,
  onTranscript1: TranscriptCallback
): VoiceInputManagerResult {
  const { language, autoStopDelay, enableSound, settings } = config;

  // Audio manager ref
  const audioManagerRef = useRef<AudioManager | null>(null);

  // Voice input states
  const [voiceInputStates, setVoiceInputStates] = useState<VoiceInputState[]>([
    { isRecording: false, interimText: '' },
    { isRecording: false, interimText: '' },
  ]);

  // Error and notification states
  const [voiceError, setVoiceError] = useState<VoiceInputError | null>(null);
  const [autoStopNotification, setAutoStopNotification] = useState(false);
  const [languageFallbackNotification, setLanguageFallbackNotification] =
    useState<{ show: boolean; languageName: string }>({
      show: false,
      languageName: '',
    });

  // Initialize audio manager
  useEffect(() => {
    audioManagerRef.current = new AudioManager(settings);
    audioManagerRef.current.loadAudioFiles();

    return () => {
      if (audioManagerRef.current) {
        audioManagerRef.current.cleanup();
      }
    };
  }, [settings]);

  // Voice input handlers for field 0
  const handleTranscript0 = useCallback(
    (text: string, isFinal: boolean) => {
      if (isFinal) {
        setVoiceInputStates((prev) => {
          const newStates = [...prev];
          newStates[0] = { ...newStates[0], interimText: '' };
          return newStates;
        });
      } else {
        setVoiceInputStates((prev) => {
          const newStates = [...prev];
          newStates[0] = { ...newStates[0], interimText: text };
          return newStates;
        });
      }
      onTranscript0(text, isFinal);
    },
    [onTranscript0]
  );

  const handleVoiceError0 = useCallback((error: VoiceInputError) => {
    devError('Voice input error (field 0):', error);
    setVoiceError(error);
  }, []);

  const handleAutoStop0 = useCallback(() => {
    devLog('Auto-stop triggered for field 0');
    setAutoStopNotification(true);

    if (enableSound && audioManagerRef.current) {
      audioManagerRef.current.playVoiceStopCue().catch((err) => {
        devError('Failed to play voice stop audio cue:', err);
      });
    }
  }, [enableSound]);

  // Voice input handlers for field 1
  const handleTranscript1 = useCallback(
    (text: string, isFinal: boolean) => {
      if (isFinal) {
        setVoiceInputStates((prev) => {
          const newStates = [...prev];
          newStates[1] = { ...newStates[1], interimText: '' };
          return newStates;
        });
      } else {
        setVoiceInputStates((prev) => {
          const newStates = [...prev];
          newStates[1] = { ...newStates[1], interimText: text };
          return newStates;
        });
      }
      onTranscript1(text, isFinal);
    },
    [onTranscript1]
  );

  const handleVoiceError1 = useCallback((error: VoiceInputError) => {
    devError('Voice input error (field 1):', error);
    setVoiceError(error);
  }, []);

  const handleAutoStop1 = useCallback(() => {
    devLog('Auto-stop triggered for field 1');
    setAutoStopNotification(true);

    if (enableSound && audioManagerRef.current) {
      audioManagerRef.current.playVoiceStopCue().catch((err) => {
        devError('Failed to play voice stop audio cue:', err);
      });
    }
  }, [enableSound]);

  // Create voice input instances
  const voiceInput0 = useVoiceInput({
    language,
    onTranscript: handleTranscript0,
    onError: handleVoiceError0,
    onAutoStop: handleAutoStop0,
    autoStopDelay,
  });

  const voiceInput1 = useVoiceInput({
    language,
    onTranscript: handleTranscript1,
    onError: handleVoiceError1,
    onAutoStop: handleAutoStop1,
    autoStopDelay,
  });

  // Update voice input recording states
  useEffect(() => {
    setVoiceInputStates((prev) => {
      const newStates = [...prev];
      newStates[0] = { ...newStates[0], isRecording: voiceInput0.isRecording };
      newStates[1] = { ...newStates[1], isRecording: voiceInput1.isRecording };
      return newStates;
    });
  }, [voiceInput0.isRecording, voiceInput1.isRecording]);

  // Show notification if language fallback is detected
  useEffect(() => {
    if (voiceInput0.isLanguageFallback || voiceInput1.isLanguageFallback) {
      const languageName = voiceInput0.isLanguageFallback
        ? voiceInput0.languageName
        : voiceInput1.languageName;
      setLanguageFallbackNotification({
        show: true,
        languageName,
      });
    }
  }, [
    voiceInput0.isLanguageFallback,
    voiceInput0.languageName,
    voiceInput1.isLanguageFallback,
    voiceInput1.languageName,
  ]);

  // Voice toggle handler
  const handleVoiceToggle = useCallback(
    (index: 0 | 1) => {
      const voiceInput = index === 0 ? voiceInput0 : voiceInput1;

      devLog(
        `[useVoiceInputManager] Voice toggle clicked for index ${index}, isRecording:`,
        voiceInput.isRecording
      );

      if (voiceInput.isRecording) {
        devLog(`[useVoiceInputManager] Stopping recording for input ${index}`);
        voiceInput.stopRecording();

        // Play voice stop audio cue if sound is enabled
        if (enableSound && audioManagerRef.current) {
          audioManagerRef.current.playVoiceStopCue().catch((err) => {
            devError('Failed to play voice stop audio cue:', err);
          });
        }
      } else {
        devLog(`[useVoiceInputManager] Starting recording for input ${index}`);
        void voiceInput.startRecording().catch((err) => {
          setVoiceError({
            code: 'network',
            message: err instanceof Error ? err.message : 'Voice input failed',
          });
        });
      }
    },
    [voiceInput0, voiceInput1, enableSound]
  );

  // Clear functions
  const clearVoiceError = useCallback(() => {
    setVoiceError(null);
  }, []);

  const clearAutoStopNotification = useCallback(() => {
    setAutoStopNotification(false);
  }, []);

  const clearLanguageFallbackNotification = useCallback(() => {
    setLanguageFallbackNotification({ show: false, languageName: '' });
  }, []);

  return {
    voiceInputs: [voiceInput0, voiceInput1],
    voiceInputStates,
    voiceError,
    clearVoiceError,
    handleVoiceToggle,
    autoStopNotification,
    clearAutoStopNotification,
    languageFallbackNotification,
    clearLanguageFallbackNotification,
  };
}
