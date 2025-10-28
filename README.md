# Reflexa AI Chrome Extension

A wellness-centered Chrome Extension that transforms everyday reading into calm, reflective micro-sessions with AI-powered insights.

## Overview

Reflexa AI helps you absorb more, stress less, and remember what matters by:

- **Detecting sustained reading** - Monitors your dwell time on articles
- **Gentle nudging** - Shows a floating lotus icon when you've been reading for a while
- **AI-powered insights** - Generates three-bullet summaries (Insight, Surprise, Apply) using Chrome's Gemini Nano
- **Guided reflection** - Provides thoughtful questions to deepen your understanding
- **Calming experience** - Features breathing animations, ambient audio, and a Zen-inspired design
- **Privacy-first** - All AI processing happens locally on your device

## Features

- 🧘 **Gentle reflection prompts** after sustained reading (customizable threshold)
- 🤖 **AI-powered summarization** using Chrome's Gemini Nano (local, private)
- 🌸 **Zen-inspired aesthetic** with breathing orb animations and ambient audio
- 📊 **Reflection history** with streak tracking and statistics
- 📤 **Export capabilities** in JSON or Markdown formats
- ⚙️ **Customizable settings** for dwell time, sound, motion, and privacy
- ♿ **Accessibility features** including keyboard navigation and reduced motion support
- 🔒 **Complete privacy** - all processing happens on your device, no data leaves your browser

## Quick Start

### For Users

1. **Enable Gemini Nano** in Chrome:
   - Open Chrome and navigate to `chrome://flags/#optimization-guide-on-device-model`
   - Set to "Enabled BypassPerfRequirement"
   - Navigate to `chrome://flags/#prompt-api-for-gemini-nano`
   - Set to "Enabled"
   - Restart Chrome

2. **Install the extension**:
   - Download the latest release from the Chrome Web Store (coming soon)
   - Or build from source (see Development Setup below)

3. **Start reading**:
   - Browse to any article
   - Read for 60 seconds (default threshold)
   - Click the lotus icon when it appears
   - Enjoy your reflection session!

### For Developers

#### Prerequisites

- **Node.js** v22 or higher
- **npm** or **yarn** package manager
- **Chrome browser** with Gemini Nano enabled (see above)

#### Installation

1. **Clone the repository**:

```bash
git clone https://github.com/yourusername/reflexa-ai-chrome-extension.git
cd reflexa-ai-chrome-extension
```

2. **Install dependencies**:

```bash
npm install
```

3. **Build the extension**:

```bash
npm run build
```

4. **Load the extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` directory from your project folder

5. **Verify installation**:
   - You should see the Reflexa AI icon in your extensions toolbar
   - Click it to open the dashboard
   - Navigate to any article and start reading!

### Development

Run the development build with watch mode:

```bash
npm run dev
```

This will start the Vite dev server with Hot Module Replacement (HMR). The extension will automatically reload when you make changes to the code. CRXJS handles all the bundling and manifest generation automatically.

### Scripts

**Development**:

- `npm run dev` - Start development server with HMR
- `npm run dev:watch` - Build in development mode with watch mode

**Building**:

- `npm run build` - Run all checks (type-check, lint, format) then build for production
- `npm run build:dev` - Build in development mode without checks
- `npm run build:prod` - Production build with all quality checks
- `npm run build:only` - Build without running checks

**Packaging**:

- `npm run package` - Create production ZIP file for Chrome Web Store
- `npm run package:dev` - Create development ZIP file without checks

**Quality Checks**:

- `npm run check` - Run all checks (type-check + lint + format:check)
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Check code with ESLint
- `npm run lint:fix` - Fix auto-fixable ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is formatted correctly

**Testing**:

- `npm run test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Open Vitest UI
- `npm run test:coverage` - Run tests with coverage report

### Git Hooks

The project uses Husky for automated code quality checks:

- **Pre-commit**: Runs type checking, linting, and format checking
- **Pre-push**: Runs all tests

To skip hooks temporarily (not recommended):

```bash
git commit --no-verify
git push --no-verify
```

### Creating a Release

1. Update version in `package.json`:

```bash
npm version patch  # or minor, or major
```

2. Create production package:

```bash
npm run package
```

3. Upload the ZIP file from `build/` directory to Chrome Web Store

For more details, see [Build Scripts Documentation](docs/development/BUILD_SCRIPTS.md).

## Architecture

