# Requirements Document

## Introduction

The Voice Input for Reflections feature extends Reflexa AI's reflection experience by enabling users to speak their reflections instead of typing them. The system leverages the Web Speech API for speech-to-text conversion, providing a hands-free, meditative alternative to keyboard input. This multimodal approach aligns with the extension's wellness-centered philosophy, allowing users to express their thoughts more naturally and fluidly while maintaining the calm, reflective atmosphere of the Reflect Mode interface.

## Glossary

- **Voice_Input_System**: The complete voice recording and transcription functionality integrated into the Reflect Mode overlay
- **Web_Speech_API**: The browser's built-in speech recognition API (specifically SpeechRecognition interface) used for converting spoken words to text
- **Speech_Recognition_Session**: A single continuous period of voice recording and transcription from start to stop
- **Transcription**: The text output generated from the user's spoken words by the Web_Speech_API
- **Voice_Toggle_Button**: The UI control that allows users to switch between typing and voice input modes for reflection answers
- **Interim_Results**: Partial transcription results displayed in real-time as the user speaks, before finalization
- **Final_Results**: The completed transcription text after the user stops speaking or pauses for a sufficient duration
- **Microphone_Permission**: Browser permission required to access the user's microphone for voice recording
- **Voice_Indicator**: Visual feedback element showing that voice recording is active (e.g., pulsing microphone icon)
- **Reflect_Mode**: The full-screen overlay interface where users engage with summaries and write reflections (existing component)

## Requirements

### Requirement 1

**User Story:** As a user writing a reflection, I want to see a microphone button next to each reflection input field, so that I can choose to speak my thoughts instead of typing them.

#### Acceptance Criteria

1. THE Reflect_Mode SHALL display a Voice_Toggle_Button adjacent to each reflection text input area.
2. THE Voice_Toggle_Button SHALL display a microphone icon when voice input is inactive.
3. THE Voice_Toggle_Button SHALL be keyboard accessible and respond to Enter or Space key activation.
4. THE Voice_Toggle_Button SHALL include an aria-label stating "Start voice input" for screen reader users.
5. WHERE the user has enabled the "Reduce Motion" setting, THE Voice_Toggle_Button SHALL not include animated visual effects.

### Requirement 2

**User Story:** As a user, I want to click the microphone button to start recording my voice, so that I can speak my reflection naturally without typing.

#### Acceptance Criteria

1. WHEN the user clicks the Voice_Toggle_Button, THE Voice_Input_System SHALL request Microphone_Permission if not already granted.
2. IF Microphone_Permission is denied, THEN THE Voice_Input_System SHALL display a notification stating "Microphone access required for voice input" and provide a link to browser settings.
3. WHEN Microphone_Permission is granted, THE Voice_Input_System SHALL initialize a Speech_Recognition_Session using the Web_Speech_API.
4. THE Voice_Input_System SHALL set the recognition language to match the browser's default language or user's configured language preference.
5. WHEN voice recording starts, THE Voice_Toggle_Button SHALL change to display a pulsing red indicator and update its aria-label to "Stop voice input".

### Requirement 3

**User Story:** As a user speaking my reflection, I want to see my words appear in real-time as I talk, so that I can verify the transcription is accurate and make corrections if needed.

#### Acceptance Criteria

1. WHILE a Speech_Recognition_Session is active, THE Voice_Input_System SHALL display Interim_Results in the reflection text input field with a subtle gray color.
2. WHEN the Web_Speech_API produces Final_Results, THE Voice_Input_System SHALL replace the Interim_Results with the finalized text in standard text color.
3. THE Voice_Input_System SHALL append new Final_Results to existing text in the input field rather than replacing it.
4. THE Voice_Input_System SHALL automatically insert a space between the existing text and new transcription segments.
5. THE Voice_Input_System SHALL maintain the text cursor position at the end of the input field during active transcription.

### Requirement 4

**User Story:** As a user, I want to click the microphone button again to stop recording, so that I can review and edit the transcribed text before saving.

#### Acceptance Criteria

1. WHEN the user clicks the Voice_Toggle_Button while recording is active, THE Voice_Input_System SHALL stop the Speech_Recognition_Session.
2. WHEN recording stops, THE Voice_Toggle_Button SHALL return to its inactive state with the standard microphone icon.
3. THE Voice_Input_System SHALL finalize any pending Interim_Results as Final_Results when the session stops.
4. WHEN recording stops, THE reflection text input field SHALL become fully editable for manual corrections.
5. THE Voice_Input_System SHALL play a subtle audio cue (less than 0.3 seconds) when recording stops, unless sound is disabled in settings.

### Requirement 5

**User Story:** As a user, I want the system to automatically stop recording after a period of silence, so that I don't have to manually stop it every time I finish speaking.

#### Acceptance Criteria

1. THE Voice_Input_System SHALL configure the Web_Speech_API with continuous mode enabled to capture multiple speech segments.
2. WHEN the user pauses speaking for 3 seconds, THE Voice_Input_System SHALL automatically stop the Speech_Recognition_Session.
3. WHEN auto-stop occurs, THE Voice_Input_System SHALL finalize all transcription and return the Voice_Toggle_Button to inactive state.
4. THE Voice_Input_System SHALL display a brief notification stating "Voice input stopped" when auto-stop is triggered.
5. WHERE the user has disabled sound in settings, THE Voice_Input_System SHALL not play the stop audio cue during auto-stop.

