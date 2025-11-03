# Development Documentation Index

**Last Updated**: October 30, 2025

## Overview

This directory contains all development documentation for Reflexa AI, organized by category for easy navigation.

---

## 📁 Documentation Structure

### 🤖 [chrome-apis/](./chrome-apis/)

Chrome Built-in AI APIs documentation (Writer, Rewriter, Proofreader, Translator, Language Detector, Prompt, Summarizer)

**Key Files:**

- [INDEX.md](./chrome-apis/INDEX.md) - Complete API documentation index
- [README.md](./chrome-apis/README.md) - Overview and quick start
- [CHROME_AI_APIS.md](./chrome-apis/CHROME_AI_APIS.md) - Integration plan for all 7 APIs

**Individual APIs:**

- [WRITER_API.md](./chrome-apis/WRITER_API.md)
- [REWRITER_API.md](./chrome-apis/REWRITER_API.md)
- [PROOFREADER_API.md](./chrome-apis/PROOFREADER_API.md)
- [TRANSLATOR_API.md](./chrome-apis/TRANSLATOR_API.md)
- [LANGUAGE_DETECTOR_API.md](./chrome-apis/LANGUAGE_DETECTOR_API.md)
- [PROMPT_API.md](./chrome-apis/PROMPT_API.md)
- [SUMMARIZER_API.md](./chrome-apis/SUMMARIZER_API.md)

---

### 🧪 [testing/](./testing/)

Testing documentation, test results, and testing strategies

**Files:**

- [ACCESSIBILITY_TESTING.md](./testing/ACCESSIBILITY_TESTING.md) - Accessibility testing guide
- [ACCESSIBILITY_TEST_RESULTS.md](./testing/ACCESSIBILITY_TEST_RESULTS.md) - Accessibility test results
- [MANUAL_ACCESSIBILITY_TESTS.md](./testing/MANUAL_ACCESSIBILITY_TESTS.md) - Manual accessibility test procedures
- [PERFORMANCE_TESTING.md](./testing/PERFORMANCE_TESTING.md) - Performance testing guide
- [AI_PERFORMANCE_TEST_RESULTS.md](./testing/AI_PERFORMANCE_TEST_RESULTS.md) - AI performance test results

---

### 🏗️ [architecture/](./architecture/)

Architecture documentation, design decisions, and system design

**Files:**

- [AI_SERVICE_ARCHITECTURE.md](./architecture/AI_SERVICE_ARCHITECTURE.md) - AI service architecture overview
- [FALLBACK_BEHAVIOR.md](./architecture/FALLBACK_BEHAVIOR.md) - Fallback behavior documentation
- [AI_MANAGER_LOGGING.md](./architecture/AI_MANAGER_LOGGING.md) - AI manager logging strategy

---

### ⚙️ [setup/](./setup/)

Setup guides, configuration, and environment setup

**Files:**

- [GEMINI_NANO_SETUP.md](./setup/GEMINI_NANO_SETUP.md) - Gemini Nano setup guide
- [GEMINI_NANO_APIS_GUIDE.md](./setup/GEMINI_NANO_APIS_GUIDE.md) - Gemini Nano APIs guide
- [ESLINT_PRETTIER_SETUP.md](./setup/ESLINT_PRETTIER_SETUP.md) - ESLint and Prettier setup
- [LINTING_AND_FORMATTING.md](./setup/LINTING_AND_FORMATTING.md) - Linting and formatting guide
- [TAILWIND_V4_UPGRADE.md](./setup/TAILWIND_V4_UPGRADE.md) - Tailwind v4 upgrade guide

---

### 🛠️ [utils/](./utils/)

Utility function documentation

**Files:**

- [LOGGER.md](./utils/LOGGER.md) - Conditional logger utility documentation

---

### 🔨 [build/](./build/)

Build scripts, tooling, and build process documentation

**Files:**

- [BUILD_SCRIPTS.md](./build/BUILD_SCRIPTS.md) - Build scripts documentation

---

## 🚀 Quick Start Guides

### For New Developers

1. **Setup Your Environment**
   - [GEMINI_NANO_SETUP.md](./setup/GEMINI_NANO_SETUP.md)
   - [ESLINT_PRETTIER_SETUP.md](./setup/ESLINT_PRETTIER_SETUP.md)

2. **Understand the Architecture**
   - [AI_SERVICE_ARCHITECTURE.md](./architecture/AI_SERVICE_ARCHITECTURE.md)
   - [FALLBACK_BEHAVIOR.md](./architecture/FALLBACK_BEHAVIOR.md)

3. **Learn the Chrome AI APIs**
   - [chrome-apis/README.md](./chrome-apis/README.md)
   - [chrome-apis/INDEX.md](./chrome-apis/INDEX.md)

### For Testing

