# Chrome AI APIs Documentation

Complete documentation for Chrome's Built-in AI APIs integration in Reflexa AI.

📋 **[Complete Documentation Index](./INDEX.md)** - Navigate all 15+ documentation files

## Quick Navigation

### Individual API Documentation (Consolidated)

Each API now has a single comprehensive file with quick reference + complete guide:

- 📖 [Writer API](./WRITER_API.md) - Generate new content with tone control
- 📖 [Rewriter API](./REWRITER_API.md) - Improve existing text
- 📖 [Proofreader API](./PROOFREADER_API.md) - Fix grammar and spelling
- 📖 [Translator API](./TRANSLATOR_API.md) - Translate between languages
- 📖 [Language Detector API](./LANGUAGE_DETECTOR_API.md) - Detect text language
- 📖 [Prompt API](./PROMPT_API.md) - General-purpose AI interactions
- 📖 [Summarizer API](./SUMMARIZER_API.md) - Summarize content

### Combined Resources

- 📚 [Writing Assistance APIs Complete Guide](./WRITING_ASSISTANCE_APIS_COMPLETE.md) - Writer, Rewriter, and Proofreader in one place
- 🧠 [Chrome AI APIs Integration Plan](./CHROME_AI_APIS.md) - Complete integration overview for all 7 APIs

## Overview

Chrome's Built-in AI APIs provide on-device AI capabilities powered by Gemini Nano. This documentation covers the Writer and Rewriter APIs used in Reflexa AI.

### API Architecture

```
Chrome Built-in AI APIs
│
└── Global Objects (NOT in ai namespace)
    ├── Writer ← Generate new content
    ├── Rewriter ← Improve existing content
    ├── Proofreader ← Grammar and spelling
    ├── Summarizer ← Summarize content
    ├── LanguageModel ← Prompt API
    ├── Translator ← Translate text
    └── LanguageDetector ← Detect languages
```

## Quick Start

### Writer API

```typescript
// Feature detection
if ('Writer' in self) {
  // Check availability
  const availability = await Writer.availability();

  // Create session
  const writer = await Writer.create({
    tone: 'neutral',
    format: 'markdown',
    length: 'medium',
  });

  // Generate text
  const result = await writer.write('Write about mindfulness');

  // Clean up
  writer.destroy();
}
```

### Rewriter API

```typescript
// Feature detection
if ('Rewriter' in self) {
  // Check availability
  const availability = await Rewriter.availability();

  // Create session
  const rewriter = await Rewriter.create({
    tone: 'more-formal',
    format: 'plain-text',
    length: 'as-is',
  });

  // Rewrite text
  const result = await rewriter.rewrite('hey whats up');

  // Clean up
  rewriter.destroy();
}
```

### Proofreader API

```typescript
// Feature detection
if ('Proofreader' in self) {
  // Check availability
  const availability = await Proofreader.availability();

  // Create session
  const proofreader = await Proofreader.create({
    expectedInputLanguages: ['en'],
  });

  // Proofread text
  const result = await proofreader.proofread('I seen him yesterday.');

  // result.correction contains corrected text
  // result.corrections contains array of corrections
  console.log(result.correction); // "I saw him yesterday."

  // Clean up
  proofreader.destroy();
}
```

## Key Differences

| Aspect             | Writer API              | Rewriter API                    | Proofreader API        |
| ------------------ | ----------------------- | ------------------------------- | ---------------------- |
| **Purpose**        | Generate new content    | Improve existing content        | Fix grammar & spelling |
| **Input**          | Prompt/topic            | Existing text                   | Text to correct        |
| **Tone Options**   | formal, neutral, casual | as-is, more-formal, more-casual | N/A                    |
| **Length Options** | short, medium, long     | as-is, shorter, longer          | N/A                    |
| **Config**         | tone, format, length    | tone, format, length            | expectedInputLanguages |
| **Output**         | String                  | String                          | ProofreadResult object |
| **Use Case**       | Draft creation          | Text refinement                 | Error correction       |

## System Requirements

- **Chrome**: Version 137+
- **OS**: Windows 10/11, macOS 13+, Linux, ChromeOS
- **Storage**: 22GB free space
- **GPU**: >4GB VRAM OR CPU: 16GB RAM + 4 cores
- **Network**: Unmetered connection for model download

## Enable APIs