### Requirement 6

**User Story:** As a user, I want to seamlessly switch between typing and speaking, so that I can use whichever input method feels most natural in the moment.

#### Acceptance Criteria

1. THE Voice_Input_System SHALL allow the user to type in the reflection input field while voice recording is active.
2. WHEN the user begins typing during an active Speech_Recognition_Session, THE Voice_Input_System SHALL pause transcription but keep the session active.
3. WHEN the user stops typing for 2 seconds during a paused session, THE Voice_Input_System SHALL resume transcription automatically.
4. THE Voice_Input_System SHALL preserve all manually typed text when switching between input modes.
5. THE Voice_Input_System SHALL merge typed text and transcribed text in chronological order based on input timing.

### Requirement 7

**User Story:** As a user with accessibility needs, I want clear visual feedback about recording status, so that I can tell when the system is listening to my voice.

#### Acceptance Criteria

1. WHILE voice recording is active, THE Voice_Indicator SHALL display a pulsing animation at 1-second intervals.
2. THE Voice_Indicator SHALL include a text label stating "Recording..." visible to screen readers.
3. THE reflection input field SHALL display a colored border (using theme accent color) while voice recording is active.
4. WHERE the user has enabled "Reduce Motion" setting, THE Voice_Indicator SHALL use a static color change instead of pulsing animation.
5. THE Voice_Input_System SHALL maintain a minimum color contrast ratio of 4.5:1 for all voice input UI elements.

### Requirement 8

**User Story:** As a user, I want the system to handle errors gracefully when voice recognition fails, so that I can fall back to typing without losing my progress.

#### Acceptance Criteria

1. IF the Web_Speech_API is not supported in the user's browser, THEN THE Voice_Toggle_Button SHALL not be displayed.
2. IF the Speech_Recognition_Session encounters a network error, THEN THE Voice_Input_System SHALL display a notification stating "Voice recognition unavailable. Please type your reflection."
3. IF the Web_Speech_API returns no speech detected after 10 seconds, THEN THE Voice_Input_System SHALL automatically stop the session and notify the user.
4. WHEN any voice recognition error occurs, THE Voice_Input_System SHALL preserve all previously transcribed text in the input field.
5. THE Voice_Input_System SHALL log all voice recognition errors to the console for debugging purposes.

### Requirement 9

**User Story:** As a privacy-conscious user, I want to know that my voice data is processed locally, so that I can trust the extension with my spoken reflections.

#### Acceptance Criteria

1. THE Voice_Input_System SHALL use only the browser's built-in Web_Speech_API for speech recognition.
2. THE Reflect_Mode SHALL display a privacy notice stating "Voice processed by your browser" when voice input is first activated.
3. THE Voice_Input_System SHALL not transmit audio data to any external servers beyond what the browser's native API requires.
4. THE Voice_Input_System SHALL not store or cache audio recordings at any point during or after transcription.
5. THE Voice_Input_System SHALL only store the final text transcription as part of the reflection data, identical to typed input.

### Requirement 10

**User Story:** As a user, I want voice input to work with the existing proofread feature, so that I can improve my spoken reflections just like typed ones.

#### Acceptance Criteria

1. WHEN a reflection contains voice-transcribed text, THE Reflect_Mode SHALL display the "Proofread" button as it does for typed text.
2. THE Voice_Input_System SHALL mark transcribed text with metadata indicating it originated from voice input.
3. WHEN the user clicks "Proofread" on voice-transcribed text, THE Reflexa_System SHALL send the transcription to Gemini_Nano for grammar and clarity improvements.
4. THE proofreading process SHALL treat voice-transcribed text identically to typed text in terms of processing and display.
5. THE Reflexa_System SHALL store both the original voice transcription and proofread version when the user saves the reflection.

### Requirement 11

**User Story:** As a multilingual user, I want voice input to recognize my preferred language, so that I can speak reflections in languages other than English.

#### Acceptance Criteria

1. THE Voice_Input_System SHALL detect the user's browser language setting and configure the Web_Speech_API accordingly.
2. WHERE the user has configured a preferred language in extension settings, THE Voice_Input_System SHALL use that language for speech recognition.
3. THE Voice_Input_System SHALL support all languages available in the Web_Speech_API (minimum 50 languages).
4. IF the configured language is not supported by the Web_Speech_API, THEN THE Voice_Input_System SHALL fall back to English and notify the user.
5. THE Voice_Input_System SHALL display the current recognition language in the Voice_Toggle_Button tooltip.

### Requirement 12

**User Story:** As a user, I want voice input to perform smoothly without degrading the reflection experience, so that speaking feels as seamless as typing.

#### Acceptance Criteria

1. THE Voice_Input_System SHALL initialize a Speech_Recognition_Session within 500 milliseconds of user activation.
2. THE Voice_Input_System SHALL display Interim_Results with a maximum latency of 300 milliseconds from speech input.
3. THE Voice_Input_System SHALL consume no more than 20 megabytes of additional memory during active voice recording.
4. THE Voice_Indicator animation SHALL maintain 60 frames per second throughout the recording session.
5. THE Voice_Input_System SHALL not cause any visible layout shifts or reflows in the Reflect_Mode overlay when activating or deactivating.
