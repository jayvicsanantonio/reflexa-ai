# Implementation Plan

- [x] 1. Create core voice input hook and utilities
  - [x] 1.1 Create `useVoiceInput` custom hook with SpeechRecognition lifecycle management
    - Implement browser support detection for SpeechRecognition and webkitSpeechRecognition
    - Set up recognition instance with continuous mode and interim results enabled
    - Implement state management for recording status, permission state, and errors
    - Add event handlers for result, error, start, end, and speechend events
    - Implement auto-stop timer logic with configurable delay (default 3 seconds)
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [x] 1.2 Implement permission handling and error management
    - Add microphone permission request logic with state tracking
    - Implement error handlers for all SpeechRecognition error types (not-allowed, no-speech, network, aborted)
    - Create user-friendly error messages for each error scenario
    - Add retry logic for transient errors
    - _Requirements: 1.2, 1.8_

  - [x] 1.3 Implement transcript processing logic
    - Handle interim results with temporary state storage
    - Process final results and merge with existing text
    - Add automatic spacing between transcription segments
    - Implement cursor position management during transcription
    - _Requirements: 1.3_

- [x] 2. Create VoiceToggleButton component
  - [x] 2.1 Build button component with recording state visualization
    - Create button with microphone icon for inactive state
    - Implement pulsing red indicator for active recording state
    - Add "Recording..." text label with proper styling
    - Implement state-based icon switching
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 2.2 Add accessibility features to voice button
    - Implement keyboard navigation support (Enter and Space keys)
    - Add dynamic aria-label based on recording state
    - Create tooltip showing current recognition language
    - Ensure 44x44px minimum touch target size
    - Add focus visible styles for keyboard navigation
    - _Requirements: 2.1, 2.3, 2.7_

  - [x] 2.3 Implement reduce motion support
    - Add conditional rendering for pulsing animation based on settings
    - Create static color change alternative for reduce motion mode
    - Ensure all visual feedback works without animation
    - _Requirements: 2.1, 2.7_

- [ ] 3. Create VoiceIndicator component
  - [ ] 3.1 Build visual recording indicator
    - Create pulsing animation with 1-second cycle using CSS
    - Add "Recording..." text label
    - Implement positioning near microphone button
    - Add screen reader accessible label
    - _Requirements: 2.7_

  - [ ] 3.2 Implement reduce motion alternative
    - Add static color change for reduce motion mode
    - Ensure indicator remains visible without animation
    - Maintain 4.5:1 color contrast ratio
    - _Requirements: 2.7_

- [ ] 4. Integrate voice input into ReflectModeOverlay
  - [ ] 4.1 Add voice input state management to overlay
    - Create state for voice input per reflection field (isRecording, interimText)
    - Initialize useVoiceInput hook for each reflection input
    - Implement transcript callback handlers for interim and final results
    - Add error callback handlers with user notifications
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 4.2 Render VoiceToggleButton for each reflection input
    - Add VoiceToggleButton adjacent to each textarea
    - Pass recording state and toggle handlers
    - Conditionally render based on browser support
    - Pass language and reduce motion settings
    - _Requirements: 2.1, 2.2_

  - [ ] 4.3 Implement interim results display
    - Display interim transcription in gray text within input field
    - Update input field value with interim + existing text
    - Clear interim text when final results arrive
    - Maintain cursor position during updates
    - _Requirements: 1.3_

  - [ ] 4.4 Handle voice-to-text merging
    - Append final transcription to existing reflection text
    - Add automatic spacing between segments
    - Preserve manually typed text during voice input
    - Update reflection state with merged content
    - _Requirements: 1.3, 1.6_

- [ ] 5. Implement typing and voice input switching
  - [ ] 5.1 Add typing detection during voice recording
    - Detect keyboard input events during active recording
    - Pause transcription when user starts typing
    - Resume transcription after 2 seconds of no typing
    - Preserve both typed and transcribed text
    - _Requirements: 1.6_

  - [ ] 5.2 Implement chronological text merging
    - Track timestamps for typed and transcribed segments
    - Merge text in chronological order
    - Maintain natural text flow between input modes
    - _Requirements: 1.6_

- [ ] 6. Add auto-stop functionality
  - [ ] 6.1 Implement silence detection and auto-stop
    - Configure auto-stop timer on speech end event
    - Stop recognition session after 3 seconds of silence
    - Finalize any pending interim results
    - Update button state to inactive
    - _Requirements: 1.5_

  - [ ] 6.2 Add auto-stop notification
    - Display brief notification when auto-stop triggers
    - Respect sound settings for audio cue
    - Update voice indicator state
    - _Requirements: 1.5_

- [ ] 7. Implement language support
  - [ ] 7.1 Add language detection and configuration
    - Detect browser default language
    - Read user's language preference from settings
    - Configure SpeechRecognition with selected language
    - Add fallback to English for unsupported languages
    - _Requirements: 1.11_

  - [ ] 7.2 Display current language in UI
    - Add language indicator to voice button tooltip
    - Show notification if language not supported
    - Update language when settings change
    - _Requirements: 1.11_

