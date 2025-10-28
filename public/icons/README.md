# Reflexa AI Icons

This directory contains the lotus icon for the Reflexa AI Chrome extension in multiple sizes.

## Files

- `icon-16.svg` - 16x16 icon (toolbar, small displays)
- `icon-32.svg` - 32x32 icon (toolbar retina)
- `icon-48.svg` - 48x48 icon (extension management)
- `icon-128.svg` - 128x128 icon (Chrome Web Store, installation)
- `icon.svg` - Legacy icon (can be removed)
- `generate-icons.html` - Browser-based icon generator and PNG converter

## Design

The lotus icon features:

- **Zen aesthetic** with calming blue gradient background
- **Blue gradient colors**: Sky blue (#0ea5e9) → Blue (#3b82f6) → Indigo (#6366f1)
- **Lotus flower** with 8 outer petals and 5 inner petals
- **White petals** with subtle gradients for depth
- **Golden center** representing enlightenment and calm
- **Rounded corners** for modern, friendly appearance

## SVG vs PNG

Chrome extensions fully support SVG icons, which offer several advantages:

- **Perfect scaling** at any size
- **Smaller file size** compared to PNG
- **Crisp rendering** on all displays (including retina)
- **Easy to modify** colors and design

The manifest.json currently references SVG files.

## Converting to PNG (Optional)

If you need PNG files for specific use cases:

### Method 1: Browser-based (Easiest)

1. Open `generate-icons.html` in Chrome
2. Click "Download All" button
3. PNG files will download automatically

### Method 2: ImageMagick

```bash
cd public/icons
for size in 16 32 48 128; do
  convert icon-$size.svg icon-$size.png
done
```

### Method 3: Python (cairosvg)

```bash
pip install cairosvg
python scripts/svg-to-png.py
```

### Method 4: Node.js (sharp)

```bash
npm install sharp
# Create conversion script using sharp
```

## Updating Icons

To regenerate the SVG icons:

```bash
node scripts/generate-icons.js
```

To modify the design, edit `scripts/generate-icons.js` and adjust:

- Colors in the gradient definitions
- Petal count and positioning
- Center circle size and color
- Corner radius for background

## Usage in Manifest

The icons are referenced in `public/manifest.json`:

```json
{
  "icons": {
    "16": "icons/icon-16.svg",
    "32": "icons/icon-32.svg",
    "48": "icons/icon-48.svg",
    "128": "icons/icon-128.svg"
  },
  "action": {
    "default_icon": {
      "16": "icons/icon-16.svg",
      "32": "icons/icon-32.svg",
      "48": "icons/icon-48.svg",
      "128": "icons/icon-128.svg"
    }
  }
}
```

## Requirements Met

✅ Create lotus icon in multiple sizes (16x16, 32x32, 48x48, 128x128)
✅ Design in Zen aesthetic with blue gradient colors
✅ Export as SVG files (PNG conversion available)
✅ Place in public/icons directory
✅ Reference in manifest.json
