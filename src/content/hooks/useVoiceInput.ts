/**
 * Custom React hook for voice input using Web Speech API
 *
 * @example
 * ```tsx
 * const voiceInput = useVoiceInput({
 *   language: 'en-US',
 *   onTranscript: (text, isFinal) => {
 *     if (isFinal) {
 *       setReflection(prev => prev + ' ' + text);
 *     } else {
 *       setInterimText(text);
 *     }
 *   },
 *   onError: (error) => {
 *     console.error('Voice input error:', error);
 *   },
 *   autoStopDelay: 3000
 * });
 *
 * // Start recording
 * await voiceInput.startRecording();
 *
 * // Stop recording
 * voiceInput.stopRecording();
 * ```
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

/**
 * Voice input error types
 */
export type VoiceInputErrorCode =
  | 'not-supported'
  | 'permission-denied'
  | 'no-speech'
  | 'network'
  | 'aborted';

/**
 * Voice input error structure
 */
export interface VoiceInputError {
  code: VoiceInputErrorCode;
  message: string;
}

/**
 * Voice input status states
 */
export type VoiceInputStatus =
  | 'idle'
  | 'requesting-permission'
  | 'recording'
  | 'stopping'
  | 'error';

/**
 * Options for useVoiceInput hook
 */
export interface UseVoiceInputOptions {
  language?: string;
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (error: VoiceInputError) => void;
  onStatusChange?: (status: VoiceInputStatus) => void;
  autoStopDelay?: number; // default 3000ms
  onTypingDetected?: () => void; // callback when typing is detected during recording
  onAutoStop?: () => void; // callback when auto-stop is triggered
}

/**
 * Return type for useVoiceInput hook
 */
export interface UseVoiceInputReturn {
  isRecording: boolean;
  isSupported: boolean;
  hasPermission: boolean | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  error: VoiceInputError | null;
  status: VoiceInputStatus;
  isPaused: boolean;
}

/**
 * Custom hook for managing voice input using Web Speech API
 * Handles speech recognition lifecycle, permissions, and error management
 */
