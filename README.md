# Reflexa AI Chrome Extension

A wellness-centered Chrome Extension that transforms everyday reading into calm, reflective micro-sessions with AI-powered insights.

## Quick Links

📚 **Documentation**

- [User Guide](docs/guides/USER_GUIDE.md) - Complete user documentation
- [AI Service Architecture](docs/development/AI_SERVICE_ARCHITECTURE.md) - Developer guide
- [Chrome AI Operations Examples](docs/examples/CHROME_AI_OPERATIONS.md) - Code examples
- [Fallback Behavior](docs/development/FALLBACK_BEHAVIOR.md) - Fallback strategies
- [Gemini Nano Setup](docs/development/GEMINI_NANO_SETUP.md) - Setup instructions

🚀 **Getting Started**

- [Quick Start](#quick-start) - Installation and setup
- [Chrome AI APIs Integration](#chrome-ai-apis-integration) - AI features overview
- [Troubleshooting](#troubleshooting) - Common issues and solutions

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
- 🤖 **7 Chrome AI APIs integrated** - Summarizer, Writer, Rewriter, Proofreader, Translator, Language Detector, and Prompt API
- 📝 **AI-powered summarization** in three formats (bullets, paragraph, headline+bullets)
- ✍️ **Draft generation** with tone and length control
- 🎨 **Tone adjustment** with four presets (Calm, Concise, Empathetic, Academic)
- ✅ **Grammar checking** with color-coded diff view
- 🌍 **Multilingual support** - auto-detect language and translate to 10+ languages
- 🌸 **Zen-inspired aesthetic** with breathing orb animations and ambient audio
- 📊 **Reflection history** with streak tracking and statistics
- 📤 **Export capabilities** in JSON or Markdown formats
- ⚙️ **Customizable settings** for AI features, dwell time, sound, motion, and privacy
- ♿ **Accessibility features** including keyboard navigation and reduced motion support
- 🔒 **Complete privacy** - all AI processing happens locally on your device using Gemini Nano

## Quick Start

### For Users

1. **Enable Chrome AI APIs**:
   - See the complete [Gemini Nano Setup Guide](docs/development/GEMINI_NANO_SETUP.md) for detailed instructions
   - **Required flags** (for basic AI functionality):
     - `chrome://flags/#optimization-guide-on-device-model` → "Enabled BypassPerfRequirement"
     - `chrome://flags/#prompt-api-for-gemini-nano` → "Enabled"
   - **Recommended flags** (for enhanced features):
     - `chrome://flags/#summarization-api-for-gemini-nano` → "Enabled"
     - `chrome://flags/#writer-api-for-gemini-nano` → "Enabled"
     - `chrome://flags/#rewriter-api-for-gemini-nano` → "Enabled"
   - **Optional flags** (for multilingual support):
     - `chrome://flags/#language-detection-api` → "Enabled"
     - `chrome://flags/#translation-api` → "Enabled"
   - **Restart Chrome** after enabling flags

2. **Install the extension**:
   - Download the latest release from the Chrome Web Store (coming soon)
   - Or build from source (see Development Setup below)

3. **Start reading**:
   - Browse to any article
   - Read for 60 seconds (default threshold)
   - Click the lotus icon when it appears
   - Enjoy your AI-powered reflection session!

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
│  │   │ AI Service   │      │ Storage Manager  │   │        │
│  │   │              │      │                  │   │        │
│  │   │ • 7 API      │      │ • Save/Load      │   │        │
│  │   │   Managers   │      │ • Export         │   │        │
│  │   │ • Capability │      │ • Settings       │   │        │
│  │   │   Detection  │      │ • Streak         │   │        │
│  │   │ • Fallback   │      └──────────────────┘   │        │
│  │   │   Logic      │                              │        │
│  │   └──────┬───────┘                              │        │
│  │          │                                      │        │
│  │          ▼                                      │        │
│  │   ┌──────────────────────────────────┐         │        │
│  │   │  Chrome Built-in AI APIs         │         │        │
│  │   │  (Powered by Gemini Nano)        │         │        │
│  │   │                                  │         │        │
│  │   │  • Summarizer  • Writer          │         │        │
│  │   │  • Rewriter    • Proofreader     │         │        │
│  │   │  • Translator  • Lang Detector   │         │        │
│  │   │  • Prompt (Fallback)             │         │        │
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
│   │   ├── services/       # Service layer
│   │   │   ├── ai/         # AI Service with 7 API managers
│   │   │   │   ├── aiService.ts        # Main AI service orchestrator
│   │   │   │   ├── summarizerManager.ts # Summarizer API
│   │   │   │   ├── writerManager.ts     # Writer API
│   │   │   │   ├── rewriterManager.ts   # Rewriter API
│   │   │   │   ├── proofreaderManager.ts # Proofreader API
│   │   │   │   ├── translatorManager.ts  # Translator API
│   │   │   │   ├── languageDetectorManager.ts # Language Detector
│   │   │   │   └── promptManager.ts     # Prompt API (fallback)
│   │   │   └── capabilities/
│   │   │       └── capabilityDetector.ts # Capability detection
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

The background service worker uses Chrome's Built-in AI APIs:

- **Language Detection** - Automatically identifies the language of the article (100+ languages)
- **Translation** - Translates non-English content to English if needed (10+ languages)
- **Summarization** - Generates summaries in three formats using Summarizer API (or Prompt API fallback)
- **Draft Generation** - Creates first drafts using Writer API with tone and length control
- **Tone Adjustment** - Rewrites text with Rewriter API (Calm, Concise, Empathetic, Academic)
- **Proofreading** - Fixes grammar and improves clarity using Proofreader API
- **Intelligent Fallback** - Falls back to Prompt API when specialized APIs unavailable
- **Timeout Handling** - 5-second initial timeout, 8-second retry timeout

For detailed architecture, see [AI Service Architecture](docs/development/AI_SERVICE_ARCHITECTURE.md).

### 4. Reflection Experience

The Reflect Mode overlay provides:

- **Breathing orb animation** - 7-second cycle for calm focus
- **Ambient audio** - Optional entry chime and ambient loop
- **Summary display** - Choose from bullets, paragraph, or headline+bullets format
- **Language pill** - Shows detected language with confidence score
- **Draft generation** - AI-generated first draft with customizable tone and length
- **Reflection inputs** - Text areas for answering questions
- **Tone adjustment** - Four preset chips to rewrite in different tones
- **Proofreading** - AI-powered grammar checking with color-coded diff view
- **Translation** - Translate summaries and reflections to 10+ languages
- **Keyboard shortcuts** - Cmd/Ctrl+Enter to save, Escape to cancel

For usage examples, see [Chrome AI Operations](docs/examples/CHROME_AI_OPERATIONS.md).

### 5. Data Storage

All reflections are stored locally:

- **Chrome Storage API** - Local storage by default
- **Optional sync** - Enable in settings to sync across devices
- **Streak calculation** - Tracks consecutive days with reflections
- **Export options** - JSON or Markdown formats

## Chrome AI APIs Integration

Reflexa AI integrates all seven Chrome Built-in AI APIs powered by Gemini Nano:

1. **Summarizer API** - Generates summaries in three formats (bullets, paragraph, headline+bullets)
2. **Writer API** - Creates first drafts with tone (calm, professional, casual) and length control
3. **Rewriter API** - Adjusts tone with four presets (Calm, Concise, Empathetic, Academic)
4. **Proofreader API** - Fixes grammar and improves clarity with diff view
5. **Language Detector API** - Identifies language of text content (100+ languages)
6. **Translator API** - Translates between 10+ languages with markdown preservation
7. **Prompt API** - Universal fallback for all operations

### Intelligent Fallback Strategy

```
Specialized API → Prompt API → Manual Mode
```

- **Summarization**: Summarizer API → Prompt API → Manual input
- **Draft Generation**: Writer API → Prompt API → Blank input
- **Tone Adjustment**: Rewriter API → Prompt API → Manual rewrite
- **Proofreading**: Proofreader API → Feature hidden if unavailable
- **Translation**: Translator API → Feature hidden if unavailable
- **Language Detection**: Language Detector API → Feature hidden if unavailable

For detailed fallback behavior, see [Fallback Behavior Documentation](docs/development/FALLBACK_BEHAVIOR.md).

## AI Prompts

Reflexa AI uses carefully crafted prompts for both specialized APIs and Prompt API fallbacks:

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
- **AI**: Chrome Built-in AI APIs (7 APIs powered by Gemini Nano)
  - Summarizer API, Writer API, Rewriter API, Proofreader API
  - Language Detector API, Translator API, Prompt API
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

- 🔒 **Local AI processing** - All 7 Chrome AI APIs run locally on your device using Gemini Nano
- 🔒 **No external servers** - No data is sent to external APIs or cloud services
- 🔒 **Zero network calls** - All AI inference happens offline
- 🔒 **Local storage** - Reflections stored in Chrome's local storage by default
- 🔒 **Optional sync** - Sync only if you explicitly enable it in settings
- 🔒 **No tracking** - No analytics, no telemetry, no user tracking
- 🔒 **Open source** - Code is publicly auditable on GitHub
- 🔒 **Minimal permissions** - Only requests necessary permissions (storage, activeTab)

**What data stays local:**

- Article content extraction
- AI summarization, writing, rewriting, proofreading
- Language detection and translation
- All reflections and user data
- Settings and preferences

## Documentation

### For Users

- **[User Guide](docs/guides/USER_GUIDE.md)** - Complete guide to using Reflexa AI
  - Getting started and setup
  - Using all AI features
  - Dashboard and settings
  - Tips and best practices
  - FAQ and troubleshooting

### For Developers

- **[AI Service Architecture](docs/development/AI_SERVICE_ARCHITECTURE.md)** - Complete developer guide
  - Architecture overview and system design
  - All 7 API managers documented
  - Capability detection system
  - Session management and error handling
  - Usage examples and best practices

- **[Chrome AI Operations Examples](docs/examples/CHROME_AI_OPERATIONS.md)** - Practical code examples
  - Examples for all operations (summarize, write, rewrite, proofread, translate)
  - Complete workflow examples
  - Error handling patterns
  - Best practices with do's and don'ts

- **[Fallback Behavior](docs/development/FALLBACK_BEHAVIOR.md)** - Fallback strategies
  - Fallback matrix for all operations
  - Implementation details with prompts
  - UI behavior based on capabilities
  - Troubleshooting guide

- **[Gemini Nano Setup Guide](docs/development/GEMINI_NANO_SETUP.md)** - Setup instructions
  - All 7 Chrome AI API flags
  - Verification steps for each API
  - Testing examples
  - Troubleshooting

- **[Architecture Documentation](docs/architecture/ARCHITECTURE.md)** - System architecture
  - Component architecture
  - Data flow diagrams
  - Storage architecture
  - Performance considerations

- **[Chrome AI APIs Documentation](docs/development/chrome-apis/INDEX.md)** - Individual API docs
  - Quick references for each API
  - Comprehensive guides
  - Official Chrome resources

### Additional Resources

- **[Build Scripts Documentation](docs/development/BUILD_SCRIPTS.md)** - Build and packaging
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute
- **[Documentation Update Summary](docs/development/DOCUMENTATION_UPDATE_CHROME_AI.md)** - Recent updates

## Troubleshooting

### Chrome AI APIs not available

- Ensure you've enabled the required Chrome flags (see [Gemini Nano Setup Guide](docs/development/GEMINI_NANO_SETUP.md))
- Restart Chrome completely after enabling flags
- Check Chrome version (requires Chrome 127+)
- Verify your device meets performance requirements
- Check AI Status panel in dashboard to see which APIs are available
- Try refreshing capabilities in settings

**Which APIs do I need?**

- **Required**: Optimization Guide + Prompt API (basic functionality)
- **Recommended**: Summarizer + Writer + Rewriter (enhanced features)
- **Optional**: Language Detector + Translator (multilingual support)

### Extension not detecting reading

- Check dwell threshold in settings (default 60 seconds)
- Ensure you're actively interacting with the page (scroll, mouse movement)
- Verify the page has extractable content (not a video or image-heavy page)

### AI timeout errors

- Content may be too long (max 3000 tokens for Prompt API)
- Extension automatically retries with extended timeout (8 seconds)
- Falls back to Prompt API if specialized API times out
- Try refreshing the page and trying again
- Check Chrome DevTools console for detailed error messages
- See [Fallback Behavior](docs/development/FALLBACK_BEHAVIOR.md) for details

### Some AI features are missing

- Check which Chrome AI APIs are available in the AI Status panel
- Some features require specific APIs:
  - Tone adjustment requires Rewriter API
  - Proofreading requires Proofreader API
  - Translation requires Translator API + Language Detector API
- Enable additional flags in `chrome://flags` for more features
- Features gracefully degrade when APIs unavailable

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
