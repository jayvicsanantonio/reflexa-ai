# Audio Assets

This directory contains audio files for the Reflexa AI Chrome Extension.

## Status

✅ **Placeholder audio files have been created** (silent MP3s with correct durations)

These placeholder files allow the extension to run without errors, but they are silent. For production use, replace them with actual audio content following the specifications below.

## Required Audio Files

The following audio files are present in this directory:

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

### Quick Start: Use the Web Audio Generator

Open `generate-audio.html` in your browser to:

- Preview synthesized audio for each sound
- Download basic WAV files
- Convert to MP3 and replace the placeholder files

### Other Options:

1. **Generate sounds using audio synthesis tools**
   - Audacity (free, open source)
   - GarageBand (macOS)
   - FL Studio / Ableton Live (professional)

2. **Source from royalty-free audio libraries**
   - Freesound.org
   - Zapsplat.com
   - BBC Sound Effects
   - YouTube Audio Library

3. **Commission custom audio**
   - Fiverr
   - Upwork
   - SoundBetter

For detailed specifications and requirements, see `AUDIO_REQUIREMENTS.md`.

Ensure all audio files are optimized for web delivery and maintain the Zen aesthetic of the extension.
