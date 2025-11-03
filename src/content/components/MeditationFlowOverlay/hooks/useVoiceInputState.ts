/**
 * Hook for managing voice input state synchronization
 * Synchronizes voice input states from useVoiceInput hooks
 */

import { useState, useEffect } from 'react';
import type { VoiceInputError } from '../../../hooks/useVoiceInput';

export interface VoiceInputState {
  isRecording: boolean;
  interimText: string;
}

export interface UseVoiceInputStateReturn {
  voiceInputStates: VoiceInputState[];
  setVoiceInputStates: (
    states: VoiceInputState[] | ((prev: VoiceInputState[]) => VoiceInputState[])
  ) => void;
  voiceError: VoiceInputError | null;
  setVoiceError: (error: VoiceInputError | null) => void;
  autoStopNotification: boolean;
  setAutoStopNotification: (show: boolean) => void;
}

/**
 * Hook to synchronize voice input states from multiple useVoiceInput hooks
 * The actual voice input instances are managed by the parent component
 */
export function useVoiceInputState(
  voiceInput0Recording: boolean,
  voiceInput1Recording: boolean
): UseVoiceInputStateReturn {
  const [voiceInputStates, setVoiceInputStates] = useState<VoiceInputState[]>([
    { isRecording: false, interimText: '' },
    { isRecording: false, interimText: '' },
  ]);
  const [voiceError, setVoiceError] = useState<VoiceInputError | null>(null);
  const [autoStopNotification, setAutoStopNotification] =
    useState<boolean>(false);

  // Update voice input recording states when they change
  useEffect(() => {
    setVoiceInputStates((prev) => {
      const newStates = [...prev];
      newStates[0].isRecording = voiceInput0Recording;
      newStates[1].isRecording = voiceInput1Recording;
      return newStates;
    });
  }, [voiceInput0Recording, voiceInput1Recording]);

  return {
    voiceInputStates,
    setVoiceInputStates,
    voiceError,
    setVoiceError,
    autoStopNotification,
    setAutoStopNotification,
  };
}
