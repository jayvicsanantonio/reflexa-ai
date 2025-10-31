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

### 1. ReflectModeOverlay ✅

- Full voice input support for both reflection fields
- Chronological text merging (typed + transcribed)
- Auto-pause on typing detection
- Auto-stop after silence

### 2. MeditationFlowOverlay ✅ (Just Added)

- Voice input for both reflection questions (steps 2 & 3)
- Visual feedback when recording (blue border/background)
- Microphone button in top-right of textarea
- Same features as ReflectModeOverlay

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

### Audio Feedback

- Voice stop cue plays when recording ends (if sound enabled)
- Uses AudioManager for consistent audio handling

### Accessibility

- ARIA labels on all buttons
- Screen reader announcements
- Keyboard accessible
- Reduce motion support

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
