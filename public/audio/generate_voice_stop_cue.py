#!/usr/bin/env python3
"""
Generate a subtle voice stop audio cue
Duration: 250ms (0.25 seconds)
Type: Soft descending tone (800Hz -> 400Hz)
"""

import math
import struct
import sys

def generate_wav(filename, duration=0.25, start_freq=800, end_freq=400, sample_rate=44100):
    """Generate a WAV file with a descending tone and fade out"""

    num_samples = int(sample_rate * duration)

    # WAV file header
    wav_header = struct.pack('<4sI4s', b'RIFF', 36 + num_samples * 2, b'WAVE')
    fmt_chunk = struct.pack('<4sIHHIIHH',
        b'fmt ', 16, 1, 1, sample_rate, sample_rate * 2, 2, 16)
    data_header = struct.pack('<4sI', b'data', num_samples * 2)

    # Generate audio samples
    samples = []
    for i in range(num_samples):
        t = i / sample_rate
        progress = i / num_samples

        # Frequency sweep from start_freq to end_freq
        freq = start_freq + (end_freq - start_freq) * progress

        # Generate sine wave
        sample = math.sin(2 * math.pi * freq * t)

        # Apply exponential fade out
        fade_out = math.pow(1 - progress, 2)

        # Apply gentle volume (30% max)
        amplitude = sample * fade_out * 0.3

        # Convert to 16-bit integer
        sample_int = int(amplitude * 32767)
        samples.append(struct.pack('<h', sample_int))

    # Write WAV file
    with open(filename, 'wb') as f:
        f.write(wav_header)
        f.write(fmt_chunk)
        f.write(data_header)
        for sample in samples:
            f.write(sample)

    print(f"✓ Generated {filename}")
    print(f"  Duration: {duration * 1000}ms")
    print(f"  Frequency: {start_freq}Hz → {end_freq}Hz")
    print(f"  Sample rate: {sample_rate}Hz")
    print(f"  Samples: {num_samples}")

if __name__ == '__main__':
    output_file = 'voice-stop-cue.wav'
    if len(sys.argv) > 1:
        output_file = sys.argv[1]

    generate_wav(output_file)
    print(f"\nNote: File is in WAV format.")
    print("To convert to MP3, use ffmpeg:")
    print(f"  ffmpeg -i {output_file} -codec:a libmp3lame -b:a 128k voice-stop-cue.mp3")