1. Open `chrome://flags`
2. Enable these flags:
   - `#writer-api-for-gemini-nano`
   - `#rewriter-api-for-gemini-nano`
   - `#proofreader-api-for-gemini-nano`
   - `#optimization-guide-on-device-model`
3. Restart Chrome

## Documentation Structure

All API documentation has been consolidated into single comprehensive files. Each file contains:

- **Quick Reference** - One-page summary at the top
- **Complete Guide** - Comprehensive documentation
- **Usage Examples** - Real-world code examples
- **Best Practices** - Recommended patterns
- **Troubleshooting** - Common issues and solutions

### Individual APIs

- [WRITER_API.md](./WRITER_API.md)
- [REWRITER_API.md](./REWRITER_API.md)
- [PROOFREADER_API.md](./PROOFREADER_API.md)
- [TRANSLATOR_API.md](./TRANSLATOR_API.md)
- [LANGUAGE_DETECTOR_API.md](./LANGUAGE_DETECTOR_API.md)
- [PROMPT_API.md](./PROMPT_API.md)
- [SUMMARIZER_API.md](./SUMMARIZER_API.md)

### Combined

- [WRITING_ASSISTANCE_APIS_COMPLETE.md](./WRITING_ASSISTANCE_APIS_COMPLETE.md) - Writer, Rewriter, Proofreader together

## Common Patterns

### Generate Draft with Writer

```typescript
import { WriterManager } from './background/writerManager';

const manager = new WriterManager();
await manager.checkAvailability();

const draft = await manager.generate(
  'Write about reading benefits',
  { tone: 'calm', length: 'medium' },
  'Context about the article'
);
```

### Improve Text with Rewriter

```typescript
import { RewriterManager } from './background/rewriterManager';

const manager = new RewriterManager();
await manager.checkAvailability();

const { original, rewritten } = await manager.rewrite(
  'hey this is cool',
  'academic',
  'For a research paper'
);
```

### Streaming for Long Content

```typescript
// Writer streaming
await writerManager.generateStreaming(
  'Write a long article',
  { tone: 'professional', length: 'long' },
  'Context',
  (chunk) => updateUI(chunk)
);

// Rewriter streaming
await rewriterManager.rewriteStreaming(
  'Long text to improve',
  'empathetic',
  'Context',
  (chunk) => updateUI(chunk)
);
```

## Troubleshooting

### API Not Available

1. Check Chrome version (137+)
2. Enable required flags
3. Verify system requirements
4. Restart Chrome completely

### Slow Performance

1. Use shorter length settings
2. Reduce context size
3. Implement streaming for better UX
4. Check system resources

### Unexpected Output

1. Provide more specific context
2. Use `sharedContext` for consistency
3. Try different tone/length combinations
4. Review official documentation

## Official Resources

- [Writer API Documentation](https://developer.chrome.com/docs/ai/writer-api)
- [Rewriter API Documentation](https://developer.chrome.com/docs/ai/rewriter-api)
- [Proofreader API Documentation](https://developer.chrome.com/docs/ai/proofreader-api)
- [Built-in AI APIs Overview](https://developer.chrome.com/docs/ai/built-in-apis)
- [Writing Assistance APIs Explainer](https://github.com/explainers-by-googlers/writing-assistance-apis/)
- [Proofreader API Explainer](https://github.com/explainers-by-googlers/proofreader-api)
- [Gemini Nano Information](https://deepmind.google/technologies/gemini/nano/)

## Source Code

- [WriterManager](../../../src/background/writerManager.ts)
- [RewriterManager](../../../src/background/rewriterManager.ts)
- [ProofreaderManager](../../../src/background/proofreaderManager.ts)
- [CapabilityDetector](../../../src/background/capabilityDetector.ts)
- [Type Definitions](../../../src/types/chrome-ai.d.ts)

## Contributing

When updating these APIs:

1. Always verify against official Chrome documentation
2. Update type definitions first
3. Update implementation to match types
4. Update all documentation
5. Test with Chrome Canary
6. Run full test suite

## Questions?

1. Check the relevant quick reference
2. Read the comprehensive guide
3. Review the update summaries
4. Consult official Chrome documentation
5. Check the source code

---

**Last Updated**: October 28, 2025
**Chrome Version**: 137+
**Status**: Production Ready ✅
