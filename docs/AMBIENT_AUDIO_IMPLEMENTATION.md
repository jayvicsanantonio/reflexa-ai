# Ambient Audio Implementation

## Overview

Implemented ambient audio playback for Reflect Mode that plays when the overlay opens and stops when it closes or is saved.

## Changes Made

### 1. Fixed Audio File Path (`src/utils/audioManager.ts`)

- Changed `AMBIENT_LOOP` path from `/audio/ambient-loop.mp3` to `/audio/ambient-loop.wav`
- The actual audio file in the repository is `ambient-loop.wav`, not `.mp3`

### 2. Enhanced Audio Manager Initialization (`src/content/index.tsx`)

- Updated `showReflectModeOverlay()` to pass settings to AudioManager constructor
- Changed from `new AudioManager()` to `new AudioManager(currentSettings)`
- This ensures the AudioManager respects user's sound preferences

### 3. Added Ambient Audio Cleanup (`src/content/index.tsx`)

- Added `audioManager.stopAmbientLoop()` call in `hideReflectModeOverlay()`
- Ensures ambient audio stops when overlay is hidden, regardless of how it was closed
- This provides a safety net in addition to the existing cleanup in save/cancel handlers

## Audio Playback Flow

### When Reflect Mode Opens:

1. AudioManager is initialized with user settings (if sound is enabled)
2. Entry chime plays once
3. Ambient loop starts playing (loops continuously)

### When Reflect Mode Closes:

The ambient loop stops in three scenarios:

1. **User saves reflection**: `handleSaveReflection()` → `audioManager.stopAmbientLoop()`
2. **User cancels**: `handleCancelReflection()` → `audioManager.stopAmbientLoop()`
3. **Overlay hidden**: `hideReflectModeOverlay()` → `audioManager.stopAmbientLoop()`

## User Controls

- Users can toggle ambient audio on/off using the More Tools menu
- The toggle uses graceful fade in/out (400ms) for smooth transitions
- Audio respects the global `enableSound` setting

## Technical Details

### Audio File

- **File**: `public/audio/ambient-loop.wav`
- **Format**: WAV (uncompressed)
- **Size**: ~705 KB
- **Looping**: Enabled via `audio.loop = true`

### Volume

- Default volume: 30% (0.3)
- Defined in `AUDIO.VOLUME` constant
- Applied to all audio elements

### Browser Compatibility

- Uses standard HTML5 Audio API
- Supported in all modern browsers
- Graceful degradation if audio fails to load

## Testing

- Build passes all tests
- Audio file correctly copied to `dist/audio/` folder
- No TypeScript or linting errors
- Integration with existing audio system verified

## Future Enhancements

- Consider adding user-configurable volume control
- Add option to select different ambient tracks
- Implement audio ducking when voice input is active

### 4. Fixed Mute/Unmute Toggle Issue (`src/content/index.tsx`)

- Created `renderOverlay()` helper function to centralize overlay rendering logic
- Fixed issue where mute button state wouldn't update after toggling
- **Problem**: React didn't know to re-render when AudioManager's internal state changed
- **Solution**: Call `renderOverlay()` after toggling ambient audio to trigger a re-render with updated state
- This ensures the mute/unmute button always shows the correct state

## Bug Fix: Mute Toggle Not Working

### Issue

When clicking "Mute" in the More Tools menu, the audio would stop but the button would still show "Mute". Clicking again wouldn't unmute because the button state was out of sync.

### Root Cause

The `ambientMuted` prop was calculated from `audioManager.isAmbientLoopPlayingNow()`, but this value wasn't reactive. When the audio state changed, React had no way to know it should re-render the overlay with the new state.

### Solution

1. Created a `renderOverlay()` helper function that encapsulates all the overlay rendering logic
2. In the `onToggleAmbient` handler, after changing the audio state, we call `renderOverlay()` to force a re-render
3. This ensures the `ambientMuted` prop is recalculated with the latest audio state
4. The mute/unmute button now correctly reflects the current audio state

### Code Pattern

```typescript
const renderOverlay = () => {
  const handleToggleAmbient = async (mute: boolean) => {
    // Toggle audio state
    if (mute) {
      await audioManager.stopAmbientLoopGracefully(400);
    } else {
      await audioManager.playAmbientLoopGracefully(400);
    }
    // Re-render to update UI
    renderOverlay();
  };

  overlayRoot.render(
    <MeditationFlowOverlay
      ambientMuted={audioManager ? !audioManager.isAmbientLoopPlayingNow() : false}
      onToggleAmbient={handleToggleAmbient}
      // ... other props
    />
  );
};
```

## Completion Bell Implementation

### Changes Made

1. **Fixed Audio File Path** (`src/utils/audioManager.ts`)
   - Changed `COMPLETION_BELL` from `/audio/completion-bell.mp3` to `/audio/completion-bell.wav`
   - The actual file in the repository is `.wav`, not `.mp3`

2. **Added Timing Delay** (`src/content/index.tsx`)
   - Added 100ms delay after playing completion bell before hiding overlay
   - This ensures the bell starts playing before the overlay closes
   - The bell continues playing even after the overlay is hidden

### Audio Flow on Save

1. User clicks "Save" button
2. Reflection data is sent to background for storage
3. If save succeeds:
   - Ambient loop stops
   - Completion bell plays
   - Wait 100ms for bell to start
   - Overlay closes
   - Bell continues playing

### File Details

- **File**: `public/audio/completion-bell.wav`
- **Size**: ~138 KB
- **Format**: WAV (uncompressed)
- **Duration**: Short celebratory chime
- **Volume**: 30% (same as other audio)
