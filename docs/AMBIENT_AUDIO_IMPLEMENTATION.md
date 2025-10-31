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