1. **Run Tests**
   - [PERFORMANCE_TESTING.md](./testing/PERFORMANCE_TESTING.md)
   - [ACCESSIBILITY_TESTING.md](./testing/ACCESSIBILITY_TESTING.md)

2. **Review Test Results**
   - [AI_PERFORMANCE_TEST_RESULTS.md](./testing/AI_PERFORMANCE_TEST_RESULTS.md)
   - [ACCESSIBILITY_TEST_RESULTS.md](./testing/ACCESSIBILITY_TEST_RESULTS.md)

### For Building

1. **Build Process**
   - [BUILD_SCRIPTS.md](./build/BUILD_SCRIPTS.md)

---

## 📊 Documentation by Topic

### Chrome AI APIs

- All documentation in [chrome-apis/](./chrome-apis/)
- 7 consolidated API references
- Integration guides and examples

### Testing

- Accessibility testing: [testing/ACCESSIBILITY_TESTING.md](./testing/ACCESSIBILITY_TESTING.md)
- Performance testing: [testing/PERFORMANCE_TESTING.md](./testing/PERFORMANCE_TESTING.md)
- Test results in [testing/](./testing/)

### Architecture & Design

- Service architecture: [architecture/AI_SERVICE_ARCHITECTURE.md](./architecture/AI_SERVICE_ARCHITECTURE.md)
- Fallback strategies: [architecture/FALLBACK_BEHAVIOR.md](./architecture/FALLBACK_BEHAVIOR.md)
- Logging: [architecture/AI_MANAGER_LOGGING.md](./architecture/AI_MANAGER_LOGGING.md)

### Setup & Configuration

- Gemini Nano: [setup/GEMINI_NANO_SETUP.md](./setup/GEMINI_NANO_SETUP.md)
- Code quality: [setup/ESLINT_PRETTIER_SETUP.md](./setup/ESLINT_PRETTIER_SETUP.md)
- Styling: [setup/TAILWIND_V4_UPGRADE.md](./setup/TAILWIND_V4_UPGRADE.md)

---

## 🔍 Find Documentation By Task

### I want to...

#### Integrate a Chrome AI API

→ [chrome-apis/](./chrome-apis/) - Start with [README.md](./chrome-apis/README.md)

#### Set up my development environment

→ [setup/GEMINI_NANO_SETUP.md](./setup/GEMINI_NANO_SETUP.md)
→ [setup/ESLINT_PRETTIER_SETUP.md](./setup/ESLINT_PRETTIER_SETUP.md)

#### Understand the system architecture

→ [architecture/AI_SERVICE_ARCHITECTURE.md](./architecture/AI_SERVICE_ARCHITECTURE.md)

#### Run tests

→ [testing/PERFORMANCE_TESTING.md](./testing/PERFORMANCE_TESTING.md)
→ [testing/ACCESSIBILITY_TESTING.md](./testing/ACCESSIBILITY_TESTING.md)

#### Build the project

→ [build/BUILD_SCRIPTS.md](./build/BUILD_SCRIPTS.md)

#### Configure linting and formatting

→ [setup/ESLINT_PRETTIER_SETUP.md](./setup/ESLINT_PRETTIER_SETUP.md)
→ [setup/LINTING_AND_FORMATTING.md](./setup/LINTING_AND_FORMATTING.md)

---

## 📈 Documentation Statistics

| Category     | Files  | Description                            |
| ------------ | ------ | -------------------------------------- |
| chrome-apis  | 11     | Chrome Built-in AI APIs documentation  |
| testing      | 5      | Testing guides and results             |
| architecture | 3      | Architecture and design docs           |
| setup        | 5      | Setup and configuration guides         |
| build        | 1      | Build process documentation            |
| **Total**    | **25** | **Complete development documentation** |

---

## 🤝 Contributing

When adding new documentation:

1. **Choose the right category:**
   - Chrome AI APIs → `chrome-apis/`
   - Testing → `testing/`
   - Architecture → `architecture/`
   - Setup/Config → `setup/`
   - Build/Tools → `build/`

2. **Follow naming conventions:**
   - Use UPPERCASE_WITH_UNDERSCORES.md for general docs
   - Use PascalCase_API.md for API-specific docs
   - Be descriptive and specific

3. **Update this INDEX.md:**
   - Add your new file to the appropriate section
   - Update the statistics table
   - Add quick links if relevant

4. **Cross-reference:**
   - Link to related documentation
   - Update related files to link back

---

## 📝 Recent Updates

- **October 30, 2025**: Consolidated Chrome AI APIs documentation (34 → 11 files)
- **October 30, 2025**: Organized docs/development into logical folders
- **October 28, 2025**: Added comprehensive Chrome AI APIs documentation

---

## 🔗 Related Documentation

- [Main README](../../README.md) - Project overview
- [Examples](../examples/) - Code examples and demos
- [API Reference](../../src/) - Source code documentation

---

**Need help?** Check the relevant category folder or search for keywords in this index.
