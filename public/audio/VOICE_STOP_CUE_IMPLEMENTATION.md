# Voice Stop Audio Cue Implementation

## Overview

This document describes the implementation of the voice stop audio cue feature for the Reflexa AI Chrome Extension.

## Requirements

- **Task:** 10.1 Implement stop recording audio cue
- **Requirements:** 1.4, 1.5
- **Duration:** < 0.3 seconds (implemented as 250ms)
- **Trigger:** Both manual and auto-stop of voice recording
- **Respect Settings:** Only play when `enableSound` is true

## Implementation Details

### Audio File

- **File:** `voice-stop-cue.mp3`
- **Duration:** 250ms (0.25 seconds)
- **Type:** Soft descending tone (800Hz → 400Hz)
- **Volume:** 30% (matches other audio files)
- **Generation:** Created using Python script (`generate_voice_stop_cue.py`)

### AudioManager Updates

The `AudioManager` class was extended to support the voice stop cue:

1. **New Audio Element:**

   ```typescript
   private voiceStopCue: HTMLAudioElement | null = null;
   private isVoiceStopCuePlaying = false;
   ```

2. **New Methods:**
   - `playVoiceStopCue()`: Plays the voice stop audio cue
   - `stopVoiceStopCue()`: Stops the voice stop audio cue
   - `isVoiceStopCuePlayingNow()`: Checks if voice stop cue is playing

3. **Updated Methods:**
   - `loadAudioFiles()`: Loads the voice stop cue audio file
   - `stopAll()`: Includes stopping the voice stop cue
   - `isPlaying()`: Includes checking if voice stop cue is playing
   - `setVolume()`: Sets volume for voice stop cue
   - `cleanup()`: Cleans up voice stop cue resources

### ReflectModeOverlay Updates

The `ReflectModeOverlay` component was updated to play the voice stop cue:

1. **Auto-Stop Handlers:**
   - `handleAutoStop0()`: Plays voice stop cue when auto-stop is triggered for field 0
   - `handleAutoStop1()`: Plays voice stop cue when auto-stop is triggered for field 1

2. **Manual Stop Handler:**
   - `handleVoiceToggle()`: Plays voice stop cue when user manually stops recording

3. **Settings Respect:**
   - All handlers check `settings.enableSound` before playing the audio cue
   - If sound is disabled, the cue is not played

### Constants Updates

Added `VOICE_STOP_CUE_DURATION` to the `AUDIO` constants:

```typescript
VOICE_STOP_CUE_DURATION: 250, // Voice stop cue duration in ms (< 0.3s per requirements)
```

## Usage

### Manual Stop

When the user clicks the voice toggle button to stop recording:

```typescript
if (voiceInput.isRecording) {
  voiceInput.stopRecording();

  // Play voice stop audio cue if sound is enabled
  if (settings.enableSound && audioManagerRef.current) {
    audioManagerRef.current.playVoiceStopCue().catch((err) => {
      console.error('Failed to play voice stop audio cue:', err);
    });
  }
}
```

### Auto-Stop

When the system automatically stops recording after silence:

```typescript
const handleAutoStop = useCallback(() => {
  // Show notification
  setAutoStopNotification(true);

  // Play voice stop audio cue if sound is enabled
  if (settings.enableSound && audioManagerRef.current) {
    audioManagerRef.current.playVoiceStopCue().catch((err) => {
      console.error('Failed to play voice stop audio cue:', err);
    });
  }
}, [settings.enableSound]);
```

## Testing

### Manual Testing

1. Enable sound in settings
2. Open Reflect Mode
3. Click the microphone button to start recording
4. Click the microphone button again to stop recording
5. Verify that a subtle audio cue plays (250ms descending tone)
6. Wait for auto-stop (3 seconds of silence)
7. Verify that the same audio cue plays

### Testing with Sound Disabled

1. Disable sound in settings
2. Repeat the above steps
3. Verify that no audio cue plays

### Browser Compatibility

The audio cue works in all browsers that support:

- HTML5 Audio API
- MP3 format
- Chrome Extension audio playback

## Files Modified

1. `src/utils/audioManager.ts` - Added voice stop cue support
2. `src/content/components/ReflectModeOverlay.tsx` - Added voice stop cue playback
3. `src/constants/index.ts` - Added voice stop cue duration constant
4. `public/audio/voice-stop-cue.mp3` - New audio file
5. `public/audio/voice-stop-cue.wav` - Source audio file (WAV format)

## Files Created

1. `public/audio/generate-voice-stop-cue.html` - HTML generator for audio cue
2. `public/audio/generate-voice-stop-cue.sh` - Shell script generator (requires sox)
3. `public/audio/generate_voice_stop_cue.py` - Python script generator
4. `public/audio/VOICE_STOP_CUE_README.md` - Audio file documentation
5. `public/audio/VOICE_STOP_CUE_IMPLEMENTATION.md` - This file

## Design Rationale

### Why 250ms?

- Requirement specifies < 0.3 seconds (300ms)
- 250ms provides quick feedback without being jarring
- Long enough to be noticeable, short enough to not interrupt flow

### Why Descending Tone?

- Descending tones naturally signal "ending" or "completion"
- Matches user expectations for stop/end actions
- Gentle and non-intrusive

### Why 800Hz → 400Hz?

- Mid-range frequencies are easily heard without being harsh
- Descending sweep creates a smooth, pleasant sound
- Avoids high-pitched tones that can be jarring

### Why 30% Volume?

- Matches the volume of other audio cues in the extension
- Provides consistent audio experience
- Gentle enough to not startle users

## Future Enhancements

- Add user preference for audio cue type (tone, click, etc.)
- Add volume control for individual audio cues
- Add option to disable specific audio cues while keeping others enabled
