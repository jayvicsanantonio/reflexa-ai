#!/bin/bash

# Audio Validation Script for Reflexa AI
# Checks if audio files meet the requirements

echo "🎵 Reflexa AI - Audio File Validator"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if ffprobe is available
if ! command -v ffprobe &> /dev/null; then
    echo -e "${RED}❌ ffprobe not found. Please install ffmpeg to use this validator.${NC}"
    exit 1
fi

# Function to check audio file
check_audio_file() {
    local file=$1
    local expected_duration=$2
    local max_duration=$3
    local name=$4

    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ $name: File not found${NC}"
        return 1
    fi

    # Get duration
    duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$file" 2>/dev/null)

    if [ -z "$duration" ]; then
        echo -e "${RED}❌ $name: Could not read file${NC}"
        return 1
    fi

    # Get file size in KB
    size=$(du -k "$file" | cut -f1)

    # Get format
    format=$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 "$file" 2>/dev/null)

    # Get sample rate
    sample_rate=$(ffprobe -v error -select_streams a:0 -show_entries stream=sample_rate -of default=noprint_wrappers=1:nokey=1 "$file" 2>/dev/null)

    echo "📄 $name"
    echo "   Duration: ${duration}s (expected: ~${expected_duration}s, max: ${max_duration}s)"
    echo "   Size: ${size}KB"
    echo "   Format: $format"
    echo "   Sample Rate: ${sample_rate}Hz"

    # Check duration
    duration_check=$(echo "$duration <= $max_duration" | bc -l)
    if [ "$duration_check" -eq 1 ]; then
        echo -e "   ${GREEN}✓ Duration OK${NC}"
    else
        echo -e "   ${YELLOW}⚠ Duration exceeds maximum${NC}"
    fi

    # Check format
    if [ "$format" = "mp3" ]; then
        echo -e "   ${GREEN}✓ Format OK (MP3)${NC}"
    else
        echo -e "   ${YELLOW}⚠ Format is not MP3 (found: $format)${NC}"
    fi

    # Check sample rate
    if [ "$sample_rate" = "44100" ] || [ "$sample_rate" = "48000" ]; then
        echo -e "   ${GREEN}✓ Sample rate OK${NC}"
    else
        echo -e "   ${YELLOW}⚠ Unusual sample rate (expected 44100 or 48000 Hz)${NC}"
    fi

    # Check file size (rough estimates)
    if [ "$name" = "Entry Chime" ] && [ "$size" -lt 50 ]; then
        echo -e "   ${GREEN}✓ File size OK${NC}"
    elif [ "$name" = "Ambient Loop" ] && [ "$size" -lt 150 ]; then
        echo -e "   ${GREEN}✓ File size OK${NC}"
    elif [ "$name" = "Completion Bell" ] && [ "$size" -lt 50 ]; then
        echo -e "   ${GREEN}✓ File size OK${NC}"
    else
        echo -e "   ${YELLOW}⚠ File size might be optimized further${NC}"
    fi

    echo ""
}

# Check each audio file
check_audio_file "entry-chime.mp3" "0.6" "1.0" "Entry Chime"
check_audio_file "ambient-loop.mp3" "8.0" "8.0" "Ambient Loop"
check_audio_file "completion-bell.mp3" "0.8" "1.0" "Completion Bell"

echo "===================================="
echo -e "${GREEN}✓ Validation complete${NC}"
echo ""
echo "Note: These checks verify technical requirements only."
echo "Please also verify audio quality and aesthetic fit manually."
echo ""
echo "To replace placeholder files:"
echo "1. Use generate-audio.html to create basic sounds"
echo "2. Or source professional audio from libraries"
echo "3. See AUDIO_REQUIREMENTS.md for detailed specs"
