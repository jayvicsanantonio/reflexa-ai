# Reflexa AI Documentation

Welcome to the Reflexa AI Chrome Extension documentation. This guide will help you understand, develop, and extend the extension.

## 📚 Documentation Index

### Getting Started

- **[Project Overview](./PROJECT_OVERVIEW.md)** - High-level overview of the project
- **[User Guide](./USER_GUIDE.md)** - End-user documentation

### Development Documentation

All development documentation is now organized in the **[development/](./development/)** folder:

- **[Development Index](./development/INDEX.md)** - Complete searchable index
- **[Development README](./development/README.md)** - Development overview

#### Quick Links to Development Docs

- **[Chrome AI APIs](./development/chrome-apis/)** - Complete documentation for all 7 Chrome Built-in AI APIs
- **[Testing](./development/testing/)** - Testing guides and results
- **[Architecture](./development/architecture/)** - System architecture and design
- **[Setup](./development/setup/)** - Environment setup and configuration
- **[Build](./development/build/)** - Build process documentation

### Core Documentation

#### Architecture & Design

- **[Architecture](./ARCHITECTURE.md)** - System architecture and component design
- **[Design System](./DESIGN_SYSTEM.md)** - UI/UX design guidelines
- **[Engineering Requirements](./ENGINEERING_REQUIREMENT_DOCUMENT.md)** - Technical requirements
- **[Product Requirements](./PRODUCT_REQUIREMENT_DOCUMENT.md)** - Product specifications

#### API Documentation

- **[API Reference](./API_REFERENCE.md)** - Complete API documentation
- **[Chrome AI APIs Documentation](./development/chrome-apis/)** ⭐ **ORGANIZED** - All 7 Chrome Built-in AI APIs

### Examples & Tutorials

- **[Examples Directory](./examples/)** - Code examples and demos
- **[Integration Examples](./examples/INTEGRATION_EXAMPLE.md)** - Full integration walkthrough
- **[Quick Start Guide](./examples/QUICK_START_NEW_APIS.md)** - Quick start for new APIs
- **[Error Handling Example](./examples/ERROR_HANDLING.md)** - Error handling patterns
- **[Direct API Access](./examples/DIRECT_API_ACCESS.md)** - Direct API usage examples

### Reference Documents

#### Business & Market

- **[Market Opportunity](./MARKET_OPPORTUNITY.md)** - Market analysis
- **[Product Requirements](./PRODUCT_REQUIREMENT_DOCUMENT.md)** - Product specs

---

## 🆕 What's New (October 2025)

### Documentation Organization

We've completely reorganized the documentation for better navigation:

1. **Consolidated Chrome AI APIs** - 7 APIs, each in a single comprehensive file
2. **Organized Development Docs** - Logical folder structure by category
3. **Improved Navigation** - Clear indexes and README files

### Chrome Built-in AI APIs Integration

Reflexa AI now integrates all **7 Chrome Built-in AI APIs** powered by Gemini Nano:

1. **💭 Prompt API** (PromptManager) - Dynamic prompts and structured outputs
2. **✏️ Writer API** (WriterManager) - Content generation with tone control
3. **🖊️ Rewriter API** (RewriterManager) - Content improvement and restructuring
4. **🔤 Proofreader API** (ProofreaderManager) - Grammar and spelling corrections
5. **📄 Summarizer API** (SummarizerManager) - Specialized summarization
6. **🌐 Translator API** (TranslatorManager) - Multilingual support
7. **🔍 Language Detector API** (LanguageDetectorManager) - Language detection

**Key Resources:**

- [Chrome AI APIs Index](./development/chrome-apis/INDEX.md) - Complete API index
- [Chrome AI APIs README](./development/chrome-apis/README.md) - Overview and quick start
- Individual API files (each contains quick reference + complete guide):
  - [WRITER_API.md](./development/chrome-apis/WRITER_API.md)
  - [REWRITER_API.md](./development/chrome-apis/REWRITER_API.md)
  - [PROOFREADER_API.md](./development/chrome-apis/PROOFREADER_API.md)
  - [TRANSLATOR_API.md](./development/chrome-apis/TRANSLATOR_API.md)
  - [LANGUAGE_DETECTOR_API.md](./development/chrome-apis/LANGUAGE_DETECTOR_API.md)
  - [PROMPT_API.md](./development/chrome-apis/PROMPT_API.md)
  - [SUMMARIZER_API.md](./development/chrome-apis/SUMMARIZER_API.md)

---

## 🚀 Quick Links

### For New Developers