- [ ] 8. Add privacy notice and metadata
  - [ ] 8.1 Display privacy notice on first use
    - Show "Voice processed by your browser" notice
    - Display on first voice input activation
    - Store flag to prevent repeated notices
    - _Requirements: 1.9_

  - [ ] 8.2 Add voice input metadata to reflections
    - Extend Reflection type with voiceMetadata field
    - Store isVoiceTranscribed flag for each reflection
    - Track transcription language and timestamp
    - Preserve metadata when saving reflections
    - _Requirements: 1.10_

- [ ] 9. Integrate with existing proofread feature
  - [ ] 9.1 Enable proofreading for voice-transcribed text
    - Display proofread button for voice-transcribed reflections
    - Pass voice-transcribed text to Gemini Nano
    - Handle proofread results identically to typed text
    - Store both original and proofread versions
    - _Requirements: 1.10_

- [ ] 10. Add audio feedback
  - [ ] 10.1 Implement stop recording audio cue
    - Add subtle audio cue (<0.3 seconds) when recording stops
    - Respect sound settings from user preferences
    - Play cue for both manual and auto-stop
    - _Requirements: 1.4, 1.5_

- [ ] 11. Add error handling and notifications
  - [ ] 11.1 Implement browser support detection
    - Check for SpeechRecognition API availability
    - Hide voice button if not supported
    - No error message needed (graceful degradation)
    - _Requirements: 1.8_

  - [ ] 11.2 Handle permission denied errors
    - Display notification with permission request message
    - Provide link to browser settings
    - Allow retry after permission grant
    - _Requirements: 1.8_

  - [ ] 11.3 Handle no speech detected errors
    - Set 10-second timeout for speech detection
    - Display notification if no speech detected
    - Auto-stop session and reset button state
    - _Requirements: 1.8_

  - [ ] 11.4 Handle network and abort errors
    - Catch network errors from SpeechRecognition
    - Display fallback notification to use typing
    - Preserve previously transcribed text
    - Log errors for debugging
    - _Requirements: 1.8_

- [ ] 12. Add styling and animations
  - [ ] 12.1 Style VoiceToggleButton component
    - Create button styles matching Reflexa aesthetic
    - Add pulsing animation for recording state
    - Implement hover and focus states
    - Ensure proper spacing and alignment
    - _Requirements: 2.1, 2.2, 2.7_

  - [ ] 12.2 Style VoiceIndicator component
    - Create pulsing dot animation with CSS
    - Style "Recording..." label
    - Position indicator appropriately
    - Add reduce motion alternative styles
    - _Requirements: 2.7_

  - [ ] 12.3 Style interim results display
    - Add gray color for interim transcription text
    - Create smooth transition to final text color
    - Add visual border to input during recording
    - Ensure 4.5:1 contrast ratio
    - _Requirements: 1.3, 2.7_

- [ ] 13. Update Settings type and UI
  - [ ] 13.1 Extend Settings type with voice options
    - Add voiceInputEnabled boolean field (default true)
    - Add voiceLanguage string field (default browser language)
    - Add voiceAutoStopDelay number field (default 3000ms)
    - Update settings schema and validation
    - _Requirements: 1.11_

  - [ ]* 13.2 Add voice settings to options page
    - Create voice input settings section
    - Add toggle for enabling/disabling voice input
    - Add language selector dropdown
    - Add slider for auto-stop delay
    - _Requirements: 1.11_

- [ ]* 14. Write unit tests for voice input functionality
  - Create tests for useVoiceInput hook lifecycle
  - Test state transitions and error handling
  - Test interim and final result processing
  - Test auto-stop timer logic
  - Test VoiceToggleButton component rendering and interactions
  - Test VoiceIndicator component states
  - _Requirements: All_

- [ ]* 15. Write integration tests for voice input flow
  - Test complete voice input flow in Reflect Mode
  - Test permission request and denial handling
  - Test real-time transcription display
  - Test switching between typing and voice
  - Test auto-stop behavior
  - Test error recovery flows
  - _Requirements: All_

- [ ]* 16. Perform accessibility testing
  - Test keyboard navigation to voice button
  - Verify screen reader announcements
  - Test ARIA labels and roles
  - Verify focus management during recording
  - Test color contrast for voice indicator
  - Verify reduce motion compliance
  - _Requirements: 2.1, 2.3, 2.7_

- [ ]* 17. Test browser compatibility
  - Test on Chrome with SpeechRecognition
  - Test on Edge with SpeechRecognition
  - Test on Safari with webkitSpeechRecognition
  - Test on Firefox (verify graceful degradation)
  - Test on mobile browsers (iOS Safari, Chrome Android)
  - _Requirements: 1.8_
