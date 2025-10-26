# Reflexa AI Chrome Extension

A wellness-centered Chrome Extension that transforms everyday reading into calm, reflective micro-sessions with AI-powered insights.

## Features

- 🧘 Gentle reflection prompts after sustained reading
- 🤖 AI-powered summarization using Chrome's Gemini Nano (local, private)
- 🌸 Zen-inspired aesthetic with breathing animations
- 📊 Reflection history and streak tracking
- 🔒 Complete privacy - all processing happens on your device

## Development Setup

### Prerequisites

- Node.js v22 or higher
- npm or yarn
- Chrome browser with Gemini Nano enabled

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Build the extension:

```bash
npm run build
```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory

### Development

Run the development build with watch mode:

```bash
npm run dev
```

This will start the Vite dev server with Hot Module Replacement (HMR). The extension will automatically reload when you make changes to the code. CRXJS handles all the bundling and manifest generation automatically.

### Scripts

- `npm run dev` - Development build with watch mode
- `npm run build` - Production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
reflexa-ai-chrome-extension/
├── public/
│   ├── manifest.json       # Extension manifest
│   ├── icons/              # Extension icons
│   └── audio/              # Audio assets
├── src/
│   ├── background/         # Background service worker
│   ├── content/            # Content script
│   ├── popup/              # Popup dashboard
│   └── options/            # Settings page
├── dist/                   # Build output
└── docs/                   # Documentation
```

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3
- **AI**: Chrome Gemini Nano (local inference)
- **Storage**: Chrome Storage API

## License

MIT