1. Read [Project Overview](./PROJECT_OVERVIEW.md)
2. Review [Architecture](./ARCHITECTURE.md)
3. Check [Development Documentation](./development/)
4. Explore [Chrome AI APIs](./development/chrome-apis/)

### For Existing Developers

1. Check [Development Index](./development/INDEX.md)
2. Review [Chrome AI APIs Documentation](./development/chrome-apis/)
3. See [Examples](./examples/)

### For Users

1. Read [User Guide](./USER_GUIDE.md)
2. Check [Troubleshooting](#troubleshooting) section

---

## 📖 Documentation by Role

### Frontend Developers

- [Design System](./DESIGN_SYSTEM.md)
- [Accessibility Testing](./development/testing/ACCESSIBILITY_TESTING.md)
- [Examples](./examples/)

### Backend/API Developers

- [API Reference](./API_REFERENCE.md)
- [Chrome AI APIs](./development/chrome-apis/)
- [Architecture](./ARCHITECTURE.md)

### QA/Testers

- [Testing Documentation](./development/testing/)
- [Performance Testing](./development/testing/PERFORMANCE_TESTING.md)
- [Accessibility Testing](./development/testing/ACCESSIBILITY_TESTING.md)

### Product Managers

- [Product Requirements](./PRODUCT_REQUIREMENT_DOCUMENT.md)
- [Market Opportunity](./MARKET_OPPORTUNITY.md)
- [User Guide](./USER_GUIDE.md)

---

## 🔍 Finding Documentation

### By Topic

**Chrome AI APIs**

- [Chrome AI APIs Index](./development/chrome-apis/INDEX.md)
- [Chrome AI APIs README](./development/chrome-apis/README.md)
- [Individual API Documentation](./development/chrome-apis/)

**Testing & Quality**

- [Testing Documentation](./development/testing/)
- [Performance Testing](./development/testing/PERFORMANCE_TESTING.md)
- [Accessibility Testing](./development/testing/ACCESSIBILITY_TESTING.md)

**Architecture & Design**

- [Architecture Documentation](./development/architecture/)
- [Design System](./DESIGN_SYSTEM.md)

**Setup & Configuration**

- [Setup Documentation](./development/setup/)
- [Build Documentation](./development/build/)

---

## 📁 Documentation Structure

```
docs/
├── README.md (this file)
├── PROJECT_OVERVIEW.md
├── USER_GUIDE.md
│
├── development/                    (Organized development docs)
│   ├── INDEX.md                   (Complete searchable index)
│   ├── README.md                  (Development overview)
│   │
│   ├── chrome-apis/               (11 files - Chrome AI APIs)
│   │   ├── INDEX.md
│   │   ├── README.md
│   │   ├── WRITER_API.md
│   │   ├── REWRITER_API.md
│   │   ├── PROOFREADER_API.md
│   │   ├── TRANSLATOR_API.md
│   │   ├── LANGUAGE_DETECTOR_API.md
│   │   ├── PROMPT_API.md
│   │   ├── SUMMARIZER_API.md
│   │   └── ...
│   │
│   ├── testing/                   (5 files - Testing docs)
│   ├── architecture/              (3 files - Architecture docs)
│   ├── setup/                     (5 files - Setup guides)
│   └── build/                     (1 file - Build docs)
│
├── examples/                       (Code examples)
└── [other core docs]
```

---

## 🆘 Troubleshooting

### Common Issues

**"API not available"**

- Solution: Check Chrome flags are enabled. See [User Guide](./USER_GUIDE.md)
- Check [Chrome AI APIs Setup](./development/setup/GEMINI_NANO_SETUP.md)

**Build errors**

- Solution: Check [Build Scripts](./development/build/BUILD_SCRIPTS.md)

**Testing issues**

- Solution: Check [Testing Documentation](./development/testing/)

---

## 📝 Contributing to Documentation

When updating documentation:

1. **Choose the right location:**
   - Development docs → `development/` folder
   - Examples → `examples/` folder
   - Core docs → root `docs/` folder

2. **Update indexes:**
   - Update `development/INDEX.md` for development docs
   - Update this README.md for major changes

3. **Follow conventions:**
   - Keep it concise and actionable
   - Include code examples
   - Cross-reference related docs

4. **Organize properly:**
   - Chrome AI APIs → `development/chrome-apis/`
   - Testing → `development/testing/`
   - Architecture → `development/architecture/`
   - Setup → `development/setup/`
   - Build → `development/build/`

---

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/reflexa-ai-chrome-extension/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/reflexa-ai-chrome-extension/discussions)

---

**Last Updated**: October 30, 2025
**Version**: 1.0.0
**Documentation Files**: 50+ organized files