Reflexa AI is built as a Chrome Manifest V3 extension with four primary components:

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User's Browser                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────────────────┐      │
│  │  Web Page    │         │   Extension Popup        │      │
│  │              │         │   (Dashboard)            │      │
│  │  ┌────────┐  │         │                          │      │
│  │  │Content │  │         │  - Reflection History    │      │
│  │  │Script  │  │         │  - Streak Counter        │      │
│  │  │        │  │         │  - Statistics            │      │
│  │  │ • Dwell│  │         │  - Export                │      │
│  │  │   Timer│  │         └──────────────────────────┘      │
│  │  │ • DOM  │  │                                            │
│  │  │   Extract│ │         ┌──────────────────────────┐     │
│  │  │ • Overlay│ │         │   Options Page           │     │
│  │  │   Inject│  │         │                          │     │
│  │  └────┬───┘  │         │  - Settings              │     │
│  │       │      │         │  - Customization         │     │
│  │  ┌────▼────┐ │         └──────────────────────────┘     │
│  │  │ Reflect │ │                                            │
│  │  │  Mode   │ │                                            │
│  │  │ Overlay │ │                                            │
│  │  └─────────┘ │                                            │
│  └──────────────┘                                            │
│         │                                                    │
│         │ chrome.runtime.sendMessage()                      │
│         ▼                                                    │
│  ┌─────────────────────────────────────────────────┐        │
│  │   Background Service Worker                     │        │
│  │                                                  │        │
│  │   ┌──────────────┐      ┌──────────────────┐   │        │
│  │   │ AI Manager   │      │ Storage Manager  │   │        │
│  │   │              │      │                  │   │        │
│  │   │ • Summarize  │      │ • Save/Load      │   │        │
│  │   │ • Reflect    │      │ • Export         │   │        │
│  │   │ • Proofread  │      │ • Settings       │   │        │
│  │   └──────┬───────┘      └──────────────────┘   │        │
│  │          │                                      │        │
│  │          ▼                                      │        │
│  │   ┌──────────────────────────────────┐         │        │
│  │   │  LanguageModel                   │         │        │
│  │   │  (Gemini Nano)                   │         │        │
│  │   │                                  │         │        │
│  │   │  • Local AI Inference            │         │        │
│  │   │  • No Network Calls              │         │        │
│  │   └──────────────────────────────────┘         │        │
│  └─────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
reflexa-ai-chrome-extension/
├── public/
│   ├── manifest.json       # Extension manifest (Manifest V3)
│   ├── icons/              # Extension icons (16, 32, 48, 128px)
│   └── audio/              # Audio assets (entry chime, ambient loop, completion bell)
├── src/
│   ├── background/         # Background service worker
│   │   ├── index.ts        # Service worker entry point
│   │   ├── aiManager.ts    # Gemini Nano integration
│   │   ├── storageManager.ts  # Chrome storage operations
│   │   └── settingsManager.ts # Settings management
│   ├── content/            # Content script (injected into web pages)
│   │   ├── index.tsx       # Content script entry point
│   │   ├── dwellTracker.ts # Dwell time tracking
│   │   ├── contentExtractor.ts # DOM content extraction
│   │   ├── LotusNudge.tsx  # Floating lotus icon component
│   │   ├── ReflectModeOverlay.tsx # Full-screen reflection UI
│   │   └── BreathingOrb.tsx # Breathing animation component
│   ├── popup/              # Popup dashboard
│   │   ├── App.tsx         # Dashboard main component
│   │   ├── ReflectionCard.tsx # Individual reflection display
│   │   ├── StreakCounter.tsx  # Streak visualization
│   │   ├── CalmStats.tsx   # Statistics display
│   │   └── ExportModal.tsx # Export functionality
│   ├── options/            # Settings page
│   │   ├── App.tsx         # Settings main component
│   │   └── components/     # Reusable settings components
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── constants/          # Constants and configuration
│   └── styles/             # Global styles and themes
├── dist/                   # Build output (generated)
├── build/                  # Packaged extension (generated)
├── docs/                   # Documentation
└── scripts/                # Build and utility scripts
```

## How It Works

### 1. Dwell Detection

The content script monitors your reading behavior using:

- **Page Visibility API** - Pauses timer when tab is hidden
- **User interaction events** - Detects scroll, mouse movement, keyboard activity
- **Configurable threshold** - Default 60 seconds, customizable from 30-300 seconds

### 2. Content Extraction

When the threshold is reached, the extension:

- Analyzes DOM structure to identify main article content
- Uses heuristics to exclude navigation, ads, sidebars, and footers
- Extracts page title, URL, and readable text
- Estimates token count and truncates if necessary (max 3000 tokens)

### 3. AI Processing

The background service worker:

- Sends extracted content to Gemini Nano (local AI)
- Generates a three-bullet summary (Insight, Surprise, Apply)
- Creates two action-oriented reflection questions
- Implements timeout handling (4 seconds) with retry logic

### 4. Reflection Experience

The Reflect Mode overlay provides:

- **Breathing orb animation** - 7-second cycle for calm focus
- **Ambient audio** - Optional entry chime and ambient loop
- **Summary display** - Three labeled bullets
- **Reflection inputs** - Text areas for answering questions
- **Optional proofreading** - AI-powered grammar and clarity improvements
- **Keyboard shortcuts** - Cmd/Ctrl+Enter to save, Escape to cancel

### 5. Data Storage

All reflections are stored locally:

- **Chrome Storage API** - Local storage by default
- **Optional sync** - Enable in settings to sync across devices
- **Streak calculation** - Tracks consecutive days with reflections
- **Export options** - JSON or Markdown formats

## AI Prompts

Reflexa AI uses carefully crafted prompts to generate high-quality summaries and reflection questions:

### Summarization Prompt

```
Summarize the following article into exactly 3 bullets, each no more than 20 words:

