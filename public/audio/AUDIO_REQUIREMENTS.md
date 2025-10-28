# Audio Asset Requirements for Reflexa AI

This document provides detailed specifications for the three audio files required by the Reflexa AI Chrome Extension.

## Required Audio Files

### 1. entry-chime.mp3

**Purpose**: Plays when Reflect Mode is activated
**Duration**: < 1 second (recommended: 0.5-0.8 seconds)
**Characteristics**:

- Gentle, non-intrusive tone
- Ascending pitch (e.g., C4 → E4 → G4)
- Soft attack and release (no harsh starts/stops)
- Calming, welcoming quality
- Think: meditation bell, soft chime, or gentle gong

**Technical Specs**:

- Format: MP3 (128 kbps or lower)
- Sample Rate: 44.1 kHz
- Channels: Mono (preferred for size) or Stereo
- Target File Size: < 20 KB

**Sound Design Notes**:

- Use sine or triangle waves for smoothness
- Add subtle reverb for depth
- Avoid sharp transients
- Consider frequencies in the 200-800 Hz range for warmth

### 2. ambient-loop.mp3

**Purpose**: Loops continuously during Reflect Mode
**Duration**: Exactly 8 seconds
**Characteristics**:

- Seamless loop (start and end must match perfectly)
- Calming, meditative hum or drone
- Subtle, non-distracting background presence
- Consistent volume throughout
- Think: Tibetan singing bowl, ocean waves, or soft synth pad

**Technical Specs**:

- Format: MP3 (128 kbps or lower)
- Sample Rate: 44.1 kHz
- Channels: Mono (preferred for size) or Stereo
- Target File Size: < 100 KB
- **CRITICAL**: Must loop seamlessly (no clicks or pops at loop point)

**Sound Design Notes**:

- Use crossfade at loop point (50-100ms)
- Test loop multiple times to ensure seamlessness
- Keep frequency content below 5 kHz for calmness
- Consider binaural beats or isochronic tones (optional)
- Avoid rhythmic elements that might become repetitive

### 3. completion-bell.mp3

**Purpose**: Plays when user saves their reflection
**Duration**: 0.8 seconds (recommended: 0.6-1.0 seconds)
**Characteristics**:

- Positive, satisfying tone
- Clear, bright quality (but not harsh)
- Sense of completion and accomplishment
- Single strike or short melodic phrase
- Think: success chime, soft bell, or positive notification sound

**Technical Specs**:

- Format: MP3 (128 kbps or lower)
- Sample Rate: 44.1 kHz
- Channels: Mono (preferred for size) or Stereo
- Target File Size: < 25 KB

**Sound Design Notes**:

- Use higher frequencies than entry chime (500-1500 Hz)
- Natural decay (don't cut off abruptly)
- Add subtle sparkle with high-frequency harmonics
- Consider a two-note melody (e.g., G4 → C5)

## Audio Generation Options

### Option 1: Generate with Web Audio API

Use the included `generate-audio.html` tool to create basic audio files using browser synthesis.

### Option 2: Use Audio Synthesis Software

- **Audacity** (Free, Open Source)
  - Generate tones with Tone Generator
  - Apply effects (reverb, fade, normalize)
  - Export as MP3 with 128 kbps or lower

- **GarageBand** (macOS, Free)
  - Use software instruments
  - Apply audio effects
  - Export as MP3

- **FL Studio / Ableton Live** (Professional)
  - Full synthesis and sampling capabilities
  - Professional effects processing

### Option 3: Source from Royalty-Free Libraries

- **Freesound.org** - Community sound library (CC licenses)
- **Zapsplat.com** - Free sound effects (attribution required)
- **BBC Sound Effects** - Free for personal/educational use
- **YouTube Audio Library** - Royalty-free sounds

**Search Terms**:

- "meditation bell"
- "zen chime"
- "ambient drone"
- "success notification"
- "positive chime"
- "singing bowl"

### Option 4: Commission Custom Audio

Consider hiring a sound designer on:

- Fiverr
- Upwork
- SoundBetter

## Audio Optimization

After obtaining audio files, optimize them:

1. **Normalize Audio**: Ensure consistent volume levels
2. **Trim Silence**: Remove unnecessary silence at start/end
3. **Compress**: Use MP3 at 128 kbps or lower
4. **Test Loop**: For ambient-loop.mp3, verify seamless looping
5. **Check File Size**: Ensure files meet target sizes

### Optimization Tools

- **Audacity**: Free, cross-platform audio editor
- **ffmpeg**: Command-line audio conversion

  ```bash
  # Convert to MP3 at 128 kbps
  ffmpeg -i input.wav -b:a 128k -ar 44100 output.mp3

  # Convert to mono for smaller size
  ffmpeg -i input.wav -ac 1 -b:a 96k -ar 44100 output.mp3
  ```

## Testing Your Audio Files

1. **Duration Check**: Verify durations match requirements
2. **Loop Test**: Play ambient-loop.mp3 on repeat for 1 minute
3. **Volume Test**: Ensure all files have similar perceived loudness
4. **Browser Test**: Test in Chrome with AudioManager
5. **File Size Check**: Verify files are optimized for web delivery

## Placeholder Files

The current audio files in this directory are silent placeholders. Replace them with actual audio files following the specifications above.

## Integration Notes

The AudioManager (`src/utils/audioManager.ts`) handles:

- Loading audio files with lazy loading
- Playing at 30% volume
- Looping ambient sound
- Respecting user settings
- Graceful fade in/out

Audio files are referenced as:

- `/audio/entry-chime.mp3`
- `/audio/ambient-loop.mp3`
- `/audio/completion-bell.mp3`

Ensure files are placed directly in the `public/audio/` directory with these exact names.

## License Considerations

Ensure any audio files you use:

- Are royalty-free or properly licensed
- Allow commercial use (if applicable)
- Include proper attribution (if required)
- Are compatible with the extension's license

## Questions?

For audio-related questions or issues, refer to:

- AudioManager implementation: `src/utils/audioManager.ts`
- Audio constants: `src/constants/index.ts`
- Design document: `.kiro/specs/reflexa-ai-chrome-extension/design.md`
