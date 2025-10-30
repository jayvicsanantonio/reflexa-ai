# Converting Reflexa AI Logo to PNG Icons

The Chrome extension toolbar works best with PNG format icons. Here are two methods to convert the `reflexa-ai-logo.svg` to PNG format:

## Method 1: Browser-Based Converter (Easiest)

1. Open `convert-logo-to-png.html` in your browser
2. Click "Generate PNG Icons"
3. Preview the generated icons
4. Click "Download All" to save all PNG files
5. Save them in this folder (`public/icons/`)

## Method 2: Node.js Script (Automated)

1. Install the sharp package:

   ```bash
   npm install --save-dev sharp
   ```

2. Run the generation script:

   ```bash
   node scripts/generate-png-icons.js
   ```

3. The PNG files will be automatically created in `public/icons/`

## After Generating PNG Icons

Update `public/manifest.json` to use PNG files:

```json
"icons": {
  "16": "icons/icon-16.png",
  "32": "icons/icon-32.png",
  "48": "icons/icon-48.png",
  "128": "icons/icon-128.png"
},
"action": {
  "default_popup": "src/popup/index.html",
  "default_icon": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
```

## Icon Sizes Explained

- **16x16**: Extension toolbar icon (small)
- **32x32**: Extension toolbar icon (retina displays)
- **48x48**: Extension management page
- **128x128**: Chrome Web Store and extension installation

## Why PNG Instead of SVG?

While Chrome extensions support SVG in the manifest, PNG files provide:

- Better rendering consistency across different Chrome versions
- Proper display in the toolbar when pinned
- Faster loading times
- Better compatibility with Chrome's icon caching