1. Insight: The main idea or key takeaway
2. Surprise: Something unexpected or counterintuitive
3. Apply: How to use this information practically

Article:
{content}

Format your response as:
- Insight: [text]
- Surprise: [text]
- Apply: [text]
```

**Rationale**: The three-bullet format follows learning science principles:

- **Insight** connects new information to existing knowledge
- **Surprise** highlights novel or unexpected elements that aid retention
- **Apply** encourages practical application, which improves long-term memory

### Reflection Prompt

```
Based on this summary, generate exactly 2 concise, action-oriented reflection questions (max 15 words each):

Summary:
{summary}

Format your response as:
1. [First question]
2. [Second question]

Make questions thought-provoking and focused on application or deeper understanding.
```

**Rationale**: Two questions strike a balance between depth and brevity:

- Encourages active engagement without overwhelming the user
- Action-oriented questions promote practical application
- Concise format respects the user's time and attention

### Proofreading Prompt

```
Proofread the following text for grammar and clarity. Preserve the original tone and voice. Make no more than 2 edits per sentence:

{text}

Return only the proofread version without explanations.
```

**Rationale**: Minimal editing preserves the user's authentic voice while improving clarity:

- Respects personal writing style
- Focuses on clarity over perfection
- Maintains the reflective, personal nature of the content

## Technology Stack

- **Framework**: React 18 with TypeScript 5
- **Build Tool**: Vite 5 with CRXJS
- **Styling**: Tailwind CSS v4
- **Code Quality**: ESLint v9 + Prettier v3
- **Testing**: Vitest + React Testing Library
- **AI**: Chrome Gemini Nano (local inference via Prompt API)
- **Storage**: Chrome Storage API
- **Animation**: CSS animations + Framer Motion

## Accessibility

Reflexa AI is designed with accessibility in mind:

- ✅ **Keyboard navigation** - Full support for Tab, Enter, Escape
- ✅ **Screen reader compatible** - ARIA labels and semantic HTML
- ✅ **Color contrast** - WCAG AA compliant (4.5:1 ratio)
- ✅ **Reduced motion** - Respects `prefers-reduced-motion` setting
- ✅ **Focus management** - Clear focus indicators and logical tab order
- ✅ **Customizable settings** - Control sound, motion, and timing

## Privacy & Security

Your privacy is our top priority:

- 🔒 **Local AI processing** - All AI inference happens on your device
- 🔒 **No external servers** - No data is sent to external APIs
- 🔒 **Local storage** - Reflections stored in Chrome's local storage by default
- 🔒 **Optional sync** - Sync only if you explicitly enable it
- 🔒 **No tracking** - No analytics, no telemetry, no user tracking
- 🔒 **Open source** - Code is publicly auditable

## Troubleshooting

### Gemini Nano not available

- Ensure you've enabled the required Chrome flags (see Quick Start)
- Restart Chrome after enabling flags
- Check Chrome version (requires Chrome 127+)
- Verify your device meets performance requirements

### Extension not detecting reading

- Check dwell threshold in settings (default 60 seconds)
- Ensure you're actively interacting with the page (scroll, mouse movement)
- Verify the page has extractable content (not a video or image-heavy page)

### AI timeout errors

- Content may be too long (max 3000 tokens)
- Try refreshing the page and trying again
- Check Chrome DevTools console for detailed error messages

### Storage full

- Export older reflections to free up space
- Delete reflections you no longer need
- Chrome local storage limit is ~5MB

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Run linting (`npm run lint`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- Built with [Chrome's Gemini Nano](https://developer.chrome.com/docs/ai/built-in)
- Inspired by mindfulness practices and learning science research
- Icons and design influenced by Zen aesthetics

## Support

- 📧 Email: support@reflexa-ai.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/reflexa-ai-chrome-extension/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/reflexa-ai-chrome-extension/discussions)
