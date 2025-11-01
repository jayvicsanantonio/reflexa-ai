# Voice Stop Audio Cue

## Overview

This audio file provides a subtle auditory feedback when voice recording stops (both manual and auto-stop).

## Specifications

- **Duration:** 250ms (0.25 seconds) - must be < 0.3 seconds per requirements
- **Type:** Soft descending tone
- **Frequency:** 800Hz → 400Hz (descending sweep)
- **Volume:** 30% (gentle, non-intrusive)
- **Format:** MP3
- **Purpose:** Signal the end of voice recording without being jarring

## Generation Methods

### Method 1: Using the HTML Generator (Recommended)

1. Open `generate-voice-stop-cue.html` in a web browser
2. Click "Generate Audio Cue"
3. Click "Download MP3" (will download as WAV)
4. Convert WAV to MP3 using an online converter or ffmpeg:
   ```bash
   ffmpeg -i voice-stop-cue.wav -codec:a libmp3lame -b:a 128k voice-stop-cue.mp3
   ```

### Method 2: Using sox (Command Line)

If you have sox installed:

```bash
./generate-voice-stop-cue.sh
```

Or manually:

```bash
sox -n -r 44100 -c 1 voice-stop-cue.mp3 synth 0.25 sine 800-400 fade 0 0.25 0.15 vol 0.3
```

### Method 3: Using ffmpeg

```bash
ffmpeg -f lavfi -i "sine=frequency=800:duration=0.25" \
  -af "aeval=val(0)*exp(-10*t):c=same,volume=0.3" \
  voice-stop-cue.mp3
```

## Installation

Install sox (if using Method 2):

- **macOS:** `brew install sox`
- **Ubuntu/Debian:** `sudo apt-get install sox libsox-fmt-mp3`
- **Windows:** Download from https://sourceforge.net/projects/sox/

## Usage in Code

The audio file is loaded and played by the AudioManager:

```typescript
audioManager.playVoiceStopCue();
```

## Design Rationale

- **Short duration (250ms):** Provides quick feedback without interrupting the user's flow
- **Descending tone:** Signals "ending" or "completion" naturally
- **Gentle volume:** Non-intrusive, respects the calm aesthetic of Reflexa AI
- **Fade out:** Smooth ending prevents abrupt cutoff