export const useVoiceInput = (
  options: UseVoiceInputOptions
): UseVoiceInputReturn => {
  const {
    language,
    onTranscript,
    onError,
    onStatusChange,
    autoStopDelay = 3000,
    onTypingDetected,
    onAutoStop,
  } = options;

  // State management
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<VoiceInputError | null>(null);
  const [status, setStatus] = useState<VoiceInputStatus>('idle');

  // Refs for managing recognition instance and timers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const autoStopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isStoppingRef = useRef(false);
  const isPausedRef = useRef(false);

  // Check browser support for SpeechRecognition
  const isSupported = useMemo(() => {
    return (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }, []);

  // Update status and notify callback
  const updateStatus = useCallback(
    (newStatus: VoiceInputStatus) => {
      setStatus(newStatus);
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
    },
    [onStatusChange]
  );

  // Create error object with user-friendly messages
  const createError = useCallback(
    (code: VoiceInputErrorCode, customMessage?: string): VoiceInputError => {
      const messages: Record<VoiceInputErrorCode, string> = {
        'not-supported':
          'Voice input is not supported in your browser. Please use typing instead.',
        'permission-denied':
          'Microphone access required for voice input. Please grant permission in your browser settings.',
        'no-speech': 'No speech detected. Try again or type your reflection.',
        network:
          'Voice recognition unavailable. Please check your connection or type your reflection.',
        aborted: 'Voice input was interrupted. Please try again.',
      };

      return {
        code,
        message: customMessage ?? messages[code],
      };
    },
    []
  );

  // Handle errors and notify callback
  const handleError = useCallback(
    (errorCode: VoiceInputErrorCode, customMessage?: string) => {
      const errorObj = createError(errorCode, customMessage);
      setError(errorObj);
      updateStatus('error');
      if (onError) {
        onError(errorObj);
      }
    },
    [createError, updateStatus, onError]
  );

  // Clear auto-stop timer
  const clearAutoStopTimer = useCallback(() => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  }, []);

  // Start auto-stop timer
  const startAutoStopTimer = useCallback(() => {
    clearAutoStopTimer();
    autoStopTimerRef.current = setTimeout(() => {
      if (recognitionRef.current && isRecording && !isStoppingRef.current) {
        isStoppingRef.current = true;

        // Notify that auto-stop is triggered
        if (onAutoStop) {
          onAutoStop();
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        recognitionRef.current.stop();
      }
    }, autoStopDelay);
  }, [autoStopDelay, isRecording, clearAutoStopTimer, onAutoStop]);

  // Initialize SpeechRecognition instance
  useEffect(() => {
    if (!isSupported) return;

    try {
      // Get the SpeechRecognition constructor
      const SpeechRecognitionConstructor =
        window.SpeechRecognition ?? window.webkitSpeechRecognition;

      if (!SpeechRecognitionConstructor) {
        handleError('not-supported');
        return;
      }

      // Create recognition instance
      const recognition = new SpeechRecognitionConstructor();

      // Configure recognition settings
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language ?? navigator.language ?? 'en-US';
      recognition.maxAlternatives = 1;

      // Handle result event (interim and final results)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        // Skip processing if paused
        if (isPausedRef.current) {
          return;
        }

        let interimTranscript = '';
        let finalTranscript = '';

        // Process all results
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        for (let i = event.resultIndex; i < event.results.length; i++) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          const result = event.results[i];
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          const transcript = result[0].transcript;

          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Send interim results
        if (interimTranscript) {
          onTranscript(interimTranscript, false);
        }

        // Send final results
        if (finalTranscript) {
          onTranscript(finalTranscript, true);
        }

        // Reset auto-stop timer on speech
        if (interimTranscript || finalTranscript) {
          clearAutoStopTimer();
        }
      };

      // Handle start event
      recognition.onstart = () => {
        setIsRecording(true);
        updateStatus('recording');
        setError(null);
        isStoppingRef.current = false;
      };

      // Handle end event
      recognition.onend = () => {
        setIsRecording(false);
        updateStatus('idle');
        clearAutoStopTimer();
        isStoppingRef.current = false;
      };

      // Handle speechend event (user stopped speaking)
      recognition.onspeechend = () => {
        // Start auto-stop timer when speech ends
        startAutoStopTimer();
      };

      // Handle error event
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        clearAutoStopTimer();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            setHasPermission(false);
            handleError('permission-denied');
            break;

          case 'no-speech':
            handleError('no-speech');
            break;

          case 'network':
            handleError('network');
            break;

          case 'aborted':
            // Silent recovery for aborted sessions
            if (!isStoppingRef.current) {
              handleError('aborted');
            }
            break;

          default:
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            handleError('network', `Voice recognition error: ${event.error}`);
        }

        // Stop recording on error
        setIsRecording(false);
        updateStatus('error');
      };

      recognitionRef.current = recognition;

      // Cleanup on unmount
      return () => {
        if (recognitionRef.current) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            recognitionRef.current.stop();
          } catch {
            // Ignore errors during cleanup
          }
        }
        clearAutoStopTimer();
      };
    } catch (err) {
      console.error('Failed to initialize SpeechRecognition:', err);
      handleError('not-supported');
    }
  }, [
    isSupported,
    language,
    onTranscript,
    handleError,
    updateStatus,
    clearAutoStopTimer,
    startAutoStopTimer,
  ]);

  // Start recording function
  const startRecording = useCallback(async () => {
    if (!isSupported) {
      handleError('not-supported');
      return;
    }

    if (!recognitionRef.current) {
      handleError('not-supported', 'Speech recognition not initialized');
      return;
    }

    if (isRecording) {
      return; // Already recording
    }

    try {
      updateStatus('requesting-permission');

      // Request microphone permission
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);
      } catch {
        setHasPermission(false);
        handleError('permission-denied');
        return;
      }

      // Start recognition
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      recognitionRef.current.start();
      setError(null);
    } catch (err) {
      console.error('Failed to start recording:', err);
      handleError('network', 'Failed to start voice input');
    }
  }, [isSupported, isRecording, handleError, updateStatus]);

  // Stop recording function
  const stopRecording = useCallback(() => {
    if (!recognitionRef.current || !isRecording) {
      return;
    }

    try {
      isStoppingRef.current = true;
      updateStatus('stopping');
      clearAutoStopTimer();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      recognitionRef.current.stop();
      setIsPaused(false);
      isPausedRef.current = false;
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setIsRecording(false);
      updateStatus('idle');
      setIsPaused(false);
      isPausedRef.current = false;
    }
  }, [isRecording, updateStatus, clearAutoStopTimer]);

  // Pause recording function (keeps session active but ignores results)
  const pauseRecording = useCallback(() => {
    if (!isRecording || isPausedRef.current) {
      return;
    }

    setIsPaused(true);
    isPausedRef.current = true;
    clearAutoStopTimer();

    if (onTypingDetected) {
      onTypingDetected();
    }
  }, [isRecording, clearAutoStopTimer, onTypingDetected]);

  // Resume recording function
  const resumeRecording = useCallback(() => {
    if (!isRecording || !isPausedRef.current) {
      return;
    }

    setIsPaused(false);
    isPausedRef.current = false;
  }, [isRecording]);

  return {
    isRecording,
    isSupported,
    hasPermission,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    error,
    status,
    isPaused,
  };
};
