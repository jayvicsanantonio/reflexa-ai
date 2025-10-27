# Audio Assets

This directory contains audio files for the Reflexa AI Chrome Extension.

## Required Audio Files

The following audio files need to be added to this directory:

### 1. entry-chime.mp3

- **Duration**: < 1 second
- **Description**: Gentle tone that plays when Reflect Mode is activated
- **Volume**: Played at 30% volume
- **Requirements**: Calming, non-intrusive sound

### 2. ambient-loop.mp3

- **Duration**: 8 seconds
- **Description**: Calming hum that loops continuously during Reflect Mode
- **Volume**: Played at 30% volume
- **Requirements**: Seamless loop, meditative quality

### 3. completion-bell.mp3

- **Duration**: 0.8 seconds
- **Description**: Positive tone that plays when user saves their reflection
- **Volume**: Played at 30% volume
- **Requirements**: Satisfying, completion-oriented sound

## Audio Specifications

- **Format**: MP3 or OGG (compressed for size)
- **Sample Rate**: 44.1 kHz recommended
- **Bit Rate**: 128 kbps or lower for optimal file size
- **Channels**: Mono or Stereo

## Implementation Notes

The AudioManager class (`src/utils/audioManager.ts`) handles:

- Loading audio files with preloading
- Volume control at 30%
- Looping logic for ambient sound
- Respecting user settings (enableSound preference)
- Stopping and cleanup of audio resources

## Generating Audio Assets

You can:

1. Generate sounds using audio synthesis tools
2. Source from royalty-free audio libraries
3. Create custom sounds with audio editing software (Audacity, etc.)

Ensure all audio files are optimized for web delivery and maintain the Zen aesthetic of the extension.
