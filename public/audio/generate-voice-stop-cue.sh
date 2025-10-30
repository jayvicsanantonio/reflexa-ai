#!/bin/bash

# Generate a subtle voice stop audio cue using sox (if available)
# Duration: 250ms (0.25 seconds)
# Type: Soft descending tone (800Hz -> 400Hz)

OUTPUT_FILE="voice-stop-cue.mp3"

echo "Generating voice stop audio cue..."

# Check if sox is installed
if ! command -v sox &> /dev/null; then
    echo "Error: sox is not installed."
    echo "Please install sox:"
    echo "  macOS: brew install sox"
    echo "  Ubuntu/Debian: sudo apt-get install sox libsox-fmt-mp3"
    echo ""
    echo "Alternatively, open generate-voice-stop-cue.html in a browser to generate the audio file."
    exit 1
fi

# Generate descending tone with fade out
# 800Hz -> 400Hz over 250ms with exponential fade out
sox -n -r 44100 -c 1 "$OUTPUT_FILE" synth 0.25 sine 800-400 fade 0 0.25 0.15 vol 0.3

if [ $? -eq 0 ]; then
    echo "✓ Audio cue generated successfully: $OUTPUT_FILE"
    echo "  Duration: 250ms"
    echo "  Frequency: 800Hz → 400Hz"
    echo "  Volume: 30%"

    # Get file size
    SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
    echo "  File size: $SIZE"
else
    echo "✗ Failed to generate audio cue"
    exit 1
fi
