# Reflexa AI Chrome Extension

A wellness-centered Chrome Extension that transforms everyday reading into calm, reflective micro-sessions with AI-powered insights.

## 🎯 What is Reflexa AI?

Reflexa AI helps you absorb more, stress less, and remember what matters by:

- **Detecting sustained reading** - Monitors your dwell time on articles
- **Gentle nudging** - Shows a floating lotus icon when you've been reading for a while
- **AI-powered insights** - Generates three-bullet summaries (Insight, Surprise, Apply) using Chrome's Gemini Nano
- **Guided reflection** - Provides thoughtful questions to deepen your understanding
- **Calming experience** - Features breathing animations, ambient audio, and a Zen-inspired design
- **Privacy-first** - All AI processing happens locally on your device

## 🚀 Quick Start

1. Install the extension from Chrome Web Store
2. Enable Chrome Built-in AI APIs in Chrome flags (see [User Guide](docs/guides/USER_GUIDE.md))
3. Visit any article and start reading
4. Click the lotus icon when it appears to reflect

## 📚 Documentation

- **[User Guide](docs/guides/USER_GUIDE.md)** - Complete guide to using Reflexa AI
- **[Project Overview](docs/PROJECT_OVERVIEW.md)** - Overview of Reflexa AI
- **[Market Analysis](docs/product/MARKET_ANALYSIS.md)** - Market analysis and opportunity
- **[Privacy Policy](PRIVACY.md)** - Privacy and data handling
- **[Repository Guidelines](AGENTS.md)** - Contributor rules and project structure
- **[Contributor Guide](CONTRIBUTOR_GUIDE.md)** - Architecture, setup, testing, release

## 🤝 Contributing

- Prerequisites: Node 18+, Chrome 131+ with Built‑in AI enabled.
- Setup: `npm install`
- Dev loop: `npm run dev` → `chrome://extensions` → Enable Developer mode → Load unpacked → select `dist/` → reload on changes.
- Tests: `npm run test`, `npm run test:watch`, `npm run test:coverage`
- Quality gates: `npm run check` (type-check, lint, format check). Auto-fix: `npm run lint:fix`, `npm run format`.
- Build: `npm run build` (CI baseline). Preview: `npm run preview`
- Package: `npm run package` (outputs ZIP under `build/`)
- Before PR: Ensure `npm run check` and `npm run build` pass; follow Conventional Commits; add screenshots for popup/options UI changes; link issues.
- Read next: `AGENTS.md` and `CONTRIBUTOR_GUIDE.md` for structure, architecture, and debugging tips.

## ✨ Features

- 🧘 **Gentle reflection prompts** after sustained reading (customizable threshold)
- 🤖 **7 Chrome AI APIs integrated** - Summarizer, Writer, Rewriter, Proofreader, Translator, Language Detector, and Prompt API
- 📝 **AI-powered summarization** in three formats (bullets, paragraph, headline+bullets)
- ✍️ **Draft generation** with tone and length control
- 🎨 **Tone adjustment** with four presets (Calm, Concise, Empathetic, Academic)
- ✅ **Grammar checking** with color-coded diff view
- 🌐 **Translation** support for 10+ languages
- 🔊 **Voice input** with real-time transcription
- 📊 **Reflection history** with streak tracking
- ♿ **Fully accessible** - Keyboard navigation and screen reader support

## 🔒 Privacy & Security

- **100% local processing** - All AI runs on your device
- **No data collection** - Your reflections stay on your device
- **No external API calls** - Uses only Chrome's Built-in AI APIs
- **Export anytime** - Download your reflections as JSON or Markdown

## 🛠️ Requirements

- Chrome 131+ (Canary recommended for latest AI features)
- Chrome Built-in AI APIs enabled (Gemini Nano model)
- ~22GB free space for Gemini Nano model download (one-time)

## 📖 Installation

1. Install from [Chrome Web Store](https://chrome.google.com/webstore) (coming soon)
2. Enable Chrome AI APIs (see [User Guide](docs/guides/USER_GUIDE.md#first-time-setup))
3. Start using Reflexa AI!

## 🆘 Support

- **Documentation**: [User Guide](docs/guides/USER_GUIDE.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/reflexa-ai-chrome-extension/issues)
- **Email**: support@reflexa.app

---

**Built with ❤️ for mindful reading**
