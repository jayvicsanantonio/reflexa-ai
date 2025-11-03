# Voice Input Implementation

## Overview

Voice input has been successfully integrated into both reflection overlay components, allowing users to either type or speak their reflections.

## Technology

**Web Speech API** (`webkitSpeechRecognition`) - Browser-native speech recognition

- **Not** part of Chrome AI APIs (Gemini Nano)
- Sends audio to Google's cloud servers for transcription
- Widely supported in Chrome/Edge browsers
- No local AI processing required

## Components with Voice Input

### MeditationFlowOverlay ✅

- Voice input for both reflection questions (steps 2 & 3)
- Visual feedback when recording (blue border/background)
- Microphone button in top-right of textarea
- Full voice input support for both reflection fields
- Chronological text merging (typed + transcribed)
- Auto-pause on typing detection
- Auto-stop after silence

## Features

### Smart Text Handling

- **Interim transcription**: Shows real-time transcription as you speak
- **Final transcription**: Appends completed phrases to the text
- **Typing detection**: Auto-pauses voice when user types
- **Auto-resume**: Resumes voice after 2s of no typing

### Auto-Stop

- Configurable delay (default: 3s after silence)
- Audio cue when recording stops (if sound enabled)
- Notification to user

### Language Support

- Uses `settings.voiceLanguage` or falls back to browser language
- 50+ languages supported
- Automatic fallback to English if language unsupported
- Shows language name in button tooltip

### Error Handling

- Permission denied
- No speech detected (10s timeout)
- Network errors
- Browser not supported
- Notifications for all error states

## User Experience

### Visual Indicators

- 🎤 Microphone icon when idle
- "Recording..." text with animated indicator when active
- Blue border/background on textarea during recording
- Interim text shown in lighter color
- Language name displayed in button tooltip

### Audio Feedback

- Voice stop cue plays when recording ends (if sound enabled)
- Uses AudioManager for consistent audio handling
- Plays on both manual stop and auto-stop

### Accessibility

- ARIA labels on all buttons
- Screen reader announcements for recording state
- Keyboard accessible (Space/Enter to toggle)
- Reduce motion support (disables pulse animation)
- Focus indicators on all interactive elements

## MeditationFlowOverlay Specifics

### Dual Voice Input System

MeditationFlowOverlay implements two independent voice input instances:

```typescript
// Voice input for reflection field 0
const voiceInput0 = useVoiceInput({
  language: settings.voiceLanguage ?? navigator.language,
  onTranscript: handleTranscript0,
  onError: handleVoiceError0,
  onAutoStop: handleAutoStop0,
  autoStopDelay: settings.voiceAutoStopDelay ?? 3000,
});

// Voice input for reflection field 1
const voiceInput1 = useVoiceInput({
  language: settings.voiceLanguage ?? navigator.language,
  onTranscript: handleTranscript1,
  onError: handleVoiceError1,
  onAutoStop: handleAutoStop1,
  autoStopDelay: settings.voiceAutoStopDelay ?? 3000,
});
```

### Smart Text Merging

Voice transcriptions are intelligently merged with existing text:

```typescript
const handleTranscript0 = useCallback((text: string, isFinal: boolean) => {
  if (isFinal) {
    setAnswers((prev) => {
      const newAnswers = [...prev];
      const currentText = newAnswers[0] || '';
      // Append with space if there's existing text
      newAnswers[0] = currentText
        ? `${currentText} ${text.trim()}`
        : text.trim();
      return newAnswers;
    });
  } else {
    // Show interim transcription in real-time
    setVoiceInputStates((prev) => {
      const newStates = [...prev];
      newStates[0].interimText = text;
      return newStates;
    });
  }
}, []);
```

### Typing Detection & Auto-Pause

Voice input automatically pauses when user starts typing:

```typescript
onChange={(e) => {
  const newValue = e.target.value;
  const lastValue = lastTextValueRef.current[0];

  // Detect typing and pause voice if recording
  if (
    newValue !== lastValue &&
    voiceInput0.isRecording &&
    !voiceInput0.isPaused
  ) {
    voiceInput0.pauseRecording();

    // Clear existing timer
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    // Resume after 2s of no typing
    typingTimerRef.current = setTimeout(() => {
      if (voiceInput0.isRecording && voiceInput0.isPaused) {
        voiceInput0.resumeRecording();
      }
    }, 2000);
  }

  setAnswers((prev) => [newValue, prev[1] ?? '']);
  lastTextValueRef.current[0] = newValue;
}}
```

### Voice Button Positioning

Voice buttons are positioned in the top-right corner of each textarea:

```css
.reflexa-overlay__reflection-input-wrapper {
  position: relative;
}

.reflexa-voice-toggle {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
}
```

### Integration with MoreToolsMenu

Voice input is also accessible via the MoreToolsMenu on reflection screens:

- Shows "Start Voice Input" when not recording
- Shows "Stop Voice Input" when recording
- Displays current language
- Indicates if language fallback is active

## Settings Integration

Voice input respects these settings:

- `voiceLanguage`: Preferred language for transcription
- `voiceAutoStopDelay`: Milliseconds of silence before auto-stop
- `enableSound`: Whether to play audio cues
- `reduceMotion`: Disables animations on voice button

## Voice Metadata

When reflections are saved, metadata is included:

```typescript
{
  isVoiceTranscribed: boolean;
  transcriptionLanguage?: string;
  transcriptionTimestamp?: number;
  wordCount?: number;
}
```

This allows analytics and future features based on voice usage.

## Browser Support

- ✅ Chrome/Chromium (full support)
- ✅ Edge (full support)
- ✅ Safari (limited support)
- ❌ Firefox (not supported)

The UI gracefully hides voice buttons when not supported.
