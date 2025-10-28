#!/usr/bin/env python3
"""
Convert SVG icons to PNG format
Requires: pip install cairosvg
Alternative: Use the HTML file in public/icons/generate-icons.html
"""

import os
import sys

try:
    import cairosvg
except ImportError:
    print("❌ cairosvg not installed")
    print("\nTo install: pip install cairosvg")
    print("\nAlternative: Open public/icons/generate-icons.html in a browser")
    sys.exit(1)

sizes = [16, 32, 48, 128]
icons_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons')

for size in sizes:
    svg_file = os.path.join(icons_dir, f'icon-{size}.svg')
    png_file = os.path.join(icons_dir, f'icon-{size}.png')

    if not os.path.exists(svg_file):
        print(f"❌ {svg_file} not found")
        continue

    try:
        cairosvg.svg2png(
            url=svg_file,
            write_to=png_file,
            output_width=size,
            output_height=size
        )
        print(f"✓ Generated icon-{size}.png")
    except Exception as e:
        print(f"❌ Error converting icon-{size}.svg: {e}")

print("\n✨ PNG conversion complete!")
